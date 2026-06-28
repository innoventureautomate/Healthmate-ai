"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import PsSidebar from "@/components/ps-sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "admin")) router.replace("/login");
  }, [user, profile, loading, router]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
    </div>
  );

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <PsSidebar role="admin" />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
