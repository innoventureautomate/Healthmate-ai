"use client";

import { useEffect, useState } from "react";
import { getAllExercises, Exercise, ExerciseCategory } from "@/lib/db/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Clock, ChevronDown, ChevronUp } from "lucide-react";

const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  posture:     "bg-blue-100 text-blue-700",
  strength:    "bg-red-100 text-red-700",
  flexibility: "bg-green-100 text-green-700",
  balance:     "bg-purple-100 text-purple-700",
  cardio:      "bg-orange-100 text-orange-700",
};

const CATEGORIES: ExerciseCategory[] = ["posture", "strength", "flexibility", "balance", "cardio"];

export default function ProviderExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState<ExerciseCategory | "all">("all");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    getAllExercises().then((ex) => { setExercises(ex); setLoading(false); });
  }, []);

  const filtered = exercises.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || e.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Exercise Repository</h1>
        <p className="text-muted-foreground text-sm">{exercises.length} exercises available</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search exercises…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={category === "all" ? "default" : "outline"} onClick={() => setCategory("all")}>All</Button>
          {CATEGORIES.map((c) => (
            <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)} className="capitalize">{c}</Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading exercises…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((ex) => (
            <Card key={ex.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{ex.name}</p>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      <Badge className={`text-xs ${CATEGORY_COLORS[ex.category]}`}>{ex.category}</Badge>
                      <Badge variant="outline" className="text-xs capitalize">{ex.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" />{ex.duration}m
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ex.description}</p>
                <Button
                  variant="ghost" size="sm" className="mt-2 w-full text-xs h-7 text-muted-foreground"
                  onClick={() => setExpanded(expanded === ex.id ? null : ex.id)}
                >
                  {expanded === ex.id ? <><ChevronUp className="h-3 w-3 mr-1" />Hide steps</> : <><ChevronDown className="h-3 w-3 mr-1" />View steps</>}
                </Button>
                {expanded === ex.id && (
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    {ex.instructions.map((step, i) => (
                      <li key={i} className="text-xs text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
