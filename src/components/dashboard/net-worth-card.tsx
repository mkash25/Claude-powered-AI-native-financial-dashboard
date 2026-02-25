import { TrendingUp, TrendingDown } from "lucide-react";
import { PortfolioSnapshot } from "@/lib/types/portfolio";
import { formatCurrency, formatPercent, gainLossColor, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface NetWorthCardProps {
  snapshot: PortfolioSnapshot;
}

export function NetWorthCard({ snapshot }: NetWorthCardProps) {
  const { total_value, total_cost_basis, total_gain_loss, total_positions } =
    snapshot;
  const gainLossPct =
    total_cost_basis > 0 ? (total_gain_loss / total_cost_basis) * 100 : 0;
  const isPositive = total_gain_loss >= 0;

  return (
    <Card className="md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        {/* Left: main value */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Total Portfolio Value
          </p>
          <p className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(total_value, 0)}
          </p>
          <div
            className={cn(
              "flex items-center gap-1.5 mt-2 text-sm font-medium",
              gainLossColor(total_gain_loss)
            )}
          >
            {isPositive ? (
              <TrendingUp size={15} />
            ) : (
              <TrendingDown size={15} />
            )}
            <span>
              {isPositive ? "+" : ""}
              {formatCurrency(total_gain_loss, 0)}
            </span>
            <span className="text-gray-500 font-normal">
              ({formatPercent(gainLossPct)}) all-time
            </span>
          </div>
        </div>

        {/* Right: meta */}
        <div className="text-right shrink-0 space-y-1">
          <div className="text-xs text-gray-400">Cost Basis</div>
          <div className="font-mono text-white font-semibold">
            {formatCurrency(total_cost_basis, 0)}
          </div>
          <div className="text-xs text-gray-500 pt-1">
            {total_positions} positions
          </div>
        </div>
      </div>
    </Card>
  );
}
