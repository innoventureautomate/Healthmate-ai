"use client";

import Link from "next/link";
import { Menu, Activity, ChevronDown, Bot } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/firebase-config";

export default function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const { user, profile } = useAuth();

  const userName = profile?.name || user?.displayName || null;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowUserMenu(false);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-xl md:text-2xl">PostureSense</span>
              <p className="text-xs text-muted-foreground hidden md:block">
                AI posture analysis platform
              </p>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link href="/workouts" className="text-sm font-medium transition-colors hover:text-primary">
              Workouts
            </Link>
            <Link href="/nutrition" className="text-sm font-medium transition-colors hover:text-primary">
              Nutrition
            </Link>
            <Link href="/blogs" className="text-sm font-medium transition-colors hover:text-primary">
              Blogs
            </Link>
            <Link href="/community" className="text-sm font-medium transition-colors hover:text-primary">
              Community
            </Link>
            <Link
              href="/chatbot"
              className="text-sm font-bold text-primary transition-colors hover:text-primary/80 flex items-center gap-1"
            >
              <Bot className="h-4 w-4" />
              AI Coach
            </Link>
            <Link href="/profile" className="text-sm font-medium transition-colors hover:text-primary">
              Profile
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:flex gap-2 relative">
            {userName ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-1 font-medium focus:outline-none"
                >
                  <span>Welcome, {userName}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border rounded shadow-lg z-10">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                <Link href="/workouts" className="text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Workouts
                </Link>
                <Link href="/nutrition" className="text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Nutrition
                </Link>
                <Link href="/blogs" className="text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Blogs
                </Link>
                <Link href="/community" className="text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Community
                </Link>
                <Link
                  href="/chatbot"
                  className="text-lg font-bold text-primary transition-colors hover:text-primary/80 flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bot className="h-5 w-5" />
                  AI Coach
                </Link>
                <Link href="/profile" className="text-lg font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </Link>
                <div className="flex flex-col gap-2 mt-4">
                  {userName ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleLogout();
                      }}
                      className="px-4 py-2 text-lg font-medium text-red-500 bg-white dark:bg-gray-800 border rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Logout
                    </button>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
                      </Button>
                      <Button asChild>
                        <Link href="/signup" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
