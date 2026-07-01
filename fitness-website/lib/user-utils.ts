import { User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref as rtdbRef, set as rtdbSet } from "firebase/database";
import { db, rtdb } from "@/firebase-config";

export async function getUserByEmail(email: string): Promise<{ uid: string; role?: string; name?: string } | null> {
  const snap = await getDocs(query(collection(db, "users"), where("email", "==", email)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { uid: d.id, ...d.data() } as { uid: string; role?: string; name?: string };
}

/**
 * Ensures a user profile exists in both Firestore and Realtime Database.
 * Called after login or signup (email or Google).
 * Extracted from login/signup pages to eliminate duplication.
 */
export async function ensureUserProfile(user: User, fallbackName?: string) {
  const name =
    user.displayName || fallbackName || user.email?.split("@")[0] || "Athlete";

  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      name,
      email: user.email,
      role: "client",
      createdAt: new Date(),
    });
  }

  await rtdbSet(rtdbRef(rtdb, `users/${user.uid}`), {
    name,
    email: user.email,
  });
}
