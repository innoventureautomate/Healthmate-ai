"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getProviderByOwner } from "@/lib/db/providers";
import { getClientsByProvider, deleteClient, Client } from "@/lib/db/clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Trash2, Pencil, Dumbbell } from "lucide-react";

export default function ClientsPage() {
  const { profile } = useAuth();
  const [clients, setClients]     = useState<Client[]>([]);
  const [providerId, setProviderId] = useState("");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    (async () => {
      const prov = await getProviderByOwner(profile.uid);
      if (!prov) { setLoading(false); return; }
      setProviderId(prov.id);
      const list = await getClientsByProvider(prov.id);
      setClients(list);
      setLoading(false);
    })();
  }, [profile]);

  const handleDelete = async (id: string) => {
    await deleteClient(id);
    setClients((p) => p.filter((c) => c.id !== id));
  };

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm">{clients.length} registered client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 w-fit" asChild>
          <Link href="/provider/clients/new"><Plus className="h-4 w-4 mr-2" />Add Client</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading clients…</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-sm">
              {search ? "No clients match your search." : "No clients yet. Add your first client to get started."}
            </p>
            {!search && (
              <Button className="mt-4 bg-teal-600 hover:bg-teal-700" asChild>
                <Link href="/provider/clients/new"><Plus className="h-4 w-4 mr-2" />Add Client</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {c.assignedExercises?.length ?? 0} exercises
                  </Badge>
                </div>

                {c.condition && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{c.condition}</p>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/provider/clients/${c.id}`}><Pencil className="h-3 w-3 mr-1" />Edit</Link>
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/provider/assign?client=${c.id}`}><Dumbbell className="h-3 w-3 mr-1" />Assign</Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {c.name}?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently remove the client and all their data.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(c.id)}>
                          Delete
                        </AlertDialogAction>
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
