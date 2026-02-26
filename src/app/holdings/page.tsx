import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  getLatestHoldings,
  getLatestSnapshot,
} from "@/lib/queries/portfolio";
import { BrokerageBadge } from "@/components/ui/badge";
import { formatCurrency, formatPercent, gainLossColor, cn } from "@/lib/utils";

export const revalidate = 3600;

export default async function HoldingsPage() {
  const [snapshot, holdings] = await Promise.all([
    getLatestSnapshot(),
    getLatestHoldings(),
  ]);

  if (!snapshot || holdings.length === 0) {
    return (
      <>
        <Header title="Holdings" lastUpdated={null} />
        <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-4">💼</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No holdings yet
          </h2>
          <p className="text-gray-400 text-sm max-w-sm">
            Run the pipeline to sync your brokerage holdings.
          </p>
        </div>
      </>
    );
  }

  // Group by brokerage
  const grouped = holdings.reduce(
    (acc, h) => {
      const key = h.brokerage;
      if (!acc[key]) acc[key] = [];
      acc[key].push(h);
      return acc;
    },
    {} as Record<string, typeof holdings>
  );

  return (
    <>
      <Header title="Holdings" lastUpdated={snapshot?.created_at ?? null} />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary bar */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>
            <strong className="text-white">{holdings.length}</strong> positions
          </span>
          <span>across</span>
          <span>
            <strong className="text-white">{Object.keys(grouped).length}</strong>{" "}
            brokerages
          </span>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-surface">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider sticky left-0 bg-surface">
                  Ticker
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Brokerage
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Gain / Loss
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-background">
              {holdings.map((h, i) => (
                <tr
                  key={`${h.ticker}-${h.brokerage}-${i}`}
                  className="hover:bg-surface/60 transition-colors"
                >
                  {/* Ticker — clickable to detail page */}
                  <td className="px-4 py-3 sticky left-0 bg-background hover:bg-surface/60">
                    <Link
                      href={`/ticker/${h.ticker}`}
                      className="font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {h.ticker}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-[180px] truncate">
                    {h.name}
                  </td>
                  <td className="px-4 py-3">
                    <BrokerageBadge brokerage={h.brokerage} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 uppercase text-xs">
                    {h.type}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {formatCurrency(h.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white">
                    {formatCurrency(h.value, 0)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      gainLossColor(h.gain_loss)
                    )}
                  >
                    {h.gain_loss != null
                      ? `${h.gain_loss >= 0 ? "+" : ""}${formatCurrency(h.gain_loss, 0)}`
                      : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      gainLossColor(h.gain_loss_pct)
                    )}
                  >
                    {h.gain_loss_pct != null
                      ? formatPercent(h.gain_loss_pct)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </>
  );
}
