"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAllProviders } from "@/lib/db/providers";
import { getAllExercises } from "@/lib/db/exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Dumbbell, Users, Activity, ArrowRight } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ providers: 0, exercises: 0 });

  useEffect(() => {
    Promise.all([getAllProviders(), getAllExercises()]).then(([p, e]) =>
      setStats({ providers: p.length, exercises: e.length })
    );
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">PostureSense platform management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Providers", value: stats.providers, icon: Building2, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/providers" },
          { label: "Exercises", value: stats.exercises, icon: Dumbbell, color: "text-teal-600", bg: "bg-teal-50", href: "/admin/exercises" },
          { label: "Posture AI", value: "Live", icon: Activity, color: "text-green-600", bg: "bg-green-50", href: "/admin/posture" },
          { label: "Total Users", value: "—", icon: Users, color: "text-purple-600", bg: "bg-purple-50", href: "/admin/providers" },
        ].map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className={`inline-flex p-2 rounded-lg ${bg} mb-3`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold text-sm">Manage Providers</p>
            <p className="text-xs text-muted-foreground">Add gyms, physio clinics, and assign roles.</p>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 w-fit" asChild>
              <Link href="/admin/providers">Providers <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold text-sm">Exercise Library</p>
            <p className="text-xs text-muted-foreground">Create, edit, and categorize exercises.</p>
            <Button size="sm" variant="outline" className="w-fit" asChild>
              <Link href="/admin/exercises">Exercises <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold text-sm">Posture Analyzer</p>
            <p className="text-xs text-muted-foreground">Test the live posture detection system.</p>
            <Button size="sm" variant="outline" className="w-fit" asChild>
              <Link href="/admin/posture">Launch <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
