import { TrendingUp, TrendingDown } from "lucide-react";
import { PortfolioSnapshot } from "@/lib/types/portfolio";
import { formatCurrency, formatPercent, gainLossColor, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface NetWorthCardProps {
  snapshot: PortfolioSnapshot;
  manualAssetsTotal?: number;
  manualDebtsTotal?: number;
}

export function NetWorthCard({
  snapshot,
  manualAssetsTotal = 0,
  manualDebtsTotal = 0,
}: NetWorthCardProps) {
  const { total_value, total_cost_basis, total_gain_loss, total_positions } = snapshot;
  const gainLossPct =
    total_cost_basis > 0 ? (total_gain_loss / total_cost_basis) * 100 : 0;
  const isPositive = total_gain_loss >= 0;

  const trueNetWorth = total_value + manualAssetsTotal - manualDebtsTotal;
  const hasManual = manualAssetsTotal > 0 || manualDebtsTotal > 0;

  return (
    <Card className="md:col-span-2">
      <div className="flex items-start justify-between gap-4">
        {/* Left: main value */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            {hasManual ? "True Net Worth" : "Total Portfolio Value"}
          </p>
          <p className="text-4xl md:text-5xl font-bold text-white font-mono tracking-tight">
            {formatCurrency(trueNetWorth, 0)}
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
              ({formatPercent(gainLossPct)}) brokerage all-time
            </span>
          </div>

          {/* Breakdown — only shown when manual accounts exist */}
          {hasManual && (
            <div className="mt-3 pt-3 border-t border-white/6 space-y-1">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Brokerage (Plaid)</span>
                <span className="font-mono text-white">{formatCurrency(total_value, 0)}</span>
              </div>
              {manualAssetsTotal > 0 && (
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Other Assets</span>
                  <span className="font-mono text-green-400">+{formatCurrency(manualAssetsTotal, 0)}</span>
                </div>
              )}
              {manualDebtsTotal > 0 && (
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Debts</span>
                  <span className="font-mono text-red-400">−{formatCurrency(manualDebtsTotal, 0)}</span>
                </div>
              )}
            </div>
          )}
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
