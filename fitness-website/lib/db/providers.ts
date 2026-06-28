import { db } from "@/firebase-config";
import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp,
} from "firebase/firestore";

export type ProviderType = "gym" | "physio" | "clinic" | "other";

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  email: string;
  phone?: string;
  address?: string;
  ownerId: string; // Firebase Auth UID
  isActive: boolean;
  createdAt?: any;
}

const COL = "psProviders";

export async function getAllProviders(): Promise<Provider[]> {
  const snap = await getDocs(query(collection(db, COL), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Provider));
}

export async function getProviderByOwner(ownerId: string): Promise<Provider | null> {
  const snap = await getDocs(
    query(collection(db, COL), where("ownerId", "==", ownerId))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Provider;
}

export async function getProviderById(id: string): Promise<Provider | null> {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Provider) : null;
}

export async function createProvider(data: Omit<Provider, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateProvider(id: string, data: Partial<Omit<Provider, "id">>): Promise<void> {
  await updateDoc(doc(db, COL, id), data);
}

export async function deleteProvider(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}
