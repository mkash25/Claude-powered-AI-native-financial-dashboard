import { Header } from "@/components/layout/header";
import {
  getLatestSnapshot,
  getLatestHoldings,
  getLatestEnrichment,
} from "@/lib/queries/portfolio";
import {
  getLatestAnalysis,
  getLatestRecommendations,
} from "@/lib/queries/analysis";
import { getManualAssets, getManualDebts } from "@/lib/queries/manual-accounts";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const revalidate = 3600; // revalidate hourly

export default async function DashboardPage() {
  const [snapshot, analysis, recommendations, holdings, enrichment, manualAssets, manualDebts] =
    await Promise.all([
      getLatestSnapshot(),
      getLatestAnalysis(),
      getLatestRecommendations(),
      getLatestHoldings(),
      getLatestEnrichment(),
      getManualAssets(),
      getManualDebts(),
    ]);

  return (
    <>
      <Header title="Dashboard" lastUpdated={snapshot?.created_at ?? null} />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {!snapshot ? (
            <EmptyState />
          ) : (
            <DashboardContent
              snapshot={snapshot}
              analysis={analysis}
              recommendations={recommendations}
              holdings={holdings}
              enrichment={enrichment}
              manualAssets={manualAssets}
              manualDebts={manualDebts}
            />
          )}
        </div>
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-4">📊</div>
      <h2 className="text-xl font-semibold text-white mb-2">No data yet</h2>
      <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
        Run the pipeline on your Mac to populate the dashboard.
        Use the <strong className="text-white">Refresh</strong> button above,
        or run:
      </p>
      <code className="mt-3 px-4 py-2 bg-surface rounded-lg text-blue-400 text-xs font-mono">
        launchctl start com.finanalyst.pipeline
      </code>
    </div>
  );
}
