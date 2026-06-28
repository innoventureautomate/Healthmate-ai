"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Activity } from "lucide-react"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { auth } from "@/firebase-config"
import { ensureUserProfile } from "@/lib/user-utils"

const provider = new GoogleAuthProvider()

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleEmailSignIn = async () => {
    try {
      setLoading(true)
      setError("")
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      await ensureUserProfile(user)
      router.push("/")
    } catch (err: any) {
      console.error("Login error", err)
      setError(err.message || "Unable to sign in. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError("")
      const { user } = await signInWithPopup(auth, provider)
      await ensureUserProfile(user)
      router.push("/")
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        console.error("Google sign-in error", err)
        setError(err.message || "Google sign-in failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 sm:py-12 px-4">
      <Card className="mx-auto max-w-md w-full border-2 border-primary/20">
        <CardHeader className="space-y-1 p-4 sm:p-6">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold text-center">Sign in to PostureSense</CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Welcome back! Access your posture dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm sm:text-base">Password</Label>
              <Link href="/forgot-password" className="text-xs sm:text-sm text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base"
            onClick={handleEmailSignIn}
            disabled={loading}
          >
            {loading ? "Signing in..." : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full text-sm sm:text-base"
            onClick={handleGoogleSignIn}
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
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
