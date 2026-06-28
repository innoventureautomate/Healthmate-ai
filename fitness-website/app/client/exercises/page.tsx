"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getAllExercises, Exercise } from "@/lib/db/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  posture: "bg-blue-100 text-blue-700", strength: "bg-red-100 text-red-700",
  flexibility: "bg-green-100 text-green-700", balance: "bg-purple-100 text-purple-700", cardio: "bg-orange-100 text-orange-700",
};

const LIVE_LINKS: Record<string, string> = {
  "Live Bicep Curl":    "/workouts/LiveWorkout/LiveBicepCurl",
  "Live Lunge Analysis":  "/workouts/LiveWorkout/LiveLunge",
  "Live Plank Check":     "/workouts/LiveWorkout/LivePlank",
  "Live Push-up Counter": "/workouts/LiveWorkout/LivePushup",
  "Posture Check Session":"/workouts/LiveWorkout/LivePosture",
};

export default function ClientExercisesPage() {
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const assignedIds: string[] = profile.assignedExercises ?? [];
      const all = await getAllExercises();
      const assigned = assignedIds.length > 0
        ? all.filter((e) => assignedIds.includes(e.id))
        : all; // fallback: show all if nothing assigned yet
      setExercises(assigned);
      setLoading(false);
    })();
  }, [profile]);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">My Exercises</h1>
        <p className="text-sm text-muted-foreground">{exercises.length} exercise{exercises.length !== 1 ? "s" : ""} in your programme</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
      ) : exercises.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">No exercises assigned yet. Contact your provider.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {exercises.map((ex) => {
            const liveLink = LIVE_LINKS[ex.name];
            return (
              <Card key={ex.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{ex.name}</p>
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        <Badge className={`text-xs ${CATEGORY_COLORS[ex.category] ?? ""}`}>{ex.category}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{ex.difficulty}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="h-3 w-3" />{ex.duration}m
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>

                  <div className="flex gap-2 mt-3">
                    {liveLink && (
                      <Button size="sm" className="bg-teal-600 hover:bg-teal-700 flex-1 text-xs" asChild>
                        <Link href={liveLink}><ExternalLink className="h-3 w-3 mr-1" />Start AI Session</Link>
                      </Button>
                    )}
                    <Button
                      size="sm" variant="ghost" className="text-xs text-muted-foreground"
                      onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                    >
                      {expanded === ex.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </div>

                  {expanded === ex.id && (
                    <ol className="mt-3 space-y-1 list-decimal list-inside border-t pt-3">
                      {ex.instructions.map((step, i) => (
                        <li key={i} className="text-xs text-muted-foreground">{step}</li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
