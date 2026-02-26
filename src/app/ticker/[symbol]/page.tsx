import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import {
  getTickerEnrichment,
  getLatestHoldings,
} from "@/lib/queries/portfolio";
import { getTickerRecommendation } from "@/lib/queries/analysis";
import { Card, CardTitle } from "@/components/ui/card";
import { ActionBadge, BrokerageBadge, ConfidenceBadge, UrgencyBadge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatPercent,
  formatNumber,
  formatMarketCap,
  formatDate,
  gainLossColor,
  cn,
} from "@/lib/utils";

interface PageProps {
  params: { symbol: string };
}

export const dynamic = "force-dynamic";

export default async function TickerPage({ params }: PageProps) {
  const symbol = params.symbol.toUpperCase();

  const [enrichment, holdings, rec] = await Promise.all([
    getTickerEnrichment(symbol),
    getLatestHoldings(),
    getTickerRecommendation(symbol),
  ]);

  if (!enrichment) notFound();

  const positions = holdings.filter((h) => h.ticker === symbol);
  const totalValue = positions.reduce((s, h) => s + h.value, 0);
  const totalGainLoss = positions.reduce((s, h) => s + (h.gain_loss ?? 0), 0);
  const { technicals: t, fundamentals: f, performance: p, news } = enrichment;

  return (
    <>
      <Header title={symbol} lastUpdated={null} />
      <div className="p-4 md:p-6 space-y-5">
        {/* Back link */}
        <Link
          href="/holdings"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={13} /> Back to Holdings
        </Link>

        {/* ── Name + positions ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white font-mono">{symbol}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {f.short_description ?? f.industry ?? ""}
            </p>
          </div>
          {positions.length > 0 && (
            <Card className="md:w-64 shrink-0">
              <CardTitle>Your Position</CardTitle>
              <div className="mt-2 space-y-1">
                {positions.map((pos, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <BrokerageBadge brokerage={pos.brokerage} />
                    <div className="text-right">
                      <div className="font-mono text-white text-sm">
                        {formatCurrency(pos.value, 0)}
                      </div>
                      <div
                        className={cn(
                          "text-xs font-mono",
                          gainLossColor(pos.gain_loss)
                        )}
                      >
                        {pos.gain_loss != null
                          ? `${pos.gain_loss >= 0 ? "+" : ""}${formatCurrency(pos.gain_loss, 0)} (${formatPercent(pos.gain_loss_pct)})`
                          : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Claude's recommendation ──────────────────────────────────────── */}
        {rec && (
          <Card className="border border-indigo-900/40 bg-indigo-950/10">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <ActionBadge action={rec.action} />
              <ConfidenceBadge confidence={rec.confidence} />
              <UrgencyBadge urgency={rec.urgency} />
              <span className="text-xs text-gray-500 ml-auto">Claude&apos;s view</span>
            </div>
            <p className="text-sm text-gray-200 leading-relaxed mb-3">
              {rec.thesis}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-green-950/20 border border-green-900/20 rounded-lg p-3">
                <div className="text-xs font-semibold text-green-400 mb-1 uppercase">Bull</div>
                <p className="text-xs text-gray-300 leading-relaxed">{rec.bull_case}</p>
              </div>
              <div className="bg-red-950/20 border border-red-900/20 rounded-lg p-3">
                <div className="text-xs font-semibold text-red-400 mb-1 uppercase">Bear</div>
                <p className="text-xs text-gray-300 leading-relaxed">{rec.bear_case}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Price + Technicals ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardTitle>Price & Technicals</CardTitle>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <TechRow label="Price" value={formatCurrency(t.price)} />
              <TechRow label="RSI (14)" value={t.rsi_14?.toFixed(1) ?? "—"} />
              <TechRow label="SMA 50" value={formatCurrency(t.sma_50)} />
              <TechRow label="RSI Signal" value={t.rsi_signal ?? "—"} />
              <TechRow label="SMA 200" value={formatCurrency(t.sma_200)} />
              <TechRow label="MACD" value={t.macd?.toFixed(3) ?? "—"} />
              <TechRow
                label="% vs SMA50"
                value={t.pct_above_sma50 != null ? formatPercent(t.pct_above_sma50) : "—"}
                valueClass={gainLossColor(t.pct_above_sma50)}
              />
              <TechRow
                label="% vs SMA200"
                value={t.pct_above_sma200 != null ? formatPercent(t.pct_above_sma200) : "—"}
                valueClass={gainLossColor(t.pct_above_sma200)}
              />
              <TechRow label="BB Position" value={t.bb_position?.replace(/_/g, " ") ?? "—"} />
              <TechRow
                label="Golden Cross"
                value={t.golden_cross == null ? "—" : t.golden_cross ? "Yes ✓" : "No"}
                valueClass={t.golden_cross ? "text-green-400" : undefined}
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Fundamentals</CardTitle>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <TechRow label="Sector" value={f.sector ?? "—"} />
              <TechRow label="Market Cap" value={formatMarketCap(f.market_cap)} />
              <TechRow label="P/E (trail)" value={f.pe_trailing?.toFixed(1) ?? "—"} />
              <TechRow label="P/E (fwd)" value={f.pe_forward?.toFixed(1) ?? "—"} />
              <TechRow label="PEG" value={f.peg_ratio?.toFixed(2) ?? "—"} />
              <TechRow label="P/B" value={f.price_to_book?.toFixed(2) ?? "—"} />
              <TechRow label="Beta" value={f.beta?.toFixed(2) ?? "—"} />
              <TechRow
                label="Div Yield"
                value={f.dividend_yield != null ? formatPercent(f.dividend_yield * 100, 2) : "—"}
              />
              <TechRow
                label="Rev Growth"
                value={f.revenue_growth != null ? formatPercent(f.revenue_growth * 100) : "—"}
                valueClass={gainLossColor(f.revenue_growth)}
              />
              <TechRow
                label="Profit Margin"
                value={f.profit_margin != null ? formatPercent(f.profit_margin * 100) : "—"}
              />
            </div>
            {f.analyst_target != null && (
              <div className="mt-3 flex items-center justify-between bg-white/4 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400">Analyst Target</span>
                <div className="text-right">
                  <span className="text-sm font-mono text-white">
                    {formatCurrency(f.analyst_target)}
                  </span>
                  {t.price > 0 && (
                    <span
                      className={cn(
                        "ml-2 text-xs font-mono",
                        gainLossColor(f.analyst_target - t.price)
                      )}
                    >
                      ({formatPercent(
                        ((f.analyst_target - t.price) / t.price) * 100
                      )})
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Performance bars ─────────────────────────────────────────────── */}
        <Card>
          <CardTitle>Performance</CardTitle>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "1 Day", value: p.return_1d },
              { label: "1 Week", value: p.return_1w },
              { label: "1 Month", value: p.return_1m },
              { label: "3 Month", value: p.return_3m },
              { label: "6 Month", value: p.return_6m },
              { label: "From 52W High", value: p.pct_from_52w_high },
            ].map(({ label, value }) => (
              <PerformanceBar key={label} label={label} value={value} />
            ))}
          </div>
        </Card>

        {/* ── News ─────────────────────────────────────────────────────────── */}
        {news && news.length > 0 && (
          <Card>
            <CardTitle>Recent News</CardTitle>
            <div className="mt-3 flex flex-col divide-y divide-white/5">
              {news.slice(0, 6).map((item, i) => (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 py-3 hover:bg-white/3 -mx-1 px-1 rounded-lg transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 group-hover:text-white transition-colors leading-snug">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{item.publisher}</span>
                      <span>·</span>
                      <span>{formatDate(item.published)}</span>
                    </div>
                  </div>
                  <ExternalLink
                    size={13}
                    className="shrink-0 text-gray-600 group-hover:text-gray-400 mt-0.5"
                  />
                </a>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TechRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-white/3 rounded-lg px-2.5 py-2">
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      <div
        className={cn(
          "text-sm font-mono font-medium text-white truncate",
          valueClass
        )}
      >
        {value}
      </div>
    </div>
  );
}

function PerformanceBar({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const isPos = (value ?? 0) >= 0;
  const abs = Math.min(Math.abs(value ?? 0), 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-400">{label}</span>
        <span
          className={cn(
            "text-xs font-mono font-semibold",
            gainLossColor(value)
          )}
        >
          {value != null ? formatPercent(value) : "—"}
        </span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        {value != null && (
          <div
            className={cn(
              "h-full rounded-full",
              isPos ? "bg-green-500" : "bg-red-500"
            )}
            style={{ width: `${abs}%` }}
          />
        )}
      </div>
    </div>
  );
}
