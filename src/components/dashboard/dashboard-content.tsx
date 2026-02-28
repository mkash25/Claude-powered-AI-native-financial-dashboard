import { PortfolioSnapshot, Holding, Enrichment } from "@/lib/types/portfolio";
import { AnalysisReport, Recommendation } from "@/lib/types/analysis";
import type { ManualAsset, ManualDebt } from "@/lib/queries/manual-accounts";
import type { RsuGrant } from "@/lib/queries/rsu";

import { NetWorthCard } from "./net-worth-card";
import { HealthCard } from "./health-card";
import { QuickStats } from "./quick-stats";
import { AllocationChart } from "./allocation-chart";
import { BrokerageCards } from "./brokerage-cards";
import { CategoryCards } from "./category-cards";
import { RsuWidget } from "./rsu-widget";
import { TopMovers } from "./top-movers";
import { ActionItems } from "./action-items";
import { WealthTrackerCard } from "./wealth-tracker-card";

interface DashboardContentProps {
  snapshot: PortfolioSnapshot;
  analysis: AnalysisReport | null;
  recommendations: Recommendation[];
  holdings: Holding[];
  enrichment: Enrichment[];
  manualAssets: ManualAsset[];
  manualDebts: ManualDebt[];
  rsuGrants: RsuGrant[];
}

export function DashboardContent({
  snapshot,
  analysis,
  recommendations,
  holdings,
  enrichment,
  manualAssets,
  manualDebts,
  rsuGrants,
}: DashboardContentProps) {
  const manualAssetsTotal = manualAssets.reduce((s, a) => s + a.balance, 0);
  const manualDebtsTotal = manualDebts.reduce((s, d) => s + d.balance, 0);
  const hasCategories = !!snapshot.account_categories_json;

  return (
    <div className="space-y-4">
      {/* ── Row 1: Net Worth (wide) + Health + Quick Stats ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        <div className="md:col-span-2 xl:col-span-3">
          <NetWorthCard
            snapshot={snapshot}
            manualAssetsTotal={manualAssetsTotal}
            manualDebtsTotal={manualDebtsTotal}
          />
        </div>
        <div className="flex flex-col gap-4">
          <HealthCard analysis={analysis} />
          <QuickStats
            snapshot={snapshot}
            analysis={analysis}
            recommendations={recommendations}
          />
        </div>
      </div>

      {/* ── Row 2: Allocation donut + Category Cards (or Brokerage fallback) ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        <div className="md:col-span-1">
          <AllocationChart snapshot={snapshot} />
        </div>
        <div className="md:col-span-4">
          {hasCategories ? (
            <CategoryCards snapshot={snapshot} rsuGrants={rsuGrants} manualAssets={manualAssets} />
          ) : (
            <BrokerageCards snapshot={snapshot} />
          )}
        </div>
      </div>

      {/* ── Row 3: Top Movers + Action Items ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TopMovers holdings={holdings} enrichment={enrichment} />
        <ActionItems analysis={analysis} />
      </div>

      {/* ── Row 4: RSU Widget ────────────────────────────────────────────────── */}
      <RsuWidget initialGrants={rsuGrants} />

      {/* ── Row 5: Wealth Tracker (manual assets + debts) ────────────────────── */}
      <WealthTrackerCard initialAssets={manualAssets} initialDebts={manualDebts} />
    </div>
  );
}
