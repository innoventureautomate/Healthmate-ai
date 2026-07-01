"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getProviderByOwner } from "@/lib/db/providers";
import { getClientsByProvider } from "@/lib/db/clients";
import { getSessionsByProvider, PostureSession } from "@/lib/db/sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Activity, AlertTriangle, Clock, Eye, Ruler } from "lucide-react";

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
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {displayed.map((s) => {
                const client  = clients.find((c) => c.id === s.clientId);
                const score   = s.postureScore;
                const scoreColor = score >= 80 ? "text-green-600 bg-green-50 border-green-200"
                                 : score >= 60 ? "text-yellow-700 bg-yellow-50 border-yellow-200"
                                 :               "text-red-600 bg-red-50 border-red-200";
                const dateStr = s.date?.toDate
                  ? new Date(s.date.toDate()).toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" })
                  : "—";
                const mins = Math.floor(s.durationSec / 60);
                const secs = s.durationSec % 60;
                const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                const viewLabel = s.viewMode === "side" ? "↔ Side" : s.viewMode === "front" ? "⊙ Front" : s.viewMode === "back" ? "⊙ Back" : "—";

                return (
                  <div key={s.id} className="rounded-xl border p-4 space-y-3 bg-white">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm shrink-0">
                          {client?.name?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{client?.name ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{dateStr}</p>
                        </div>
                      </div>
                      <div className={`text-xl font-bold px-3 py-1 rounded-lg border ${scoreColor}`}>
                        {score}%
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full transition-all ${score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span className="font-medium text-foreground">{durationStr}</span>
                        <span>duration</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Eye className="h-3 w-3 shrink-0" />
                        <span className="font-medium text-foreground">{viewLabel}</span>
                        <span>view</span>
                      </div>
                      {s.neckAngle != null && s.neckAngle > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Ruler className="h-3 w-3 shrink-0" />
                          <span className={`font-medium ${s.neckAngle > 40 ? "text-red-600" : "text-green-600"}`}>{s.neckAngle}°</span>
                          <span>neck angle</span>
                        </div>
                      )}
                      {s.torsoAngle != null && s.torsoAngle > 0 && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Ruler className="h-3 w-3 shrink-0" />
                          <span className={`font-medium ${s.torsoAngle > 10 ? "text-red-600" : "text-green-600"}`}>{s.torsoAngle}°</span>
                          <span>torso angle</span>
                        </div>
                      )}
                    </div>

                    {/* Alerts */}
                    {s.alertCount > 0 && (
                      <div className="flex items-center gap-2 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-lg px-3 py-1.5">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span><strong>{s.alertCount} posture alert{s.alertCount !== 1 ? "s" : ""}</strong> triggered during session</span>
                      </div>
                    )}
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
