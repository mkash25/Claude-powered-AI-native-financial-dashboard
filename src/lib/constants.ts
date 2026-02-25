import type { Brokerage } from "./types/portfolio";

// ── Brokerage color config — matches notebook 05 email HTML ───────────────
export const BROKERAGE_CONFIG: Record<
  Brokerage,
  { bg: string; text: string; border: string; label: string }
> = {
  Stash:     { bg: "#1d4ed8", text: "#93c5fd", border: "#1e40af", label: "Stash" },
  Robinhood: { bg: "#065f46", text: "#6ee7b7", border: "#064e3b", label: "Robinhood" },
  Sofi:      { bg: "#6b21a8", text: "#d8b4fe", border: "#581c87", label: "SoFi" },
  Acorns:    { bg: "#92400e", text: "#fcd34d", border: "#78350f", label: "Acorns" },
};

export const BROKERAGES: Brokerage[] = ["Stash", "Robinhood", "Sofi", "Acorns"];

// ── Action color config ────────────────────────────────────────────────────
export const ACTION_CONFIG = {
  BUY:  { bg: "#064e3b", text: "#22c55e", border: "#22c55e", label: "BUY" },
  SELL: { bg: "#450a0a", text: "#ef4444", border: "#ef4444", label: "SELL" },
  HOLD: { bg: "#422006", text: "#eab308", border: "#eab308", label: "HOLD" },
} as const;

// ── Health color config ────────────────────────────────────────────────────
export const HEALTH_CONFIG = {
  strong:   { color: "#22c55e", label: "Strong" },
  moderate: { color: "#eab308", label: "Moderate" },
  weak:     { color: "#ef4444", label: "Weak" },
} as const;

// ── Confidence / urgency colors ────────────────────────────────────────────
export const CONFIDENCE_COLORS = {
  high:   "#22c55e",
  medium: "#eab308",
  low:    "#ef4444",
} as const;

export const URGENCY_COLORS = {
  immediate: "#ef4444",
  soon:      "#f97316",
  no_rush:   "#888",
} as const;

// ── Wealth projection defaults (from user profile) ─────────────────────────
export const PROJECTION_DEFAULTS = {
  currentAge: 31,
  targetFiAge: 45,
  monthlyContribution: 1000,
  annualContributionIncrease: 5,
  assumedAnnualReturn: 8,
  retirementHsa: 85_711,
  cashSavings: 29_449,
  debts: 7_086,
  retirementAnnualReturn: 7,
} as const;

// ── Milestone targets (net worth) ─────────────────────────────────────────
export const MILESTONES = [250_000, 500_000, 750_000, 1_000_000, 1_500_000, 2_000_000];

// ── Nav items ─────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",   icon: "LayoutDashboard" },
  { href: "/analysis",  label: "Analysis",    icon: "TrendingUp" },
  { href: "/holdings",  label: "Holdings",    icon: "Briefcase" },
  { href: "/projection",label: "Projection",  icon: "Target" },
  { href: "/chat",      label: "AI Chat",     icon: "MessageSquare" },
] as const;
