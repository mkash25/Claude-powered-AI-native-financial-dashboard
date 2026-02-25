import { PortfolioSnapshot } from "@/lib/types/portfolio";
import { AnalysisReport } from "@/lib/types/analysis";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface QuickStatsProps {
  snapshot: PortfolioSnapshot;
  analysis: AnalysisReport | null;
  recommendations: import("@/lib/types/analysis").Recommendation[];
}

export function QuickStats({
  snapshot,
  analysis,
  recommendations,
}: QuickStatsProps) {
  const brokerageCount = Object.keys(snapshot.brokerages_json).length;
  const buyCount = recommendations.filter((r) => r.action === "BUY").length;
  const sellCount = recommendations.filter((r) => r.action === "SELL").length;

  return (
    <Card>
      <CardTitle>Quick Stats</CardTitle>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatItem label="Positions" value={String(snapshot.total_positions)} />
        <StatItem label="Brokerages" value={String(brokerageCount)} />
        <StatItem
          label="Last Analysis"
          value={analysis ? formatDate(analysis.analysis_date) : "—"}
        />
        <StatItem
          label="Risk Level"
          value={analysis?.risk_level ?? "—"}
          truncate
        />
        {buyCount > 0 && (
          <StatItem
            label="Buy Signals"
            value={String(buyCount)}
            valueClass="text-green-400"
          />
        )}
        {sellCount > 0 && (
          <StatItem
            label="Sell Signals"
            value={String(sellCount)}
            valueClass="text-red-400"
          />
        )}
      </div>
    </Card>
  );
}

function StatItem({
  label,
  value,
  truncate,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  truncate?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="bg-white/4 rounded-lg p-2.5">
      <div className="text-xs text-gray-400 mb-0.5">{label}</div>
      <div
        className={`text-sm font-semibold ${valueClass} ${truncate ? "truncate" : ""}`}
        title={truncate ? value : undefined}
      >
        {value}
      </div>
    </div>
  );
}
