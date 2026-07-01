"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getProviderByOwner } from "@/lib/db/providers";
import { getClientsByProvider, toggleExercise, Client } from "@/lib/db/clients";
import { getAllExercises, Exercise, ExerciseCategory } from "@/lib/db/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  posture:     "bg-blue-100 text-blue-700",
  strength:    "bg-red-100 text-red-700",
  flexibility: "bg-green-100 text-green-700",
  balance:     "bg-purple-100 text-purple-700",
  cardio:      "bg-orange-100 text-orange-700",
};

export default function AssignPage() {
  return <Suspense><AssignPageInner /></Suspense>;
}

function AssignPageInner() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const preselect    = searchParams.get("client");

  const [clients,     setClients]     = useState<Client[]>([]);
  const [exercises,   setExercises]   = useState<Exercise[]>([]);
  const [selectedId,  setSelectedId]  = useState<string>(preselect ?? "");
  const [assigned,    setAssigned]    = useState<Set<string>>(new Set());
  const [saving,      setSaving]      = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    (async () => {
      const prov = await getProviderByOwner(profile.uid);
      if (!prov) { setLoading(false); return; }
      const [cl, ex] = await Promise.all([getClientsByProvider(prov.id), getAllExercises()]);
      setClients(cl);
      setExercises(ex);
      if (preselect) {
        const client = cl.find((c) => c.id === preselect);
        if (client) setAssigned(new Set(client.assignedExercises));
      }
      setLoading(false);
    })();
  }, [profile, preselect]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    const client = clients.find((c) => c.id === id);
    setAssigned(new Set(client?.assignedExercises ?? []));
  };

  const handleToggle = async (exerciseId: string, checked: boolean, exName: string) => {
    if (!selectedId) return;
    setSaving(exerciseId);
    try {
      await toggleExercise(selectedId, exerciseId, checked);
      setAssigned((prev) => {
        const next = new Set(prev);
        checked ? next.add(exerciseId) : next.delete(exerciseId);
        return next;
      });
      setClients((prev) => prev.map((c) => {
        if (c.id !== selectedId) return c;
        const set = new Set(c.assignedExercises);
        checked ? set.add(exerciseId) : set.delete(exerciseId);
        return { ...c, assignedExercises: Array.from(set) };
      }));
      toast({ title: checked ? `✅ "${exName}" assigned` : `❌ "${exName}" removed` });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
    setSaving(null);
  };

  const selectedClient = clients.find((c) => c.id === selectedId);

  // Group exercises by category
  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    (acc[ex.category] ??= []).push(ex);
    return acc;
  }, {});

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Assign Exercises</h1>
        <p className="text-sm text-muted-foreground">Toggle exercises on/off for each client</p>
      </div>

      <div className="max-w-xs">
        <Select value={selectedId} onValueChange={handleSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select a client…" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.assignedExercises?.length ?? 0} assigned
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedId && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Select a client above to manage their exercise assignments.
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 border border-teal-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-200 text-teal-800 font-bold text-sm">
              {selectedClient.name[0]}
            </div>
            <div>
              <p className="font-semibold text-sm">{selectedClient.name}</p>
              <p className="text-xs text-muted-foreground">{assigned.size} exercises assigned</p>
            </div>
            {assigned.size > 0 && <CheckCircle2 className="h-4 w-4 text-teal-600 ml-auto" />}
          </div>

          <div className="space-y-6">
            {Object.entries(grouped).map(([cat, exList]) => (
              <div key={cat}>
                <h3 className="text-sm font-semibold capitalize mb-3 flex items-center gap-2">
                  <Badge className={CATEGORY_COLORS[cat as ExerciseCategory]}>{cat}</Badge>
                  <span className="text-muted-foreground font-normal">{exList.length} exercises</span>
                </h3>
                <div className="space-y-2">
                  {exList.map((ex) => {
                    const isAssigned = assigned.has(ex.id);
                    const isSaving   = saving === ex.id;
                    return (
                      <div
                        key={ex.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          isAssigned ? "bg-teal-50 border-teal-200" : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isAssigned ? "text-teal-800" : ""}`}>{ex.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{ex.duration} min</span>
                            <span className="text-xs text-muted-foreground capitalize">• {ex.difficulty}</span>
                          </div>
                        </div>
                        {isSaving
                          ? <Loader2 className="h-4 w-4 animate-spin text-teal-600 ml-4" />
                          : <Switch
                              checked={isAssigned}
                              onCheckedChange={(v) => handleToggle(ex.id, v, ex.name)}
                              className="data-[state=checked]:bg-teal-600 ml-4"
                            />
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
