"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Target,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/",           label: "Dashboard",   Icon: LayoutDashboard },
  { href: "/analysis",   label: "Analysis",    Icon: TrendingUp },
  { href: "/holdings",   label: "Holdings",    Icon: Briefcase },
  { href: "/projection", label: "Projection",  Icon: Target },
  { href: "/chat",       label: "AI Chat",     Icon: MessageSquare },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-[#16213e] border-r border-[#2d3748] fixed left-0 top-0 z-40">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-[#2d3748]">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="font-semibold text-white text-sm leading-tight">
              Financial<br />Dashboard
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-[#1e3a5f] text-white"
                    : "text-gray-400 hover:text-white hover:bg-[#1a2a40]"
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-[#2d3748]">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-[#1a2a40] transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#16213e] border-t border-[#2d3748] z-40 flex">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                active ? "text-white" : "text-gray-500"
              )}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
