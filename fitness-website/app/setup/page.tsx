"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { db } from "@/firebase-config";
import { useAuth } from "@/lib/auth-context";
import { createExercise, SEED_EXERCISES, getAllExercises } from "@/lib/db/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Activity, AlertTriangle } from "lucide-react";

type Step = "idle" | "running" | "done" | "error";

export default function SetupPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [exerciseCount, setExerciseCount]   = useState<number | null>(null);
  const [step, setStep]                     = useState<Step>("idle");
  const [log, setLog]                       = useState<string[]>([]);
  const [claimed, setClaimed]               = useState(false);

  const push = (msg: string) => setLog((p) => [...p, msg]);

  useEffect(() => {
    getAllExercises().then((ex) => setExerciseCount(ex.length));
  }, []);

  const runSetup = async () => {
    if (!user) return;
    setStep("running");
    setLog([]);

    try {
      // 1. Claim admin role
      push("⚙️  Setting your role to admin…");
      await setDoc(doc(db, "users", user.uid), { role: "admin" }, { merge: true });
      push("✅  Role set to admin");
      setClaimed(true);

      // 2. Seed exercises if needed
      const existing = await getAllExercises();
      if (existing.length > 0) {
        push(`ℹ️  Exercise library already has ${existing.length} exercises — skipping seed`);
      } else {
        push(`📚  Seeding ${SEED_EXERCISES.length} exercises…`);
        let i = 0;
        for (const ex of SEED_EXERCISES) {
          await createExercise(ex);
          i++;
          if (i % 5 === 0) push(`   …seeded ${i}/${SEED_EXERCISES.length}`);
        }
        push(`✅  All ${SEED_EXERCISES.length} exercises seeded`);
        setExerciseCount(SEED_EXERCISES.length);
      }

      push("🎉  Setup complete!");
      setStep("done");
    } catch (err: any) {
      push(`❌  Error: ${err.message}`);
      setStep("error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-blue-600 mb-3">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">PostureSense Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">First-time bootstrap — run once</p>
        </div>

        {/* Status card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Logged in as</span>
              <span className="font-medium truncate max-w-[200px]">{user?.email ?? "—"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Current role</span>
              <Badge variant="outline" className={
                profile?.role === "admin" ? "border-purple-400 text-purple-700" :
                profile?.role === "provider" ? "border-blue-400 text-blue-700" :
                "border-gray-400 text-gray-600"
              }>
                {profile?.role ?? "loading…"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Exercises in DB</span>
              <span className="font-medium">
                {exerciseCount === null ? "checking…" : exerciseCount === 0 ? "⚠️  0 (needs seeding)" : `✅  ${exerciseCount}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Firebase UID</span>
              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded truncate max-w-[180px]">
                {user?.uid ?? "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Already set up */}
        {profile?.role === "admin" && exerciseCount !== null && exerciseCount > 0 && !claimed ? (
          <Card className="border-green-300 bg-green-50">
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Already set up!</p>
                <p className="text-xs text-green-700 mt-0.5">You&apos;re admin with {exerciseCount} exercises ready.</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Action */}
        {step === "idle" && (
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={runSetup}
            disabled={!user}
          >
            {!user ? "Please log in first" : "Run Setup — Claim Admin + Seed Exercises"}
          </Button>
        )}

        {step === "running" && (
          <Button disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running setup…
          </Button>
        )}

        {/* Log output */}
        {log.length > 0 && (
          <Card className="bg-gray-900">
            <CardContent className="p-3">
              <div className="space-y-1 font-mono text-xs text-green-400 max-h-40 overflow-y-auto">
                {log.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="space-y-2">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-4">
                <p className="font-semibold text-green-800 text-sm">Setup complete!</p>
                <p className="text-xs text-green-700 mt-1">
                  Your role is now <strong>admin</strong> and the exercise library is seeded.
                  You may need to sign out and sign back in for the role to take effect.
                </p>
              </CardContent>
            </Card>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => router.push("/admin")}>
                Go to Admin →
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => router.push("/provider")}>
                Go to Provider →
              </Button>
            </div>
          </div>
        )}

        {step === "error" && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-sm text-red-700">Setup failed. Check the log above.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
