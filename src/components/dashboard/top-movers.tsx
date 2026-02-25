import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Holding, Enrichment } from "@/lib/types/portfolio";
import { Card, CardTitle } from "@/components/ui/card";
import { BrokerageBadge } from "@/components/ui/badge";
import { formatPercent, gainLossColor, cn } from "@/lib/utils";

interface TopMoversProps {
  holdings: Holding[];
  enrichment: Enrichment[];
}

interface Mover {
  ticker: string;
  name: string;
  brokerage: string;
  return1d: number;
}

export function TopMovers({ holdings, enrichment }: TopMoversProps) {
  // Join enrichment 1d returns with holdings
  const movers: Mover[] = [];

  for (const enrich of enrichment) {
    const ret = enrich.performance?.return_1d;
    if (ret == null) continue;
    const holding = holdings.find((h) => h.ticker === enrich.ticker);
    if (!holding) continue;
    movers.push({
      ticker: enrich.ticker,
      name: holding.name,
      brokerage: holding.brokerage,
      return1d: ret,
    });
  }

  if (movers.length === 0) {
    return (
      <Card>
        <CardTitle>Top Movers (1D)</CardTitle>
        <div className="flex items-center justify-center h-28 text-sm text-gray-500 mt-3">
          Market data not yet synced
        </div>
      </Card>
    );
  }

  const sorted = [...movers].sort((a, b) => b.return1d - a.return1d);
  const gainers = sorted.filter((m) => m.return1d > 0).slice(0, 3);
  const losers = [...sorted].reverse().filter((m) => m.return1d < 0).slice(0, 2);
  const shown = [...gainers, ...losers];

  return (
    <Card>
      <CardTitle>Top Movers (1D)</CardTitle>
      <div className="mt-3 flex flex-col divide-y divide-white/5">
        {shown.map((mover) => (
          <MoverRow key={`${mover.ticker}-${mover.brokerage}`} mover={mover} />
        ))}
      </div>
    </Card>
  );
}

function MoverRow({ mover }: { mover: Mover }) {
  const isPos = mover.return1d > 0;
  const isNeg = mover.return1d < 0;

  const Icon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const iconClass = gainLossColor(mover.return1d);

  return (
    <div className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 min-w-0">
        <Icon size={14} className={cn("shrink-0", iconClass)} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono font-semibold text-white text-sm">
              {mover.ticker}
            </span>
            <BrokerageBadge brokerage={mover.brokerage} />
          </div>
          <div className="text-xs text-gray-500 truncate mt-0.5">
            {mover.name}
          </div>
        </div>
      </div>
      <span
        className={cn(
          "font-mono font-semibold text-sm shrink-0 ml-2",
          gainLossColor(mover.return1d)
        )}
      >
        {formatPercent(mover.return1d)}
      </span>
    </div>
  );
}
