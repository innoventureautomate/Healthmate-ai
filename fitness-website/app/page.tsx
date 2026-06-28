"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Activity } from "lucide-react";

export default function RootPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (!profile) return;
    if (profile.role === "admin")         router.replace("/admin");
    else if (profile.role === "provider") router.replace("/provider");
    else                                  router.replace("/client");
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-blue-600">
        <Activity className="h-6 w-6 text-white" />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      <p className="text-sm text-muted-foreground">Loading PostureSense…</p>
    </div>
  );
}
