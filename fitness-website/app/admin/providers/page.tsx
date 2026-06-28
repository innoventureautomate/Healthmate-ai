"use client";

import { useEffect, useState } from "react";
import { getAllProviders, createProvider, updateProvider, deleteProvider, Provider, ProviderType } from "@/lib/db/providers";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase-config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Building2 } from "lucide-react";

const EMPTY_FORM = { name: "", type: "physio" as ProviderType, email: "", phone: "", address: "", ownerId: "" };

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [open,      setOpen]      = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editing,   setEditing]   = useState<Provider | null>(null);
  const [form,      setForm]      = useState(EMPTY_FORM);

  const load = async () => { setProviders(await getAllProviders()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (p: Provider) => {
    setEditing(p);
    setForm({ name: p.name, type: p.type, email: p.email, phone: p.phone ?? "", address: p.address ?? "", ownerId: p.ownerId });
    setOpen(true);
  };

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name || !form.email) return;
    setSaving(true);
    if (editing) {
      await updateProvider(editing.id, form);
    } else {
      const id = await createProvider({ ...form, isActive: true });
      // Also set the user's role to provider in Firestore if ownerId provided
      if (form.ownerId) {
        await setDoc(doc(db, "users", form.ownerId), { role: "provider" }, { merge: true });
      }
    }
    await load();
    setOpen(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteProvider(id);
    setProviders((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Providers</h1>
          <p className="text-sm text-muted-foreground">{providers.length} registered providers</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" />Add Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Provider" : "Add Provider"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label>Organisation Name *</Label>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="City Physio Clinic" />
                </div>
                <div className="space-y-1">
                  <Label>Type *</Label>
                  <Select value={form.type} onValueChange={(v) => set("type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["physio", "gym", "clinic", "other"].map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Owner Firebase UID</Label>
                  <Input value={form.ownerId} onChange={(e) => set("ownerId", e.target.value)} placeholder="Firebase Auth UID of the admin user" />
                  <p className="text-xs text-muted-foreground">Found in Firebase console → Authentication</p>
                </div>
              </div>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 mt-2" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Provider"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>
      ) : providers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No providers yet. Add your first gym or physio clinic.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {providers.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Building2 className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{p.type}</Badge>
                </div>
                {p.address && <p className="text-xs text-muted-foreground mt-2">{p.address}</p>}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
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
                        <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(p.id)}>Delete</AlertDialogAction>
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
