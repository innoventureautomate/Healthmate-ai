"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase-config";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Activity, ChevronDown, LogOut, User } from "lucide-react";

const ROLE_COLOR: Record<string, string> = {
  admin:    "bg-purple-100 text-purple-700 border-purple-300",
  provider: "bg-blue-100 text-blue-700 border-blue-300",
  client:   "bg-teal-100 text-teal-700 border-teal-300",
};

export default function PsHeader() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    document.cookie = "__session=; path=/; max-age=0";
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur dark:bg-gray-950/95">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-blue-600">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="text-gray-900 dark:text-white">Posture<span className="text-teal-600">Sense</span></span>
        </Link>

        {/* Right side */}
        {user && profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-9">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-xs font-bold">
                  {(profile.name || "U")[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{profile.name}</span>
                <Badge variant="outline" className={`hidden sm:inline-flex text-xs capitalize ${ROLE_COLOR[profile.role] ?? ""}`}>
                  {profile.role}
                </Badge>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
              </div>
              <DropdownMenuSeparator />
              {profile.role === "admin" && (
                <DropdownMenuItem asChild><Link href="/admin">Admin Panel</Link></DropdownMenuItem>
              )}
              {profile.role === "provider" && (
                <DropdownMenuItem asChild><Link href="/provider">Dashboard</Link></DropdownMenuItem>
              )}
              {profile.role === "client" && (
                <DropdownMenuItem asChild><Link href="/client">My Portal</Link></DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Log In</Link></Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
