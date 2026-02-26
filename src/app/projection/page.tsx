import { Header } from "@/components/layout/header";
import { getLatestSnapshot } from "@/lib/queries/portfolio";
import { getManualAssets, getManualDebts } from "@/lib/queries/manual-accounts";
import { ProjectionClient } from "./client";

export const dynamic = "force-dynamic";

export default async function ProjectionPage() {
  const [snapshot, manualAssets, manualDebts] = await Promise.all([
    getLatestSnapshot(),
    getManualAssets(),
    getManualDebts(),
  ]);

  const startBrokerage = snapshot?.total_value ?? 172_248;
  const retirementHsa = manualAssets
    .filter((a) => a.category === "retirement")
    .reduce((sum, a) => sum + a.balance, 0);
  const cashSavings = manualAssets
    .filter((a) => a.category === "cash")
    .reduce((sum, a) => sum + a.balance, 0);
  const debts = manualDebts.reduce((sum, d) => sum + d.balance, 0);

  return (
    <>
      <Header title="Wealth Projection" lastUpdated={snapshot?.created_at ?? null} />
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <ProjectionClient
            startBrokerage={startBrokerage}
            retirementHsa={retirementHsa}
            cashSavings={cashSavings}
            debts={debts}
          />
        </div>
      </div>
    </>
  );
}
