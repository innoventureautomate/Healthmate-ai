"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getProviderByOwner } from "@/lib/db/providers";
import { createClient } from "@/lib/db/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewClientPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", dob: "", condition: "", notes: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.uid) return;
    setSaving(true);
    try {
      const prov = await getProviderByOwner(profile.uid);
      if (!prov) throw new Error("Provider not found");
      await createClient({ ...form, providerId: prov.id, assignedExercises: [] });
      router.push("/provider/clients");
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/provider/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Add New Client</h1>
          <p className="text-sm text-muted-foreground">Fill in the client&apos;s details</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="condition">Condition / Diagnosis</Label>
              <Input id="condition" value={form.condition} onChange={(e) => set("condition", e.target.value)} placeholder="e.g. Chronic lower back pain, poor desk posture" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Additional notes for this client…" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {saving ? "Saving…" : "Add Client"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/provider/clients">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
