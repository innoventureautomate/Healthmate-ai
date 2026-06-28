"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users, Dumbbell, ClipboardList, BarChart3,
  Settings, Building2, Activity, LayoutDashboard,
} from "lucide-react";

interface NavItem { label: string; href: string; icon: React.ElementType; }

const PROVIDER_NAV: NavItem[] = [
  { label: "Overview",  href: "/provider",          icon: LayoutDashboard },
  { label: "Clients",   href: "/provider/clients",   icon: Users },
  { label: "Exercises", href: "/provider/exercises", icon: Dumbbell },
  { label: "Assign",    href: "/provider/assign",    icon: ClipboardList },
  { label: "Reports",   href: "/provider/reports",   icon: BarChart3 },
];

const ADMIN_NAV: NavItem[] = [
  { label: "Overview",   href: "/admin",             icon: LayoutDashboard },
  { label: "Providers",  href: "/admin/providers",   icon: Building2 },
  { label: "Exercises",  href: "/admin/exercises",   icon: Dumbbell },
  { label: "Posture AI", href: "/admin/posture",     icon: Activity },
  { label: "Settings",   href: "/admin/settings",    icon: Settings },
];

const CLIENT_NAV: NavItem[] = [
  { label: "Dashboard",  href: "/client",            icon: LayoutDashboard },
  { label: "Exercises",  href: "/client/exercises",  icon: Dumbbell },
  { label: "Posture",    href: "/client/posture",    icon: Activity },
];

interface PsSidebarProps { role: "admin" | "provider" | "client"; }

export default function PsSidebar({ role }: PsSidebarProps) {
  const pathname = usePathname();
  const nav = role === "admin" ? ADMIN_NAV : role === "provider" ? PROVIDER_NAV : CLIENT_NAV;

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r bg-gray-50 dark:bg-gray-900 pt-6">
      <nav className="flex flex-col gap-1 px-3">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/provider" && href !== "/admin" && href !== "/client" && pathname.startsWith(href));
          return (
            <Link
              key={href} href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
