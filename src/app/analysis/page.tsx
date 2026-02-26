import { Header } from "@/components/layout/header";
import {
  getLatestAnalysis,
  getLatestRecommendations,
} from "@/lib/queries/analysis";
import { getLatestSnapshot } from "@/lib/queries/portfolio";
import { ActionBadge, BrokerageBadge, ConfidenceBadge, HealthBadge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Recommendation } from "@/lib/types/analysis";

export const revalidate = 3600;

export default async function AnalysisPage() {
  const [snapshot, analysis, recommendations] = await Promise.all([
    getLatestSnapshot(),
    getLatestAnalysis(),
    getLatestRecommendations(),
  ]);

  if (!analysis) {
    return (
      <>
        <Header title="Analysis Report" lastUpdated={null} />
        <div className="p-4 md:p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            No analysis yet
          </h2>
          <p className="text-gray-400 text-sm max-w-sm">
            Run the pipeline to generate your first analysis report.
          </p>
        </div>
      </>
    );
  }

  const buys  = recommendations.filter((r) => r.action === "BUY");
  const sells = recommendations.filter((r) => r.action === "SELL");
  const holds = recommendations.filter((r) => r.action === "HOLD");
  const actionItems = analysis.action_items ?? [];
  const watchlist = analysis.watchlist ?? [];

  return (
    <>
      <Header title="Analysis Report" lastUpdated={snapshot?.created_at ?? null} />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Summary header ──────────────────────────────────────────────── */}
        <Card>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <HealthBadge health={analysis.overall_health} size="lg" />
              <span className="text-xs text-gray-500">
                {formatDate(analysis.analysis_date)}
              </span>
              <div className="flex gap-4 md:ml-auto text-xs text-gray-400">
                <span>
                  Sector risk: <span className="text-white">{analysis.sector_concentration}</span>
                </span>
                <span>
                  Portfolio risk: <span className="text-white">{analysis.risk_level}</span>
                </span>
              </div>
            </div>
            {/* Summary — split into paragraphs on double-newlines, or show with preserved line breaks */}
            <div className="text-sm text-gray-300 leading-relaxed space-y-3">
              {analysis.summary
                .split(/\n\n+/)
                .filter(Boolean)
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>
          </div>
        </Card>

        {/* ── Top Concern alert ─────────────────────────────────────────────── */}
        {analysis.top_concern && (
          <div className="rounded-xl border border-yellow-800/40 bg-yellow-950/30 p-4 flex gap-3 items-start">
            <span className="text-yellow-400 text-lg shrink-0">⚠️</span>
            <div>
              <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-1">
                Top Concern
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {analysis.top_concern}
              </p>
            </div>
          </div>
        )}

        {/* ── Signal counts banner ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <SignalCount label="Buy" count={buys.length} color="text-green-400" bg="bg-green-950/40 border-green-900/30" />
          <SignalCount label="Sell" count={sells.length} color="text-red-400" bg="bg-red-950/40 border-red-900/30" />
          <SignalCount label="Hold" count={holds.length} color="text-yellow-400" bg="bg-yellow-950/40 border-yellow-900/30" />
        </div>

        {/* ── Action Items ──────────────────────────────────────────────────── */}
        {actionItems.length > 0 && (
          <Card>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Action Items
            </h2>
            <ol className="space-y-2">
              {actionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-indigo-900/40 border border-indigo-800/40 text-indigo-300 text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">{item}</p>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* ── Recommendations — grouped by action ──────────────────────────── */}
        {buys.length > 0 && (
          <RecommendationGroup label="Buy Signals" recs={buys} />
        )}
        {sells.length > 0 && (
          <RecommendationGroup label="Sell Signals" recs={sells} />
        )}
        {holds.length > 0 && (
          <RecommendationGroup label="Hold" recs={holds} />
        )}

        {/* ── Watchlist ────────────────────────────────────────────────────── */}
        {watchlist.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Watchlist ({watchlist.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {watchlist.map((item) => (
                <Card key={item.ticker}>
                  <div className="flex items-start gap-3">
                    <span className="font-mono font-bold text-white shrink-0">
                      {item.ticker}
                    </span>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function SignalCount({
  label,
  count,
  color,
  bg,
}: {
  label: string;
  count: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`rounded-xl border p-4 text-center ${bg}`}>
      <div className={`text-3xl font-bold font-mono ${color}`}>{count}</div>
      <div className="text-xs text-gray-400 mt-1">{label} signals</div>
    </div>
  );
}

function RecommendationGroup({
  label,
  recs,
}: {
  label: string;
  recs: Recommendation[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {label} ({recs.length})
      </h2>
      <div className="space-y-3">
        {recs.map((rec) => (
          <RecommendationCard key={`${rec.ticker}-${rec.brokerage}`} rec={rec} />
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const signals = rec.key_signals ?? [];
  return (
    <Card>
      <div className="flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <ActionBadge action={rec.action} />
          <BrokerageBadge brokerage={rec.brokerage} />
          <a
            href={`/ticker/${rec.ticker}`}
            className="font-mono font-bold text-white text-lg hover:text-indigo-300 transition-colors"
          >
            {rec.ticker}
          </a>
          <span className="text-sm text-gray-400 truncate flex-1">
            {rec.name}
          </span>
          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <ConfidenceBadge confidence={rec.confidence} />
            {rec.urgency && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                rec.urgency === "immediate"
                  ? "text-red-300 border-red-800/40 bg-red-950/30"
                  : rec.urgency === "soon"
                  ? "text-yellow-300 border-yellow-800/40 bg-yellow-950/30"
                  : "text-gray-400 border-gray-700/40 bg-gray-900/30"
              }`}>
                {rec.urgency === "no_rush" ? "no rush" : rec.urgency}
              </span>
            )}
          </div>
        </div>

        {/* Thesis */}
        <p className="text-sm text-gray-200 leading-relaxed">{rec.thesis}</p>

        {/* Bull / Bear */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-green-950/20 border border-green-900/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-green-400 mb-1 uppercase tracking-wide">
              Bull Case
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {rec.bull_case}
            </p>
          </div>
          <div className="bg-red-950/20 border border-red-900/20 rounded-lg p-3">
            <div className="text-xs font-semibold text-red-400 mb-1 uppercase tracking-wide">
              Bear Case
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              {rec.bear_case}
            </p>
          </div>
        </div>

        {/* Key signals */}
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {signals.slice(0, 5).map((signal, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-md bg-indigo-900/30 text-indigo-300 border border-indigo-900/30"
              >
                {signal}
              </span>
            ))}
            {signals.length > 5 && (
              <span className="text-xs text-gray-500">+{signals.length - 5} more</span>
            )}
          </div>
        )}

        {/* Position note */}
        {rec.position_note && (
          <p className="text-xs text-gray-500 italic border-t border-white/5 pt-2">
            📝 {rec.position_note}
          </p>
        )}
      </div>
    </Card>
  );
}
