"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PortfolioSnapshot } from "@/lib/types/portfolio";
import { Card, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const ASSET_COLORS: Record<string, string> = {
  etf:    "#3b82f6",
  equity: "#22c55e",
  cash:   "#94a3b8",
};

const ASSET_LABELS: Record<string, string> = {
  etf:    "ETFs",
  equity: "Equities",
  cash:   "Cash",
};

interface AllocationChartProps {
  snapshot: PortfolioSnapshot;
}

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, pct } = payload[0].payload;
  return (
    <div className="bg-surface border border-white/10 rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="font-semibold text-white">{name}</div>
      <div className="text-gray-300">{formatCurrency(value, 0)}</div>
      <div className="text-gray-400">{pct.toFixed(1)}%</div>
    </div>
  );
}

export function AllocationChart({ snapshot }: AllocationChartProps) {
  const data = Object.entries(snapshot.asset_types_json)
    .filter(([, s]) => s.value > 0)
    .map(([type, s]) => ({
      key: type,
      name: ASSET_LABELS[type] ?? type,
      value: s.value,
      pct: s.pct,
    }));

  if (data.length === 0) {
    return (
      <Card>
        <CardTitle>Asset Allocation</CardTitle>
        <div className="flex items-center justify-center h-32 text-gray-500 text-sm mt-3">
          No allocation data
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>Asset Allocation</CardTitle>
      <div className="flex items-center gap-4 mt-3">
        {/* Donut chart */}
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={52}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={ASSET_COLORS[entry.key] ?? "#6b7280"}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2.5 flex-1">
          {data.map((entry) => (
            <div key={entry.key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    background: ASSET_COLORS[entry.key] ?? "#6b7280",
                  }}
                />
                <span className="text-xs text-gray-300">{entry.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-mono text-white">
                  {entry.pct.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  {formatCurrency(entry.value, 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
