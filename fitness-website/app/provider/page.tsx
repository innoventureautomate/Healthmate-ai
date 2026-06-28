"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProviderByOwner } from "@/lib/db/providers";
import { getClientsByProvider } from "@/lib/db/clients";
import { getSessionsByProvider } from "@/lib/db/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Dumbbell, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";

export default function ProviderDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ clients: 0, avgScore: 0, sessions: 0, alerts: 0 });
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [providerName, setProviderName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    (async () => {
      const prov = await getProviderByOwner(profile.uid);
      if (!prov) { setLoading(false); return; }
      setProviderName(prov.name);

      const [clients, sessions] = await Promise.all([
        getClientsByProvider(prov.id),
        getSessionsByProvider(prov.id, 50),
      ]);

      const avg = sessions.length
        ? Math.round(sessions.reduce((s, x) => s + x.postureScore, 0) / sessions.length)
        : 0;
      const alerts = sessions.reduce((s, x) => s + (x.alertCount || 0), 0);

      setStats({ clients: clients.length, avgScore: avg, sessions: sessions.length, alerts });
      setRecentSessions(sessions.slice(0, 5));
      setLoading(false);
    })();
  }, [profile]);

  const cards = [
    { label: "Total Clients", value: stats.clients, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/provider/clients" },
    { label: "Avg Posture Score", value: `${stats.avgScore}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", href: "/provider/reports" },
    { label: "Total Sessions", value: stats.sessions, icon: Dumbbell, color: "text-teal-600", bg: "bg-teal-50", href: "/provider/reports" },
    { label: "Posture Alerts", value: stats.alerts, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50", href: "/provider/reports" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {providerName ? `Welcome back — ${providerName}` : "Welcome back"}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="text-2xl font-bold">{loading ? "—" : value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="font-semibold text-sm">Add a Client</p>
            <p className="text-xs text-muted-foreground">Register a new patient or member.</p>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 mt-1 w-fit" asChild>
              <Link href="/provider/clients/new">Add Client <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="font-semibold text-sm">Assign Exercises</p>
            <p className="text-xs text-muted-foreground">Toggle exercises on/off per client.</p>
            <Button size="sm" variant="outline" className="mt-1 w-fit" asChild>
              <Link href="/provider/assign">Assign <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 flex flex-col gap-2">
            <p className="font-semibold text-sm">View Reports</p>
            <p className="text-xs text-muted-foreground">Posture scores and session trends.</p>
            <Button size="sm" variant="outline" className="mt-1 w-fit" asChild>
              <Link href="/provider/reports">Reports <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent sessions */}
      {recentSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex justify-between items-center py-2 text-sm">
                  <span className="text-muted-foreground">Client session</span>
                  <div className="flex gap-3">
                    <span className={`font-semibold ${s.postureScore >= 70 ? "text-green-600" : "text-orange-500"}`}>
                      {s.postureScore}%
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {s.date?.toDate ? new Date(s.date.toDate()).toLocaleDateString() : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* First-time setup notice */}
      {!loading && !providerName && (
        <Card className="border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <p className="font-semibold text-orange-800">Complete your profile setup</p>
            <p className="text-sm text-orange-700 mt-1">
              Your provider profile hasn&apos;t been set up yet. Contact your admin to activate your account.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
