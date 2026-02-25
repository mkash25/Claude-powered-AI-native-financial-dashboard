import { PortfolioSnapshot, Brokerage } from "@/lib/types/portfolio";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BROKERAGE_CONFIG, BROKERAGES } from "@/lib/constants";

interface BrokerageCardsProps {
  snapshot: PortfolioSnapshot;
}

export function BrokerageCards({ snapshot }: BrokerageCardsProps) {
  // Show in canonical BROKERAGES order; skip any not present
  const entries = BROKERAGES.filter(
    (b) => snapshot.brokerages_json[b] != null
  ).map((b) => ({
    brokerage: b,
    summary: snapshot.brokerages_json[b],
    config: BROKERAGE_CONFIG[b],
  }));

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 h-full">
      {entries.map(({ brokerage, summary, config }) => {
        const pct =
          snapshot.total_value > 0
            ? (summary.value / snapshot.total_value) * 100
            : 0;

        return (
          <Card
            key={brokerage}
            className="border-l-4 flex flex-col justify-between"
            style={{ borderLeftColor: config.bg }}
          >
            {/* Badge + pct */}
            <div className="flex items-center justify-between mb-3">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: config.bg, color: config.text }}
              >
                {config.label}
              </span>
              <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
            </div>

            {/* Value */}
            <div className="font-mono text-white font-semibold text-lg leading-tight">
              {formatCurrency(summary.value, 0)}
            </div>

            {/* Position count */}
            <div className="text-xs text-gray-500 mt-1">
              {summary.positions} position
              {summary.positions !== 1 ? "s" : ""}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
