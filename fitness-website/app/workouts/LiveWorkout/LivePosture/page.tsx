"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { auth, db, rtdb } from "@/firebase-config";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref as rtdbRef, get as rtdbGet, set as rtdbSet } from "firebase/database";
import { getClientByEmail } from "@/lib/db/clients";
import { savePostureSession } from "@/lib/db/sessions";

// ── Thresholds ────────────────────────────────────────────────────────────────
const NECK_THRESHOLD       = 40;    // degrees  (side view)
const TORSO_THRESHOLD      = 10;    // degrees  (side view)
const SIDE_OFFSET_PX       = 100;   // px       shoulders overlap in side view
const SHOULDER_DIFF_THRESH = 0.04;  // normalized y — uneven shoulders (front/back)
const LATERAL_DRIFT_THRESH = 0.05;  // normalized x — spine lateral drift (front/back)
const ALERT_COOLDOWN_MS    = 30_000;

type ViewMode = "side" | "front" | "back" | "unknown";

/** Angle between (vertex → p1) and a vertical line pointing straight up. */
function inclinationAngle(p1: { x: number; y: number }, vertex: { x: number; y: number }): number {
  return Math.round(Math.abs((Math.atan2(p1.x - vertex.x, -(p1.y - vertex.y)) * 180) / Math.PI));
}

export default function LivePosture() {
  const router = useRouter();
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef   = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const sessionStartRef  = useRef<number | null>(null);
  const sessionTimerRef  = useRef<NodeJS.Timeout | null>(null);
  const lastAlertRef     = useRef<number>(0);
  const goodFramesRef    = useRef(0);
  const totalFramesRef   = useRef(0);
  const isFirstFrameRef  = useRef(true);

  // ── State ─────────────────────────────────────────────────────────────────
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [analyzing,   setAnalyzing]   = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [viewMode,    setViewMode]    = useState<ViewMode>("unknown");
  const [neckAngle,   setNeckAngle]   = useState(0);
  const [torsoAngle,  setTorsoAngle]  = useState(0);
  const [shoulderDiff, setShoulderDiff] = useState(0); // front/back metric (px)
  const [lateralDrift, setLateralDrift] = useState(0); // front/back metric (px)
  const [isGoodPosture, setIsGoodPosture] = useState(true);
  const [postureStatus, setPostureStatus] = useState("Position yourself in front of the camera");
  const [sessionDuration, setSessionDuration] = useState(0);
  const [postureScore,    setPostureScore]    = useState(100);
  const [alertCount,      setAlertCount]      = useState(0);
  const [feedback,        setFeedback]        = useState<string[]>([]);

  const formatTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const stopAll = () => {
    if (sessionTimerRef.current) { clearInterval(sessionTimerRef.current); sessionTimerRef.current = null; }
    try { cameraRef.current?.stop(); } catch { /* ignore */ } finally { cameraRef.current = null; }
    try { poseRef.current?.close(); } catch { /* ignore */ } finally { poseRef.current = null; }
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    const c = canvasRef.current;
    if (c) c.getContext("2d")?.clearRect(0, 0, c.width, c.height);
  };

  // ── Drawing ────────────────────────────────────────────────────────────────
  const drawSideView = (
    ctx: CanvasRenderingContext2D,
    earPx: { x: number; y: number },
    shoulderPx: { x: number; y: number },
    hipPx: { x: number; y: number },
    neck: number, torso: number
  ) => {
    const w = ctx.canvas.width;
    const neckColor  = neck  < NECK_THRESHOLD  ? "#22c55e" : "#ef4444";
    const torsoColor = torso < TORSO_THRESHOLD ? "#22c55e" : "#ef4444";
    const fs = Math.max(11, Math.round(w * 0.022));

    // Dashed vertical references
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    for (const pt of [shoulderPx, hipPx]) {
      ctx.beginPath(); ctx.moveTo(pt.x, pt.y - 120); ctx.lineTo(pt.x, pt.y + 10); ctx.stroke();
    }
    ctx.restore();

    // Neckline & torso line
    ctx.setLineDash([]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = neckColor;
    ctx.beginPath(); ctx.moveTo(earPx.x, earPx.y); ctx.lineTo(shoulderPx.x, shoulderPx.y); ctx.stroke();
    ctx.strokeStyle = torsoColor;
    ctx.beginPath(); ctx.moveTo(shoulderPx.x, shoulderPx.y); ctx.lineTo(hipPx.x, hipPx.y); ctx.stroke();

    // Dots
    const dot = (p: { x: number; y: number }, fill: string) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
    };
    dot(earPx, "#06b6d4"); dot(shoulderPx, "#06b6d4"); dot(hipPx, "#06b6d4");

    // Labels
    ctx.font = `bold ${fs}px monospace`;
    ctx.fillStyle = neckColor;
    ctx.fillText(`Neck: ${neck}°`, shoulderPx.x + 10, (earPx.y + shoulderPx.y) / 2);
    ctx.fillStyle = torsoColor;
    ctx.fillText(`Torso: ${torso}°`, hipPx.x + 10, (shoulderPx.y + hipPx.y) / 2);
  };

  const drawSymmetryView = (
    ctx: CanvasRenderingContext2D,
    lm: any[],
    w: number, h: number,
    shoulderDiffN: number, driftN: number,
    isGood: boolean
  ) => {
    const color = isGood ? "#22c55e" : "#ef4444";
    const neutral = "#06b6d4";
    const fs = Math.max(11, Math.round(w * 0.022));

    const pts = {
      rs: { x: lm[11].x * w, y: lm[11].y * h },
      ls: { x: lm[12].x * w, y: lm[12].y * h },
      rh: { x: lm[23].x * w, y: lm[23].y * h },
      lh: { x: lm[24].x * w, y: lm[24].y * h },
    };
    const shoulderMid = { x: (pts.rs.x + pts.ls.x) / 2, y: (pts.rs.y + pts.ls.y) / 2 };
    const hipMid      = { x: (pts.rh.x + pts.lh.x) / 2, y: (pts.rh.y + pts.lh.y) / 2 };

    // Shoulder & hip bars
    ctx.lineWidth = 3; ctx.setLineDash([]);
    const shoulderColor = shoulderDiffN > SHOULDER_DIFF_THRESH ? "#ef4444" : "#22c55e";
    ctx.strokeStyle = shoulderColor;
    ctx.beginPath(); ctx.moveTo(pts.rs.x, pts.rs.y); ctx.lineTo(pts.ls.x, pts.ls.y); ctx.stroke();

    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath(); ctx.moveTo(pts.rh.x, pts.rh.y); ctx.lineTo(pts.lh.x, pts.lh.y); ctx.stroke();

    // Spine centre line (midpoint of shoulders → midpoint of hips)
    const spineColor = driftN > LATERAL_DRIFT_THRESH ? "#ef4444" : "#22c55e";
    ctx.strokeStyle = spineColor;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(shoulderMid.x, shoulderMid.y); ctx.lineTo(hipMid.x, hipMid.y); ctx.stroke();

    // Vertical reference from hip mid
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(hipMid.x, hipMid.y - 140); ctx.lineTo(hipMid.x, hipMid.y + 10); ctx.stroke();
    ctx.restore();

    // Dots
    const dot = (p: { x: number; y: number }, fill: string) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.stroke();
    };
    for (const pt of [pts.rs, pts.ls, pts.rh, pts.lh]) dot(pt, neutral);
    dot(shoulderMid, color); dot(hipMid, color);

    // Labels
    ctx.font = `bold ${fs}px monospace`;
    ctx.fillStyle = shoulderColor;
    ctx.fillText(
      `Shoulders: ${Math.round(shoulderDiffN * 1000) / 10}%`,
      Math.min(pts.rs.x, pts.ls.x),
      Math.min(pts.rs.y, pts.ls.y) - 10
    );
    ctx.fillStyle = spineColor;
    ctx.fillText(
      `Spine drift: ${Math.round(driftN * 1000) / 10}%`,
      hipMid.x + 10,
      (shoulderMid.y + hipMid.y) / 2
    );
  };

  // ── Pose results handler ──────────────────────────────────────────────────
  const handleResults = (results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // First frame: calibrate canvas + start timer
    if (isFirstFrameRef.current) {
      isFirstFrameRef.current = false;
      canvas.width  = videoRef.current?.videoWidth  || 640;
      canvas.height = videoRef.current?.videoHeight || 480;
      setPermissionGranted(true);
      setAnalyzing(true);
      sessionStartRef.current = Date.now();
      sessionTimerRef.current = setInterval(() => {
        if (sessionStartRef.current)
          setSessionDuration(Math.round((Date.now() - sessionStartRef.current) / 1000));
      }, 1000);
      setFeedback([
        "✅ Posture monitoring active!",
        "📐 Sit sideways for neck/torso angles — or face front/back for symmetry check",
      ]);
      setIsLoading(false);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.poseLandmarks) {
      setPostureStatus("No pose detected — adjust your position");
      return;
    }

    const lm = results.poseLandmarks;
    const w  = canvas.width;
    const h  = canvas.height;

    // ── View detection ──────────────────────────────────────────────────────
    const offsetPx = Math.abs(lm[11].x - lm[12].x) * w;
    const isSideView = offsetPx < SIDE_OFFSET_PX;
    const noseVisible = lm[0].visibility > 0.5;
    const detectedView: ViewMode = isSideView ? "side" : noseVisible ? "front" : "back";

    setViewMode(detectedView);
    totalFramesRef.current += 1;

    // ── Side view: neck + torso inclination ────────────────────────────────
    if (isSideView) {
      const useRight = lm[11].visibility >= lm[12].visibility;
      const ear      = useRight ? lm[7]  : lm[8];
      const shoulder = useRight ? lm[11] : lm[12];
      const hip      = useRight ? lm[23] : lm[24];

      const earPx      = { x: ear.x * w,      y: ear.y * h };
      const shoulderPx = { x: shoulder.x * w, y: shoulder.y * h };
      const hipPx      = { x: hip.x * w,      y: hip.y * h };

      const neck  = inclinationAngle(earPx, shoulderPx);
      const torso = inclinationAngle(shoulderPx, hipPx);

      setNeckAngle(neck);
      setTorsoAngle(torso);
      setShoulderDiff(0);
      setLateralDrift(0);

      drawSideView(ctx, earPx, shoulderPx, hipPx, neck, torso);

      const good = neck < NECK_THRESHOLD && torso < TORSO_THRESHOLD;
      setIsGoodPosture(good);
      if (good) {
        goodFramesRef.current += 1;
        setPostureStatus("Good Posture!");
      } else {
        const issues = [
          neck  >= NECK_THRESHOLD  && "Neck too far forward",
          torso >= TORSO_THRESHOLD && "Torso leaning",
        ].filter(Boolean) as string[];
        setPostureStatus(issues.join(" • "));
        const now = Date.now();
        if (now - lastAlertRef.current > ALERT_COOLDOWN_MS) {
          lastAlertRef.current = now;
          setAlertCount((p) => p + 1);
          setFeedback((p) => [...p.slice(-4), `⚠️ ${issues.join(", ")} — sit up straight!`]);
        }
      }
    }

    // ── Front / Back view: shoulder symmetry + lateral spine drift ─────────
    else {
      const shoulderDiffN = Math.abs(lm[11].y - lm[12].y);                          // normalized
      const shoulderMidX  = (lm[11].x + lm[12].x) / 2;
      const hipMidX       = (lm[23].x + lm[24].x) / 2;
      const lateralDriftN = Math.abs(shoulderMidX - hipMidX);                        // normalized

      setNeckAngle(0);
      setTorsoAngle(0);
      setShoulderDiff(Math.round(shoulderDiffN * h));
      setLateralDrift(Math.round(lateralDriftN * w));

      const good = shoulderDiffN < SHOULDER_DIFF_THRESH && lateralDriftN < LATERAL_DRIFT_THRESH;
      setIsGoodPosture(good);

      drawSymmetryView(ctx, lm, w, h, shoulderDiffN, lateralDriftN, good);

      if (good) {
        goodFramesRef.current += 1;
        setPostureStatus(noseVisible ? "Good Posture! (Front view)" : "Good Posture! (Back view)");
      } else {
        const issues = [
          shoulderDiffN >= SHOULDER_DIFF_THRESH && "Shoulders uneven",
          lateralDriftN >= LATERAL_DRIFT_THRESH && "Spine drifting sideways",
        ].filter(Boolean) as string[];
        setPostureStatus(issues.join(" • "));
        const now = Date.now();
        if (now - lastAlertRef.current > ALERT_COOLDOWN_MS) {
          lastAlertRef.current = now;
          setAlertCount((p) => p + 1);
          setFeedback((p) => [...p.slice(-4), `⚠️ ${issues.join(", ")} — straighten up!`]);
        }
      }
    }

    setPostureScore(
      totalFramesRef.current > 0
        ? Math.round((goodFramesRef.current / totalFramesRef.current) * 100)
        : 100
    );
  };

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = async () => {
    setIsLoading(true);
    setFeedback(["📋 Loading MediaPipe Pose model..."]);
    setAlertCount(0); setSessionDuration(0); setPostureScore(100);
    setNeckAngle(0); setTorsoAngle(0); setShoulderDiff(0); setLateralDrift(0);
    setIsGoodPosture(true); setViewMode("unknown");
    setPostureStatus("Initializing...");
    goodFramesRef.current = 0; totalFramesRef.current = 0;
    isFirstFrameRef.current = true; lastAlertRef.current = 0;

    try {
      const { Pose }   = await import("@mediapipe/pose");
      const { Camera } = await import("@mediapipe/camera_utils");

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });
      pose.setOptions({
        modelComplexity: 1, smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      });
      pose.onResults(handleResults);
      poseRef.current = pose;

      if (!videoRef.current) throw new Error("Video element unavailable");

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current)
            await poseRef.current.send({ image: videoRef.current });
        },
        width: 640, height: 480,
      });
      cameraRef.current = camera;
      await camera.start();
    } catch (err) {
      setFeedback([`❌ Failed to start: ${err instanceof Error ? err.message : String(err)}`]);
      setIsLoading(false);
      stopAll();
    }
  };

  // ── End session ────────────────────────────────────────────────────────────
  const endSession = (save = true) => {
    setAnalyzing(false); setPermissionGranted(false);
    stopAll();
    setPostureStatus("Session ended");
    setFeedback((p) => [...p.slice(-3), `✅ Session complete! Score: ${postureScore}% — keep it up!`]);
    if (save) saveSession().catch((e) => console.error("[Session] Save error", e));
  };

  const saveSession = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const durationSec = sessionStartRef.current
      ? Math.round((Date.now() - sessionStartRef.current) / 1000) : 0;

    // Save to psPostureSessions so provider reports can read it
    try {
      const email = user.email ?? "";
      const clientDoc = email ? await getClientByEmail(email) : null;
      if (clientDoc?.providerId) {
        await savePostureSession({
          clientId:    clientDoc.id,
          providerId:  clientDoc.providerId,
          postureScore,
          alertCount,
          durationSec,
          viewMode: viewMode === "unknown" ? "side" : viewMode,
        });
      }
    } catch (e) {
      console.error("[Session] psPostureSessions save failed:", e);
    }

    // Also save to legacy workouts collection
    const calories = Math.round(durationSec * 0.02);
    await addDoc(collection(db, "workouts"), {
      userId: user.uid, type: "posture_check",
      durationSec, postureScore, alertCount, calories, date: serverTimestamp(),
    }).catch(() => {});
  };

  useEffect(() => { return () => { stopAll(); }; }, []);

  // ── View-mode badge text ───────────────────────────────────────────────────
  const viewBadge =
    viewMode === "side"  ? "↔ Side view"  :
    viewMode === "front" ? "⊙ Front view" :
    viewMode === "back"  ? "⊙ Back view"  : "";

  // ── Status banner colour ───────────────────────────────────────────────────
  const bannerClass = !analyzing
    ? "bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-600 dark:text-slate-400"
    : isGoodPosture
    ? "bg-green-100 dark:bg-green-900/30 border-green-500 text-green-700 dark:text-green-300"
    : "bg-red-100 dark:bg-red-900/30 border-red-500 text-red-700 dark:text-red-300";

  return (
    <div className="container mx-auto px-2 py-3 sm:p-4 max-w-7xl">
      <Card className="border-primary/20 border-2">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-xl sm:text-3xl font-bold text-center">
            Live Posture Analyzer
          </CardTitle>
          <p className="text-center text-muted-foreground text-xs sm:text-sm">
            Sitting posture correction — side, front &amp; back view supported
          </p>
        </CardHeader>

        <CardContent className="px-2 pb-3 sm:px-6 sm:pb-6 space-y-3 sm:space-y-6">

          {/* ── Main layout ─────────────────────────────────────────────── */}
          <div className="flex flex-col md:grid md:grid-cols-3 gap-3 sm:gap-4">

            {/* Video + canvas overlay */}
            <div className="md:col-span-2 relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-500">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }} />

              {!permissionGranted && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                  <div className="text-center px-4">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Loading posture model…</p>
                        <p className="text-xs text-gray-400 mt-1">First load may take 10–20s</p>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl sm:text-6xl mb-2">🧍</div>
                        <p className="text-base sm:text-lg font-semibold">Live skeleton overlay</p>
                        <p className="text-xs sm:text-sm text-gray-300 mt-1">
                          Side / Front / Back — all views supported
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Live status badge */}
              {analyzing && (
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                  isGoodPosture ? "bg-green-600" : "bg-red-600"
                }`}>
                  {isGoodPosture ? "✓ Good" : "⚠ Fix"}
                </div>
              )}

              {/* View mode badge */}
              {viewBadge && analyzing && (
                <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-black/60 text-white">
                  {viewBadge}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 py-2 text-white text-center text-xs font-semibold">
                Live Feed + Skeleton
              </div>
            </div>

            {/* Metrics — 2-col grid on mobile, single col on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 sm:gap-3">

              {/* Side-view metrics */}
              <div className={`p-3 sm:p-4 rounded-lg text-center border-2 ${
                viewMode !== "side" || neckAngle < NECK_THRESHOLD
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                  : "bg-red-100 dark:bg-red-900/30 border-red-500"
              }`}>
                <div className={`text-2xl sm:text-4xl font-bold ${
                  viewMode !== "side" || neckAngle < NECK_THRESHOLD
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {viewMode === "side" ? `${neckAngle}°` : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Neck Angle</div>
                <div className="text-xs mt-0.5 font-medium hidden sm:block">
                  {viewMode === "side"
                    ? (neckAngle < NECK_THRESHOLD ? "✓ Good (< 40°)" : "⚠ Forward (≥ 40°)")
                    : "Side view only"}
                </div>
              </div>

              <div className={`p-3 sm:p-4 rounded-lg text-center border-2 ${
                viewMode !== "side" || torsoAngle < TORSO_THRESHOLD
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                  : "bg-red-100 dark:bg-red-900/30 border-red-500"
              }`}>
                <div className={`text-2xl sm:text-4xl font-bold ${
                  viewMode !== "side" || torsoAngle < TORSO_THRESHOLD
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {viewMode === "side" ? `${torsoAngle}°` : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Torso Angle</div>
                <div className="text-xs mt-0.5 font-medium hidden sm:block">
                  {viewMode === "side"
                    ? (torsoAngle < TORSO_THRESHOLD ? "✓ Good (< 10°)" : "⚠ Leaning (≥ 10°)")
                    : "Side view only"}
                </div>
              </div>

              {/* Front/back metrics */}
              <div className={`p-3 sm:p-4 rounded-lg text-center border-2 ${
                viewMode === "side" || shoulderDiff < SHOULDER_DIFF_THRESH * 480
                  ? "bg-green-100 dark:bg-green-900/30 border-green-500"
                  : "bg-red-100 dark:bg-red-900/30 border-red-500"
              }`}>
                <div className={`text-2xl sm:text-4xl font-bold ${
                  viewMode === "side" || shoulderDiff < SHOULDER_DIFF_THRESH * 480
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}>
                  {viewMode !== "side" ? `${shoulderDiff}px` : "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Shoulder Level</div>
                <div className="text-xs mt-0.5 font-medium hidden sm:block">
                  {viewMode !== "side" ? "Front/back view" : "Face camera"}
                </div>
              </div>

              {/* Posture score */}
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 sm:p-4 rounded-lg text-center border-2 border-blue-500">
                <div className="text-2xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {postureScore}%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Posture Score</div>
              </div>

              {/* Session time */}
              <div className="bg-slate-100 dark:bg-slate-800 p-3 sm:p-4 rounded-lg text-center border-2 border-slate-400">
                <div className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300">
                  {formatTime(sessionDuration)}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Session Time</div>
              </div>

              {/* Alert count */}
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 sm:p-4 rounded-lg text-center border-2 border-orange-400">
                <div className="text-2xl sm:text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {alertCount}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Alerts</div>
              </div>
            </div>
          </div>

          {/* ── Status banner ──────────────────────────────────────────────── */}
          <div className={`p-3 sm:p-5 rounded-lg text-center border-2 transition-colors ${bannerClass}`}>
            <div className="text-base sm:text-2xl font-bold leading-tight">{postureStatus}</div>
            <div className="text-xs text-muted-foreground mt-1">Current Status</div>
          </div>

          {/* ── Feedback log ───────────────────────────────────────────────── */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 sm:p-4 max-h-32 sm:max-h-40 overflow-y-auto border-2">
            <h3 className="font-semibold mb-1 text-xs text-muted-foreground">📋 Session Log</h3>
            <div className="space-y-1">
              {feedback.length === 0
                ? <p className="text-xs text-muted-foreground">No messages yet.</p>
                : feedback.map((msg, idx) => (
                  <div key={idx} className="text-xs sm:text-sm p-1.5 rounded bg-muted">{msg}</div>
                ))
              }
            </div>
          </div>

          {/* ── Buttons ────────────────────────────────────────────────────── */}
          <div className="flex gap-2 sm:gap-4 justify-center flex-wrap">
            {!permissionGranted ? (
              <Button
                size="lg"
                onClick={startSession}
                disabled={isLoading}
                className="bg-teal-600 hover:bg-teal-700 px-5 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-semibold"
              >
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading model…</>
                  : "🧍 Start Posture Session"}
              </Button>
            ) : (
              <Button
                variant="destructive" size="lg"
                onClick={() => endSession()}
                className="px-5 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-semibold"
              >
                ⏹️ End Session
              </Button>
            )}
            <Button
              variant="outline" size="lg"
              onClick={() => router.push("/workouts")}
              className="px-5 py-4 sm:px-8 sm:py-6 text-sm sm:text-lg font-semibold"
            >
              ⬅️ Back
            </Button>
          </div>

          {/* ── Setup tips ─────────────────────────────────────────────────── */}
          {!permissionGranted && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong className="text-sm">Three camera positions supported:</strong>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-muted rounded p-2">
                    <p className="font-semibold mb-1">↔ Side view</p>
                    <p>Measures neck &amp; torso inclination. Best for desk posture.</p>
                    <p className="text-muted-foreground mt-1">Neck &lt;40°, Torso &lt;10°</p>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <p className="font-semibold mb-1">⊙ Front view</p>
                    <p>Checks shoulder symmetry &amp; lateral spine drift from the front.</p>
                    <p className="text-muted-foreground mt-1">Auto-detected</p>
                  </div>
                  <div className="bg-muted rounded p-2">
                    <p className="font-semibold mb-1">⊙ Back view</p>
                    <p>Same symmetry checks — works when camera is behind you.</p>
                    <p className="text-muted-foreground mt-1">Auto-detected</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Camera should be at shoulder height. Good lighting essential on iPhone.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
