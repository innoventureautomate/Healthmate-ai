"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WorkoutsList from "@/components/workouts-list";

export default function WorkoutsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  const handleDifficultyClick = (difficulty: string) => {
    setSelectedDifficulty((prev) => (prev === difficulty ? null : difficulty));
  };

  const handleDurationClick = (duration: string) => {
    setSelectedDuration((prev) => (prev === duration ? null : duration));
  };

  const handleEquipmentClick = (equipment: string) => {
    setSelectedEquipment((prev) => (prev === equipment ? null : equipment));
  };

  return (
    <main className="container mx-auto py-6 sm:py-8 px-4 md:px-6">
      {/* AI ANALYZER SECTION */}
      <div className="mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">AI Analyzers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Live Squat Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="mb-4 text-sm sm:text-base">
                Get real-time feedback on your squat form using our AI.
              </p>
              <Link href="/workouts/LiveWorkout">
                <Button variant="secondary" className="w-full sm:w-auto">Start Live Squat</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Live Pushup Counter</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="mb-4 text-sm sm:text-base">
                Count your reps and check your form with our AI pushup analyzer.
              </p>
              <Link href="/workouts/LiveWorkout/LivePushup">
                <Button variant="secondary" className="w-full sm:w-auto">Start Live Pushup</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Live Bicep Curl Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="mb-4 text-sm sm:text-base">
                Perfect your bicep curl form with real-time AI feedback.
              </p>
              <Link href="/workouts/LiveWorkout/LiveBicepCurl">
                <Button variant="secondary" className="w-full sm:w-auto">Start Bicep Curl</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-violet-600 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Live Plank Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="mb-4 text-sm sm:text-base">
                Hold your plank while AI monitors your posture in real time.
              </p>
              <Link href="/workouts/LiveWorkout/LivePlank">
                <Button variant="secondary" className="w-full sm:w-auto">Start Plank</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Live Lunge Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="mb-4 text-sm sm:text-base">
                Master your lunge technique with AI-powered knee tracking.
              </p>
              <Link href="/workouts/LiveWorkout/LiveLunge">
                <Button variant="secondary" className="w-full sm:w-auto">Start Lunge</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-slate-600 to-blue-700 text-white">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Live Posture Analyzer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="mb-4 text-sm sm:text-base">
                Monitor your sitting posture in real time — protect your back during long meetings.
              </p>
              <Link href="/workouts/LiveWorkout/LivePosture">
                <Button variant="secondary" className="w-full sm:w-auto">Start Posture Check</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Workouts Library</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Find the perfect workout for your fitness goals
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-2">
          <div className="relative flex-1 md:flex-initial md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search workouts..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Filter className="h-4 w-4" />
            <span className="sr-only">Filter</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-6 sm:mb-8">
        <TabsList className="grid grid-cols-5 w-full md:w-auto overflow-x-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
          <TabsTrigger value="strength" className="text-xs sm:text-sm">Strength</TabsTrigger>
          <TabsTrigger value="cardio" className="text-xs sm:text-sm">Cardio</TabsTrigger>
          <TabsTrigger value="flexibility" className="text-xs sm:text-sm">Flexibility</TabsTrigger>
          <TabsTrigger value="hiit" className="text-xs sm:text-sm">HIIT</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 sm:mt-6">
            <Card>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Difficulty Level</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Filter workouts by difficulty</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 p-4 sm:p-6 pt-0">
                {["Beginner", "Intermediate", "Advanced"].map((diff) => (
                  <Button
                    key={diff}
                    variant={selectedDifficulty === diff ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDifficultyClick(diff)}
                  >
                    {diff}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Duration</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Filter by workout length</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 p-4 sm:p-6 pt-0">
                {["< 15 min", "15-30 min", "30+ min"].map((dur) => (
                  <Button
                    key={dur}
                    variant={selectedDuration === dur ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleDurationClick(dur)}
                  >
                    {dur}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Equipment</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Filter by available equipment</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2 p-4 sm:p-6 pt-0">
                {["No Equipment", "Minimal", "Full Gym"].map((eq) => (
                  <Button
                    key={eq}
                    variant={selectedEquipment === eq ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleEquipmentClick(eq)}
                  >
                    {eq}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <WorkoutsList
            searchTerm={searchTerm}
            difficulty={selectedDifficulty}
            duration={selectedDuration}
            equipment={selectedEquipment}
          />
        </TabsContent>

        <TabsContent value="strength">
          <WorkoutsList category="strength" />
        </TabsContent>
        <TabsContent value="cardio">
          <WorkoutsList category="cardio" />
        </TabsContent>
        <TabsContent value="flexibility">
          <WorkoutsList category="flexibility" />
        </TabsContent>
        <TabsContent value="hiit">
          <WorkoutsList category="hiit" />
        </TabsContent>
      </Tabs>
    </main>
  );
}