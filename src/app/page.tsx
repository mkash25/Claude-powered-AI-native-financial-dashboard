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
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const revalidate = 3600; // revalidate hourly

export default async function DashboardPage() {
  const [snapshot, analysis, recommendations, holdings, enrichment] =
    await Promise.all([
      getLatestSnapshot(),
      getLatestAnalysis(),
      getLatestRecommendations(),
      getLatestHoldings(),
      getLatestEnrichment(),
    ]);

  return (
    <>
      <Header title="Dashboard" lastUpdated={snapshot?.created_at ?? null} />
      <div className="p-4 md:p-6">
        {!snapshot ? (
          <EmptyState />
        ) : (
          <DashboardContent
            snapshot={snapshot}
            analysis={analysis}
            recommendations={recommendations}
            holdings={holdings}
            enrichment={enrichment}
          />
        )}
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
