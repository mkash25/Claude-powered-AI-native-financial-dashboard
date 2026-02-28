import { PortfolioSnapshot, AccountType } from "@/lib/types/portfolio";
import { ACCOUNT_CATEGORY_CONFIG } from "@/lib/constants";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { RsuGrant } from "@/lib/queries/rsu";
import type { ManualAsset } from "@/lib/queries/manual-accounts";

interface CategoryCardsProps {
  snapshot: PortfolioSnapshot;
  rsuGrants: RsuGrant[];
  manualAssets: ManualAsset[];
}

export function CategoryCards({ snapshot, rsuGrants, manualAssets }: CategoryCardsProps) {
  const cats = snapshot.account_categories_json ?? {};

  // Manual asset totals per category (e.g. Fidelity 401k → retirement)
  const manualByCategory: Record<string, { value: number; positions: number }> = {};
  for (const a of manualAssets) {
    const cat = a.category || "other";
    if (!manualByCategory[cat]) manualByCategory[cat] = { value: 0, positions: 0 };
    manualByCategory[cat].value += a.balance;
    manualByCategory[cat].positions += 1;
  }

  // RSU computed value — only VESTED units count toward net worth
  const rsuTotalUnits = rsuGrants.reduce((s, g) => s + g.total_units, 0);
  const rsuVestedUnits = rsuGrants.reduce((s, g) => s + g.vested_units, 0);
  const rsuUnvestedUnits = rsuTotalUnits - rsuVestedUnits;
  const rsuPrice = rsuGrants[0]?.current_price ?? null;
  const rsuVestedValue = rsuPrice && rsuVestedUnits > 0 ? rsuVestedUnits * rsuPrice : null;

  const CATEGORIES: { key: AccountType; label: string; icon: string }[] = [
    { key: "taxable",    label: "Taxable",    icon: "📈" },
    { key: "retirement", label: "Retirement", icon: "🏦" },
    { key: "liquid",     label: "Liquid",     icon: "💧" },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      {CATEGORIES.map(({ key, label, icon }) => {
        const cfg = ACCOUNT_CATEGORY_CONFIG[key];
        const plaid = cats[key];
        const manual = manualByCategory[key];
        const combinedValue = (plaid?.value ?? 0) + (manual?.value ?? 0);
        const combinedPositions = (plaid?.positions ?? 0) + (manual?.positions ?? 0);
        const hasData = combinedValue > 0;
        return (
          <div
            key={key}
            className="rounded-xl border p-4 flex flex-col gap-2"
            style={{ borderColor: cfg.border, background: cfg.bg }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>
                {label}
              </span>
            </div>
            {hasData ? (
              <>
                <p className="text-xl font-bold font-mono text-white">
                  {formatCurrency(combinedValue, 0)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{combinedPositions} accounts</span>
                  {plaid && manual && (
                    <span style={{ color: cfg.color }} title={`Plaid: ${formatCurrency(plaid.value, 0)} · Manual: ${formatCurrency(manual.value, 0)}`}>
                      +manual
                    </span>
                  )}
                  {plaid && !manual && (
                    <span style={{ color: cfg.color }}>{formatPercent(plaid.pct)}</span>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">No data</p>
            )}
          </div>
        );
      })}

      {/* RSU card — always shown if grants exist */}
      {rsuGrants.length > 0 && (
        <div
          className="rounded-xl border p-4 flex flex-col gap-2"
          style={{ borderColor: "#7c3aed", background: "#2e1065" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🔒</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
              RSUs (vested)
            </span>
          </div>
          {rsuVestedValue != null ? (
            <p className="text-xl font-bold font-mono text-white">
              {formatCurrency(rsuVestedValue, 0)}
            </p>
          ) : (
            <p className="text-xl font-bold font-mono text-gray-500">$0</p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{rsuUnvestedUnits.toFixed(0)} unvested</span>
            <span className="text-violet-400">{rsuTotalUnits.toFixed(0)} total</span>
          </div>
        </div>
      )}
    </div>
  );
}
