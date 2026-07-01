import { db } from "@/firebase-config";
import {
  collection, addDoc, getDocs, query, where,
  orderBy, limit, serverTimestamp,
} from "firebase/firestore";

export interface PostureSession {
  id: string;
  clientId: string;
  providerId: string;
  exerciseId?: string;
  postureScore: number;
  neckAngle?: number;
  torsoAngle?: number;
  shoulderDiff?: number;
  viewMode?: "side" | "front" | "back";
  durationSec: number;
  alertCount: number;
  date?: any;
}

const COL = "psPostureSessions";

export async function savePostureSession(
  data: Omit<PostureSession, "id" | "date">
): Promise<string> {
  const ref = await addDoc(collection(db, COL), { ...data, date: serverTimestamp() });
  return ref.id;
}

export async function getSessionsByClient(clientId: string, max = 20): Promise<PostureSession[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("clientId", "==", clientId), limit(max))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as PostureSession))
    .sort((a, b) => (b.date?.seconds ?? 0) - (a.date?.seconds ?? 0));
}

export async function getSessionsByProvider(providerId: string, max = 100): Promise<PostureSession[]> {
  const snap = await getDocs(
    query(collection(db, COL), where("providerId", "==", providerId), limit(max))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as PostureSession))
    .sort((a, b) => (b.date?.seconds ?? 0) - (a.date?.seconds ?? 0));
}
