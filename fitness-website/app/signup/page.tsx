"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { ref, set as rtdbSet } from "firebase/database";
import Link from "next/link";
import { ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db, rtdb } from "@/firebase-config";
import { ensureUserProfile } from "@/lib/user-utils";

const provider = new GoogleAuthProvider();

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const baseName = `${firstName} ${lastName}`.trim();

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      const name = baseName || email.split("@")[0];

      // Create user profile in Firestore and RTDB
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        role: "client",
        createdAt: new Date(),
      });

      await rtdbSet(ref(rtdb, `users/${user.uid}`), {
        name,
        email,
      });

      router.push("/");
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = error.message || "Unable to create account. Try again later.";

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Email already in use. Please go to Login.";
      } else if (errorMessage.toLowerCase().includes('missing or insufficient permissions')) {
        errorMessage = "Database Permissions Denied! Please check your Firebase rules in the console.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      setError("");
      const { user } = await signInWithPopup(auth, provider);
      await ensureUserProfile(user);
      router.push("/");
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        console.error("Google signup error:", error);
        setError(error.message || "Google sign-up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4">
      <Card className="mx-auto max-w-md w-full border-2 border-primary/20">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">
            Create an account
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Join PostureSense — AI-powered posture analysis for clinics and gyms.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm sm:text-base">First name</Label>
              <Input
                id="firstName"
                placeholder="Fit"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm sm:text-base">Last name</Label>
              <Input
                id="lastName"
                placeholder="Tuber"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                className="text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="fittuber@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="text-sm sm:text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="text-sm sm:text-base"
            />
          </div>
          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-600">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 p-4 sm:p-6 pt-0">
          <Button
            onClick={handleSignup}
            className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? "Creating account..." : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleGoogleSignup}
            className="w-full text-sm sm:text-base"
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.7-2.6-5.7-5.8s2.6-5.8 5.7-5.8c1.8 0 3 .8 3.7 1.6l2.5-2.4C16.7 3.5 14.6 2.4 12 2.4 6.9 2.4 2.7 6.6 2.7 11.8s4.2 9.4 9.3 9.4c5.4 0 8.9-3.8 8.9-9.1 0-.6-.1-1-.1-1.4H12z"
              />
            </svg>
            Continue with Google
          </Button>
          <div className="text-center text-xs sm:text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
