"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase-config";
import { useAuth } from "@/lib/auth-context";
import { createProvider } from "@/lib/db/providers";
import { createClient, getClientByEmail, toggleExercise } from "@/lib/db/clients";
import { getAllExercises } from "@/lib/db/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Activity, Copy, ExternalLink } from "lucide-react";
import Link from "next/link";

const DEMO_PROVIDER_EMAIL    = "provider@posturesense.demo";
const DEMO_PROVIDER_PASSWORD = "Demo@1234";
const DEMO_CLIENT_EMAIL      = "client@posturesense.demo";
const DEMO_CLIENT_PASSWORD   = "Demo@1234";

type Step = "idle" | "running" | "done" | "error";

export default function DemoSetupPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [log,  setLog]  = useState<string[]>([]);
  const [creds, setCreds] = useState<{ providerEmail: string; clientEmail: string; password: string } | null>(null);

  const push = (msg: string) => setLog((p) => [...p, msg]);

  const runDemo = async () => {
    if (!user || profile?.role !== "admin") return;
    setStep("running");
    setLog([]);

    try {
      const exercises = await getAllExercises();
      if (exercises.length === 0) {
        push("❌  No exercises found — run /setup first to seed the library");
        setStep("error");
        return;
      }
      push(`✅  Found ${exercises.length} exercises in library`);

      // ── 1. Create provider Firebase Auth account ──────────────────────────
      push("👤  Creating provider account…");
      let providerUid: string;
      try {
        const { user: provUser } = await createUserWithEmailAndPassword(
          auth, DEMO_PROVIDER_EMAIL, DEMO_PROVIDER_PASSWORD
        );
        providerUid = provUser.uid;
        push(`✅  Provider auth account created (${DEMO_PROVIDER_EMAIL})`);
      } catch (e: any) {
        if (e.code === "auth/email-already-in-use") {
          push(`ℹ️  Provider account already exists — continuing`);
          // We can't get the UID without signing in; check Firestore for a user with this email
          const snap = await import("firebase/firestore").then(({ query, collection, where, getDocs }) =>
            getDocs(query(collection(db, "users"), where("email", "==", DEMO_PROVIDER_EMAIL)))
          );
          if (snap.empty) throw new Error("Provider Firestore profile not found — clear demo accounts in Firebase Console and retry");
          providerUid = snap.docs[0].id;
        } else throw e;
      }

      // ── 2. Set provider role in Firestore users doc ───────────────────────
      await setDoc(doc(db, "users", providerUid), {
        name: "Dr. Priya Sharma",
        email: DEMO_PROVIDER_EMAIL,
        role: "provider",
        createdAt: serverTimestamp(),
      }, { merge: true });
      push("✅  Provider role set in Firestore");

      // ── 3. Create psProviders doc ─────────────────────────────────────────
      push("🏥  Creating provider clinic…");
      let providerId: string;
      try {
        providerId = await createProvider({
          name: "PhysioFit Clinic",
          type: "physio",
          email: DEMO_PROVIDER_EMAIL,
          phone: "+91 98765 43210",
          address: "Mumbai, Maharashtra",
          ownerId: providerUid,
          isActive: true,
        });
        push(`✅  Clinic "PhysioFit Clinic" created`);
      } catch (e: any) {
        if (e.message?.includes("already exists")) {
          push("ℹ️  Provider clinic already exists — skipping");
          const { getProviderByOwner } = await import("@/lib/db/providers");
          const prov = await getProviderByOwner(providerUid);
          if (!prov) throw new Error("Provider record not found");
          providerId = prov.id;
        } else throw e;
      }

      // ── 4. Create client Firebase Auth account ────────────────────────────
      push("👤  Creating client account…");
      try {
        const { user: clientUser } = await createUserWithEmailAndPassword(
          auth, DEMO_CLIENT_EMAIL, DEMO_CLIENT_PASSWORD
        );
        await setDoc(doc(db, "users", clientUser.uid), {
          name: "Rahul Mehta",
          email: DEMO_CLIENT_EMAIL,
          role: "client",
          createdAt: serverTimestamp(),
        }, { merge: true });
        push(`✅  Client auth account created (${DEMO_CLIENT_EMAIL})`);
      } catch (e: any) {
        if (e.code === "auth/email-already-in-use") {
          push("ℹ️  Client account already exists — continuing");
        } else throw e;
      }

      // ── 5. Create psClients doc ───────────────────────────────────────────
      push("📋  Creating client record…");
      let clientId: string | null = null;
      const existingClient = await getClientByEmail(DEMO_CLIENT_EMAIL);
      if (existingClient) {
        clientId = existingClient.id;
        push("ℹ️  Client record already exists — reusing");
      } else {
        clientId = await createClient({
          name: "Rahul Mehta",
          email: DEMO_CLIENT_EMAIL,
          phone: "+91 98123 45678",
          condition: "Chronic lower back pain from desk work",
          notes: "Software engineer, 8+ hours/day at desk. Experiencing neck and lumbar stiffness.",
          providerId,
          assignedExercises: [],
        });
        push("✅  Client record created");
      }

      // ── 6. Assign 5 exercises ─────────────────────────────────────────────
      push("🏋️  Assigning exercises to client…");
      const toAssign = exercises.slice(0, 5).map((e) => e.id);
      for (const eid of toAssign) {
        await toggleExercise(clientId, eid, true);
      }
      push(`✅  ${toAssign.length} exercises assigned`);

      push("🎉  Demo environment ready!");
      setCreds({
        providerEmail: DEMO_PROVIDER_EMAIL,
        clientEmail: DEMO_CLIENT_EMAIL,
        password: DEMO_PROVIDER_PASSWORD,
      });
      setStep("done");
    } catch (err: any) {
      push(`❌  ${err.message}`);
      setStep("error");
    }
  };

  const copy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="text-center pt-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-blue-600 mb-3">
            <Activity className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Demo Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">Creates demo provider + client accounts with realistic data</p>
        </div>

        {/* Auth check */}
        {profile?.role !== "admin" && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="p-4 text-sm text-orange-700">
              You must be logged in as <strong>admin</strong> to run this. Visit{" "}
              <Link href="/setup" className="underline">/setup</Link> first.
            </CardContent>
          </Card>
        )}

        {/* What this creates */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">What gets created</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <div className="flex items-center gap-2"><span className="text-blue-600 font-medium">Provider</span> — Dr. Priya Sharma · PhysioFit Clinic</div>
            <div className="flex items-center gap-2"><span className="text-teal-600 font-medium">Client</span> — Rahul Mehta · chronic back pain profile</div>
            <div className="flex items-center gap-2"><span className="text-purple-600 font-medium">Exercises</span> — 5 exercises assigned to the client</div>
            <div className="flex items-center gap-2 font-mono text-xs bg-muted rounded p-2 mt-1">Both accounts use password: <strong>Demo@1234</strong></div>
          </CardContent>
        </Card>

        {/* Button */}
        {step === "idle" && (
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={runDemo}
            disabled={!user || profile?.role !== "admin"}
          >
            Create Demo Data
          </Button>
        )}
        {step === "running" && (
          <Button disabled className="w-full">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up…
          </Button>
        )}

        {/* Log */}
        {log.length > 0 && (
          <Card className="bg-gray-900">
            <CardContent className="p-3">
              <div className="space-y-1 font-mono text-xs text-green-400 max-h-48 overflow-y-auto">
                {log.map((line, i) => <div key={i}>{line}</div>)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Done — credentials */}
        {step === "done" && creds && (
          <div className="space-y-3">
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-4">
                <p className="font-semibold text-green-800 text-sm mb-3">Demo accounts ready</p>
                <div className="space-y-2">
                  {[
                    { label: "Provider login", email: creds.providerEmail, role: "provider" },
                    { label: "Client login",   email: creds.clientEmail,   role: "client" },
                  ].map(({ label, email, role }) => (
                    <div key={email} className="bg-white rounded-lg p-3 border flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-sm font-mono font-medium">{email}</p>
                        <p className="text-xs text-muted-foreground font-mono">pw: {creds.password}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant="outline" className="text-xs capitalize">{role}</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(email)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Demo flow */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Demo flow</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Step 1 — Provider</p>
                <p>Log in as provider → /provider dashboard → clients → view Rahul Mehta → assign/exercises</p>
                <p className="font-semibold text-foreground mt-2">Step 2 — Client</p>
                <p>Log in as client → /client dashboard → My Exercises (see assigned list) → Start Posture Check</p>
                <p className="font-semibold text-foreground mt-2">Step 3 — Live AI</p>
                <p>LivePosture analyzer opens camera → side/front/back view auto-detected → real-time neck + spine angles</p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link href="/provider"><ExternalLink className="h-3 w-3 mr-1" />Provider Portal</Link>
              </Button>
              <Button className="bg-teal-600 hover:bg-teal-700" asChild>
                <Link href="/login">Switch Account →</Link>
              </Button>
            </div>
          </div>
        )}

        {step === "error" && (
          <Button variant="outline" className="w-full" onClick={() => { setStep("idle"); setLog([]); }}>
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}
