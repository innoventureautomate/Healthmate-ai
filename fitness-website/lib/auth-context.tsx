"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase-config";

export type UserRole = "admin" | "provider" | "client";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  providerId?: string; // set for clients — links to psProviders doc
  createdAt?: any;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  getIdToken: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const ref  = doc(db, "users", currentUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setProfile({ uid: currentUser.uid, ...snap.data() } as UserProfile);
          } else {
            // First-time user — create a basic profile (role assigned during signup)
            const base: Omit<UserProfile, "uid"> = {
              name:  currentUser.displayName || currentUser.email?.split("@")[0] || "User",
              email: currentUser.email || "",
              role:  "client",
              createdAt: serverTimestamp(),
            };
            await setDoc(ref, base);
            setProfile({ uid: currentUser.uid, ...base });
          }
        } catch (err) {
          console.error("AuthProvider: profile fetch error", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getIdToken = async (): Promise<string | null> => {
    try { return user ? await user.getIdToken() : null; } catch { return null; }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
