"use client";

import { useEffect, useState } from "react";
import {
  getAllExercises, createExercise, updateExercise, deleteExercise,
  Exercise, ExerciseCategory, Difficulty, SEED_EXERCISES,
} from "@/lib/db/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Upload, Search } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  posture: "bg-blue-100 text-blue-700", strength: "bg-red-100 text-red-700",
  flexibility: "bg-green-100 text-green-700", balance: "bg-purple-100 text-purple-700", cardio: "bg-orange-100 text-orange-700",
};

const EMPTY: Omit<Exercise, "id" | "createdAt"> = {
  name: "", description: "", category: "posture", difficulty: "beginner",
  duration: 5, instructions: [], tags: [], isActive: true,
};

export default function AdminExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [seeding,   setSeeding]   = useState(false);
  const [open,      setOpen]      = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editing,   setEditing]   = useState<Exercise | null>(null);
  const [search,    setSearch]    = useState("");
  const [form,      setForm]      = useState(EMPTY);
  const [instrText, setInstrText] = useState("");

  const load = async () => { setExercises(await getAllExercises()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openNew  = () => { setEditing(null); setForm(EMPTY); setInstrText(""); setOpen(true); };
  const openEdit = (e: Exercise) => {
    setEditing(e);
    setForm({ name: e.name, description: e.description, category: e.category, difficulty: e.difficulty, duration: e.duration, instructions: e.instructions, tags: e.tags, isActive: e.isActive });
    setInstrText(e.instructions.join("\n"));
    setOpen(true);
  };

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const instructions = instrText.split("\n").map((s) => s.trim()).filter(Boolean);
    const data = { ...form, instructions };
    if (editing) await updateExercise(editing.id, data);
    else await createExercise(data);
    await load();
    setOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteExercise(id);
    setExercises((p) => p.filter((e) => e.id !== id));
  };

  const handleSeed = async () => {
    if (exercises.length > 0) return;
    setSeeding(true);
    for (const ex of SEED_EXERCISES) await createExercise(ex);
    await load();
    setSeeding(false);
  };

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.category.includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Exercise Library</h1>
          <p className="text-sm text-muted-foreground">{exercises.length} exercises</p>
        </div>
        <div className="flex gap-2">
          {exercises.length === 0 && (
            <Button variant="outline" onClick={handleSeed} disabled={seeding}>
              {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {seeding ? "Seeding…" : "Seed Library"}
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700" onClick={openNew}>
                <Plus className="h-4 w-4 mr-2" />Add Exercise
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Exercise" : "New Exercise"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Exercise name" />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => set("category", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["posture","strength","flexibility","balance","cardio"].map((c) => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Difficulty</Label>
                    <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["beginner","intermediate","advanced"].map((d) => (
                          <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Duration (min)</Label>
                    <Input type="number" min={1} value={form.duration} onChange={(e) => set("duration", Number(e.target.value))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Instructions (one per line)</Label>
                  <Textarea rows={4} value={instrText} onChange={(e) => setInstrText(e.target.value)} placeholder={"Stand tall\nBreathe in\nHold 5 seconds"} />
                </div>
                <div className="space-y-1">
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} placeholder="posture, neck, beginner" />
                </div>
                <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {saving ? "Saving…" : editing ? "Save Changes" : "Create Exercise"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <Card key={ex.id} className={ex.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge className={`text-xs ${CATEGORY_COLORS[ex.category] ?? ""}`}>{ex.category}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{ex.difficulty}</Badge>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{ex.duration}m</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(ex)}>
                    <Pencil className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &ldquo;{ex.name}&rdquo;?</AlertDialogTitle>
                        <AlertDialogDescription>This will remove it from all client assignments.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(ex.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
