"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClientById, updateClient, Client } from "@/lib/db/clients";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", dob: "", condition: "", notes: "" });

  useEffect(() => {
    if (!id) return;
    getClientById(id).then((c) => {
      if (!c) return;
      setClient(c);
      setForm({ name: c.name, email: c.email, phone: c.phone ?? "", dob: c.dob ?? "", condition: c.condition ?? "", notes: c.notes ?? "" });
    });
  }, [id]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateClient(id, form);
    router.push("/provider/clients");
  };

  if (!client) return (
    <div className="flex h-48 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/provider/clients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Edit Client</h1>
          <p className="text-sm text-muted-foreground">{client.name}</p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Condition / Diagnosis</Label>
              <Input value={form.condition} onChange={(e) => set("condition", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {saving ? "Saving…" : "Save Changes"}
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
