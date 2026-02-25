import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ── shadcn class utility ───────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Formatting ─────────────────────────────────────────────────────────────
export function formatCurrency(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompactCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000)
    return `$${(value / 1_000).toFixed(1)}K`;
  return formatCurrency(value);
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value == null || isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value == null || isNaN(value)) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(2)}M`;
  return formatCurrency(value, 0);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Color helpers ──────────────────────────────────────────────────────────
export function gainLossColor(value: number | null | undefined): string {
  if (value == null) return "text-gray-400";
  if (value > 0) return "text-green-400";
  if (value < 0) return "text-red-400";
  return "text-gray-400";
}

export function returnColor(pct: number | null | undefined): string {
  if (pct == null) return "#888";
  if (pct >= 5)  return "#22c55e";
  if (pct > 0)   return "#86efac";
  if (pct >= -5) return "#fca5a5";
  return "#ef4444";
}

// ── Misc ───────────────────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
}
