import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-white/5", className)}
    />
  );
}

// Pre-composed skeleton cards
export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-white/8 bg-surface p-4 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}
