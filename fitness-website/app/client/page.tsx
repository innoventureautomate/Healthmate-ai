"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getClientByEmail } from "@/lib/db/clients";
import { getAllExercises, Exercise } from "@/lib/db/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Dumbbell, ArrowRight, Clock } from "lucide-react";

const LIVE_LINKS: Record<string, string> = {
  "Live Bicep Curl":      "/workouts/LiveWorkout/LiveBicepCurl",
  "Live Lunge Analysis":  "/workouts/LiveWorkout/LiveLunge",
  "Live Plank Check":     "/workouts/LiveWorkout/LivePlank",
  "Live Push-up Counter": "/workouts/LiveWorkout/LivePushup",
  "Posture Check Session":"/workouts/LiveWorkout/LivePosture",
};

export default function ClientDashboard() {
  const { profile } = useAuth();
  const [assignedExercises, setAssignedExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.email) return;
    (async () => {
      const [clientDoc, all] = await Promise.all([
        getClientByEmail(profile.email),
        getAllExercises(),
      ]);
      const assignedIds: string[] =
        clientDoc?.assignedExercises?.length
          ? clientDoc.assignedExercises
          : (profile.assignedExercises ?? []);
      if (assignedIds.length > 0) {
        setAssignedExercises(all.filter((e) => assignedIds.includes(e.id)));
      }
      setLoading(false);
    })();
  }, [profile]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back, {profile?.name ?? "there"}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-teal-500 to-blue-600 text-white border-0">
          <CardContent className="p-5">
            <Activity className="h-8 w-8 mb-3 opacity-90" />
            <h3 className="font-bold text-lg">Start Posture Check</h3>
            <p className="text-sm opacity-80 mt-1">Analyse your sitting posture in real time.</p>
            <Button className="mt-4 bg-white text-teal-700 hover:bg-gray-100" asChild>
              <Link href="/client/posture">Start Now <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <Dumbbell className="h-8 w-8 mb-3 text-teal-600" />
            <h3 className="font-bold text-lg">My Exercises</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? "Loading…" : `${assignedExercises.length} exercise${assignedExercises.length !== 1 ? "s" : ""} assigned`}
            </p>
            <Button className="mt-4 bg-teal-600 hover:bg-teal-700" asChild>
              <Link href="/client/exercises">View Exercises <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Assigned exercises preview */}
      {assignedExercises.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Today&apos;s Programme</h2>
          <div className="space-y-2">
            {assignedExercises.slice(0, 4).map((ex) => {
              const href = LIVE_LINKS[ex.name] ?? "/client/exercises";
              return (
                <Link key={ex.id} href={href} className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">{ex.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{ex.duration} min</span>
                      <Badge variant="outline" className="text-xs ml-1 capitalize">{ex.difficulty}</Badge>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
            {assignedExercises.length > 4 && (
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/client/exercises">+{assignedExercises.length - 4} more exercises</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
