import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function AdminPosturePage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Posture Analyzer</h1>
        <p className="text-sm text-muted-foreground">Test and configure the AI posture detection system</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Live Session</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Run a live posture analysis session to test the detection accuracy.</p>
            <p className="text-xs text-muted-foreground">Supports: Side view (neck/torso angles), Front view, Back view (shoulder symmetry + spine drift)</p>
            <Button className="bg-teal-600 hover:bg-teal-700 mt-2" asChild>
              <Link href="/workouts/LiveWorkout/LivePosture" target="_blank">
                Launch Posture AI <ExternalLink className="h-3 w-3 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Detection Thresholds</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {[
                ["Neck inclination (bad)", "≥ 40°"],
                ["Torso inclination (bad)", "≥ 10°"],
                ["Shoulder height diff", "≥ 4% of frame height"],
                ["Lateral spine drift", "≥ 5% of frame width"],
                ["Side-view threshold", "Shoulder offset < 100px"],
                ["Alert cooldown", "30 seconds"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
