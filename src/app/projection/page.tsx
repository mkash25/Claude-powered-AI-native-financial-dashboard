"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardTitle } from "@/components/ui/card";
import { PROJECTION_DEFAULTS, MILESTONES } from "@/lib/constants";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── FI Projection calculation ────────────────────────────────────────────────
interface ProjectionRow {
  year: number;
  age: number;
  brokerage: number;
  retirementHsa: number;
  cash: number;
  total: number;
}

function calcProjection(
  startBrokerage: number,
  monthlyContrib: number,
  annualReturnPct: number,
  contribIncreasePct: number,
  years: number,
  currentAge: number,
  retirementHsa: number,
  cashSavings: number,
  debts: number
): ProjectionRow[] {
  const rows: ProjectionRow[] = [];
  let brokerage = startBrokerage;
  let monthly = monthlyContrib;
  const r = annualReturnPct / 100;
  const retHsa = retirementHsa; // assume steady growth at 7% (simplified)

  for (let yr = 0; yr <= years; yr++) {
    const total = brokerage + retHsa + cashSavings - debts;
    rows.push({
      year: new Date().getFullYear() + yr,
      age: currentAge + yr,
      brokerage: Math.round(brokerage),
      retirementHsa: Math.round(retHsa),
      cash: Math.round(cashSavings),
      total: Math.round(total),
    });

    // Grow for next year
    brokerage = brokerage * (1 + r) + monthly * 12;
    monthly = monthly * (1 + contribIncreasePct / 100);
  }

  return rows;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const row: ProjectionRow = payload[0]?.payload;
  return (
    <div className="bg-surface border border-white/10 rounded-lg p-3 text-xs shadow-xl space-y-1">
      <div className="font-semibold text-white mb-2">
        {label} (Age {row.age})
      </div>
      <div className="text-indigo-300">
        Brokerage: {formatCompactCurrency(row.brokerage)}
      </div>
      <div className="text-purple-300">
        Retirement/HSA: {formatCompactCurrency(row.retirementHsa)}
      </div>
      <div className="text-slate-300">
        Cash: {formatCompactCurrency(row.cash)}
      </div>
      <div className="text-white font-bold border-t border-white/10 pt-1">
        Total: {formatCompactCurrency(row.total)}
      </div>
    </div>
  );
}

export default function ProjectionPage() {
  const D = PROJECTION_DEFAULTS;

  const [monthlyContrib, setMonthlyContrib] = useState(D.monthlyContribution);
  const [annualReturn, setAnnualReturn] = useState(D.assumedAnnualReturn);
  const [contribIncrease, setContribIncrease] = useState(D.annualContributionIncrease);
  const [fiAge, setFiAge] = useState(D.targetFiAge);

  const years = fiAge - D.currentAge + 5; // project 5 years past FI target

  // We don't have live brokerage data on the client — use the constant from MEMORY.md
  const startBrokerage = 172_248;

  const projectionData = useMemo(
    () =>
      calcProjection(
        startBrokerage,
        monthlyContrib,
        annualReturn,
        contribIncrease,
        years,
        D.currentAge,
        D.retirementHsa,
        D.cashSavings,
        D.debts
      ),
    [monthlyContrib, annualReturn, contribIncrease, years]
  );

  const fiRow = projectionData.find((r) => r.age === fiAge);

  // Find milestones
  const milestoneHits = MILESTONES.map((m) => ({
    amount: m,
    row: projectionData.find((r) => r.total >= m),
  })).filter((m) => m.row);

  return (
    <>
      <Header title="Wealth Projection" lastUpdated={null} />
      <div className="p-4 md:p-6 space-y-6">
        {/* ── Controls ─────────────────────────────────────────────────────── */}
        <Card>
          <CardTitle>Projection Settings</CardTitle>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Slider
              label="Monthly Contribution"
              value={monthlyContrib}
              onChange={setMonthlyContrib}
              min={100}
              max={5000}
              step={50}
              format={(v) => formatCurrency(v, 0)}
            />
            <Slider
              label="Annual Return"
              value={annualReturn}
              onChange={setAnnualReturn}
              min={3}
              max={15}
              step={0.5}
              format={(v) => `${v}%`}
            />
            <Slider
              label="Contribution Increase / Year"
              value={contribIncrease}
              onChange={setContribIncrease}
              min={0}
              max={20}
              step={0.5}
              format={(v) => `${v}%`}
            />
            <Slider
              label="FI Target Age"
              value={fiAge}
              onChange={setFiAge}
              min={38}
              max={65}
              step={1}
              format={(v) => `Age ${v}`}
            />
          </div>
        </Card>

        {/* ── FI target callout ────────────────────────────────────────────── */}
        {fiRow && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard
              label={`Net Worth at ${fiAge}`}
              value={formatCompactCurrency(fiRow.total)}
              color="text-indigo-400"
            />
            <KpiCard
              label="Brokerage Only"
              value={formatCompactCurrency(fiRow.brokerage)}
              color="text-blue-400"
            />
            <KpiCard
              label="Years to FI"
              value={`${fiAge - D.currentAge} yrs`}
              color="text-green-400"
            />
            <KpiCard
              label="Total Monthly at FI"
              value={formatCurrency(
                monthlyContrib *
                  Math.pow(1 + contribIncrease / 100, fiAge - D.currentAge),
                0
              )}
              color="text-yellow-400"
            />
          </div>
        )}

        {/* ── Stacked area chart ───────────────────────────────────────────── */}
        <Card>
          <CardTitle>Net Worth Projection</CardTitle>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <defs>
                  <linearGradient id="colorBrokerage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorRetirement" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* FI target line */}
                <ReferenceLine
                  x={fiRow?.year}
                  stroke="#22c55e"
                  strokeDasharray="4 4"
                  label={{
                    value: `FI Age ${fiAge}`,
                    fill: "#22c55e",
                    fontSize: 10,
                  }}
                />
                {/* Milestone lines */}
                {MILESTONES.map((m) => (
                  <ReferenceLine
                    key={m}
                    y={m}
                    stroke="#ffffff10"
                    strokeDasharray="2 4"
                  />
                ))}
                <Area
                  type="monotone"
                  dataKey="cash"
                  stackId="1"
                  stroke="#64748b"
                  fill="url(#colorCash)"
                  name="Cash"
                />
                <Area
                  type="monotone"
                  dataKey="retirementHsa"
                  stackId="1"
                  stroke="#a855f7"
                  fill="url(#colorRetirement)"
                  name="Retirement/HSA"
                />
                <Area
                  type="monotone"
                  dataKey="brokerage"
                  stackId="1"
                  stroke="#6366f1"
                  fill="url(#colorBrokerage)"
                  name="Brokerage"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* ── Milestone timeline ───────────────────────────────────────────── */}
        <Card>
          <CardTitle>Milestone Timeline</CardTitle>
          <div className="mt-4 flex flex-col gap-2">
            {milestoneHits.map(({ amount, row }) => (
              <div
                key={amount}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <span className="text-sm font-mono text-white">
                  {formatCompactCurrency(amount)}
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{row!.year}</span>
                  <span>Age {row!.age}</span>
                  <span className="text-indigo-400">
                    +{row!.age - D.currentAge} yrs
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Year-by-year table ───────────────────────────────────────────── */}
        <Card>
          <CardTitle>Year-by-Year Breakdown</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8">
                  {["Year", "Age", "Brokerage", "Retire/HSA", "Cash", "Total"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-right px-3 py-2 text-gray-400 uppercase tracking-wider first:text-left font-semibold"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/4">
                {projectionData.map((row) => (
                  <tr
                    key={row.year}
                    className={
                      row.age === fiAge
                        ? "bg-green-950/30"
                        : "hover:bg-white/3"
                    }
                  >
                    <td className="px-3 py-2 text-gray-300">{row.year}</td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      {row.age}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-indigo-300">
                      {formatCompactCurrency(row.brokerage)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-purple-300">
                      {formatCompactCurrency(row.retirementHsa)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-400">
                      {formatCompactCurrency(row.cash)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-white font-semibold">
                      {formatCompactCurrency(row.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-sm font-mono font-semibold text-white">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-gray-600 mt-1">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-surface p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
    </div>
  );
}
