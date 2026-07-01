import { db } from "@/firebase-config";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  condition?: string;
  notes?: string;
  providerId: string;
  assignedExercises: string[]; // exercise IDs
  createdAt?: any;
}

const COL = "psClients";

export async function getClientsByProvider(providerId: string): Promise<Client[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("providerId", "==", providerId))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Client))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getClientById(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Client) : null;
}

export async function createClient(data: Omit<Client, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    assignedExercises: data.assignedExercises ?? [],
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateClient(id: string, data: Partial<Omit<Client, "id">>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteClient(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export async function toggleExercise(clientId: string, exerciseId: string, assign: boolean): Promise<void> {
  const client = await getClientById(clientId);
  if (!client) return;
  const current = new Set(client.assignedExercises);
  assign ? current.add(exerciseId) : current.delete(exerciseId);
  await updateDoc(doc(db, COL, clientId), { assignedExercises: Array.from(current) });
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const snap = await getDocs(
    query(collection(db, COL), where("email", "==", email))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Client;
}
