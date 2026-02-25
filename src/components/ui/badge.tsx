import { cn } from "@/lib/utils";
import { ACTION_CONFIG, HEALTH_CONFIG, BROKERAGE_CONFIG } from "@/lib/constants";
import type { Action, Health } from "@/lib/types/analysis";
import type { Brokerage } from "@/lib/types/portfolio";

// ── Generic badge ─────────────────────────────────────────────────────────────
interface BadgeProps {
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ className, children, style }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}

// ── Action badge (BUY / SELL / HOLD) ─────────────────────────────────────────
export function ActionBadge({ action }: { action: Action }) {
  const config = ACTION_CONFIG[action];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
      style={{
        background: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
      }}
    >
      {config.label}
    </span>
  );
}

// ── Brokerage badge ───────────────────────────────────────────────────────────
export function BrokerageBadge({ brokerage }: { brokerage: string }) {
  const config = BROKERAGE_CONFIG[brokerage as Brokerage];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-700 text-gray-300">
        {brokerage}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

// ── Health badge ──────────────────────────────────────────────────────────────
export function HealthBadge({
  health,
  size = "sm",
}: {
  health: Health;
  size?: "sm" | "lg";
}) {
  const config = HEALTH_CONFIG[health];
  const sizeClasses =
    size === "lg"
      ? "px-4 py-1.5 text-sm font-bold"
      : "px-2.5 py-0.5 text-xs font-semibold";
  return (
    <span
      className={cn("inline-flex items-center rounded-full", sizeClasses)}
      style={{
        background: `${config.color}22`,
        color: config.color,
        border: `1px solid ${config.color}44`,
      }}
    >
      {config.label}
    </span>
  );
}

// ── Confidence badge ──────────────────────────────────────────────────────────
const CONFIDENCE_STYLES = {
  high:   { bg: "#052e16", text: "#22c55e", border: "#166534" },
  medium: { bg: "#1c1100", text: "#eab308", border: "#713f12" },
  low:    { bg: "#1c0000", text: "#ef4444", border: "#7f1d1d" },
};

export function ConfidenceBadge({ confidence }: { confidence: string }) {
  const style = CONFIDENCE_STYLES[confidence as keyof typeof CONFIDENCE_STYLES] ?? {
    bg: "#1f2937",
    text: "#9ca3af",
    border: "#374151",
  };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {confidence}
    </span>
  );
}

// ── Urgency badge ─────────────────────────────────────────────────────────────
const URGENCY_LABELS: Record<string, string> = {
  immediate: "Immediate",
  soon: "Soon",
  no_rush: "No Rush",
};

const URGENCY_STYLES = {
  immediate: { bg: "#1c0000", text: "#ef4444", border: "#7f1d1d" },
  soon:      { bg: "#1c0a00", text: "#f97316", border: "#7c2d12" },
  no_rush:   { bg: "#1f2937", text: "#6b7280", border: "#374151" },
};

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const style = URGENCY_STYLES[urgency as keyof typeof URGENCY_STYLES] ?? URGENCY_STYLES.no_rush;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {URGENCY_LABELS[urgency] ?? urgency}
    </span>
  );
}
