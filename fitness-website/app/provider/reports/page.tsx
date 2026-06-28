"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProviderByOwner } from "@/lib/db/providers";
import { getClientsByProvider } from "@/lib/db/clients";
import { getSessionsByProvider, PostureSession } from "@/lib/db/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold w-9 text-right">{score}%</span>
    </div>
  );
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const [sessions,  setSessions]  = useState<PostureSession[]>([]);
  const [clients,   setClients]   = useState<any[]>([]);
  const [filter,    setFilter]    = useState<string>("all");
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    (async () => {
      const prov = await getProviderByOwner(profile.uid);
      if (!prov) { setLoading(false); return; }
      const [cl, sess] = await Promise.all([
        getClientsByProvider(prov.id),
        getSessionsByProvider(prov.id, 100),
      ]);
      setClients(cl);
      setSessions(sess);
      setLoading(false);
    })();
  }, [profile]);

  const displayed = filter === "all" ? sessions : sessions.filter((s) => s.clientId === filter);

  const avgScore = displayed.length
    ? Math.round(displayed.reduce((s, x) => s + x.postureScore, 0) / displayed.length) : 0;
  const totalAlerts = displayed.reduce((s, x) => s + (x.alertCount || 0), 0);
  const goodSessions = displayed.filter((s) => s.postureScore >= 70).length;

  // Per-client summary
  const clientSummary = clients.map((c) => {
    const sess = sessions.filter((s) => s.clientId === c.id);
    const avg  = sess.length ? Math.round(sess.reduce((s, x) => s + x.postureScore, 0) / sess.length) : 0;
    return { ...c, sessions: sess.length, avgScore: avg };
  }).sort((a, b) => b.sessions - a.sessions);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted-foreground">Posture monitoring and session history</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Sessions", value: displayed.length, icon: Activity, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Avg Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Good Sessions", value: goodSessions, icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
          { label: "Total Alerts", value: totalAlerts, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="text-2xl font-bold">{loading ? "—" : value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Client leaderboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Client Posture Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {clientSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No session data yet.</p>
          ) : (
            <div className="space-y-3">
              {clientSummary.map((c) => (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground text-xs">{c.sessions} sessions</span>
                  </div>
                  <ScoreBar score={c.avgScore} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Session Log</CardTitle>
        </CardHeader>
        <CardContent>
          {displayed.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No sessions recorded yet.</p>
          ) : (
            <div className="divide-y max-h-72 overflow-y-auto">
              {displayed.map((s) => {
                const client = clients.find((c) => c.id === s.clientId);
                return (
                  <div key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <div>
                      <p className="font-medium">{client?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.viewMode ?? "—"} view · {Math.round(s.durationSec / 60)}min
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.alertCount > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          {s.alertCount} alert{s.alertCount !== 1 ? "s" : ""}
                        </Badge>
                      )}
                      <span className={`font-bold text-sm ${s.postureScore >= 70 ? "text-green-600" : "text-orange-500"}`}>
                        {s.postureScore}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.date?.toDate ? new Date(s.date.toDate()).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
