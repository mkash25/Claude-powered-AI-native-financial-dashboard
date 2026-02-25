import { PortfolioSnapshot, Holding, Enrichment } from "@/lib/types/portfolio";
import { AnalysisReport, Recommendation } from "@/lib/types/analysis";

import { NetWorthCard } from "./net-worth-card";
import { HealthCard } from "./health-card";
import { QuickStats } from "./quick-stats";
import { AllocationChart } from "./allocation-chart";
import { BrokerageCards } from "./brokerage-cards";
import { TopMovers } from "./top-movers";
import { ActionItems } from "./action-items";

interface DashboardContentProps {
  snapshot: PortfolioSnapshot;
  analysis: AnalysisReport | null;
  recommendations: Recommendation[];
  holdings: Holding[];
  enrichment: Enrichment[];
}

export function DashboardContent({
  snapshot,
  analysis,
  recommendations,
  holdings,
  enrichment,
}: DashboardContentProps) {
  return (
    <div className="space-y-4">
      {/* ── Row 1: Net Worth (wide) + Health + Quick Stats ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Worth spans 2 cols on md */}
        <div className="md:col-span-2">
          <NetWorthCard snapshot={snapshot} />
        </div>

        {/* Right column: health + quick stats stacked */}
        <div className="flex flex-col gap-4">
          <HealthCard analysis={analysis} />
          <QuickStats
            snapshot={snapshot}
            analysis={analysis}
            recommendations={recommendations}
          />
        </div>
      </div>

      {/* ── Row 2: Allocation donut + Brokerage breakdown ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Donut — 1 col */}
        <div className="md:col-span-1">
          <AllocationChart snapshot={snapshot} />
        </div>

        {/* Brokerage cards — 3 cols */}
        <div className="md:col-span-3">
          <BrokerageCards snapshot={snapshot} />
        </div>
      </div>

      {/* ── Row 3: Top Movers + Action Items ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopMovers holdings={holdings} enrichment={enrichment} />
        <ActionItems analysis={analysis} />
      </div>
    </div>
  );
}
