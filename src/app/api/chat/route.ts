// @ts-nocheck
import { streamText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { PROJECTION_DEFAULTS } from "@/lib/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── Tool implementations (server-side Supabase queries) ───────────────────────

async function fetchPortfolioSummary() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("portfolio_snapshots")
    .select("total_value, total_cost_basis, total_gain_loss, total_positions, brokerages_json, asset_types_json")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function fetchLatestAnalysis() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analysis_reports")
    .select("overall_health, summary, sector_concentration, risk_level, top_concern, action_items, watchlist, analysis_date")
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();
  return data;
}

async function fetchRecommendations(actionFilter?: string) {
  const supabase = await createClient();
  const { data: report } = await supabase
    .from("analysis_reports")
    .select("id")
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();
  if (!report) return [];

  let query = supabase
    .from("recommendations")
    .select("ticker, name, brokerage, action, confidence, urgency, thesis, key_signals, position_note")
    .eq("report_id", report.id);

  if (actionFilter && ["BUY", "SELL", "HOLD"].includes(actionFilter.toUpperCase())) {
    query = query.eq("action", actionFilter.toUpperCase());
  }
  const { data } = await query.order("action").order("confidence");
  return data ?? [];
}

async function fetchManualTotals() {
  const supabase = await createClient();
  const [{ data: assets }, { data: debts }] = await Promise.all([
    supabase.from("manual_assets").select("balance"),
    supabase.from("manual_debts").select("balance"),
  ]);
  const assetsTotal = (assets ?? []).reduce((s: number, a: any) => s + (a.balance ?? 0), 0);
  const debtsTotal = (debts ?? []).reduce((s: number, d: any) => s + (d.balance ?? 0), 0);
  return { assetsTotal, debtsTotal };
}

async function fetchHoldingDetail(ticker: string) {
  const supabase = await createClient();
  const { data: snap } = await supabase
    .from("portfolio_snapshots")
    .select("id")
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .single();
  if (!snap) return null;

  const [{ data: enrich }, { data: holdings }] = await Promise.all([
    supabase
      .from("enrichment")
      .select("ticker, technicals, fundamentals, performance")
      .eq("snapshot_id", snap.id)
      .eq("ticker", ticker.toUpperCase())
      .single(),
    supabase
      .from("holdings")
      .select("ticker, name, brokerage, quantity, price, value, gain_loss, gain_loss_pct")
      .eq("snapshot_id", snap.id)
      .eq("ticker", ticker.toUpperCase()),
  ]);

  return { enrichment: enrich, positions: holdings ?? [] };
}

function runProjection(
  monthlyContrib: number,
  annualReturnPct: number,
  targetAge: number,
  startBrokerage: number,
  manualAssetsTotal: number,
  manualDebtsTotal: number,
) {
  const D = PROJECTION_DEFAULTS;
  let brokerage = startBrokerage;
  const r = annualReturnPct / 100;
  const years = targetAge - D.currentAge;

  for (let i = 0; i < years; i++) {
    brokerage = brokerage * (1 + r) + monthlyContrib * 12;
  }
  const total = brokerage + manualAssetsTotal - manualDebtsTotal;
  return {
    targetAge,
    years,
    brokerageValue: Math.round(brokerage),
    totalNetWorth: Math.round(total),
    monthlyAtTarget: Math.round(monthlyContrib),
  };
}

// ── Route handler ──────────────────────────────────────────────────────────────

const formatUSD = (v: number) => "$" + Math.round(v).toLocaleString();

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Fetch live totals for system prompt + projection tool
  const [portfolioSnap, manualTotals] = await Promise.all([
    fetchPortfolioSummary(),
    fetchManualTotals(),
  ]);
  const liveBrokerage = portfolioSnap?.total_value ?? 172_248;
  const liveManualAssets = manualTotals.assetsTotal;
  const liveManualDebts = manualTotals.debtsTotal;
  const liveNetWorth = liveBrokerage + liveManualAssets - liveManualDebts;

  const result = await streamText({
    model: anthropic("claude-opus-4-5"),
    system: `You are a personal financial advisor AI with direct access to the user's investment portfolio data.
You have tools to query their live portfolio including holdings, market data, Claude's analysis, and wealth projections.

Key facts about this user (live from database):
- Age 31, targeting financial independence at age 45
- ${formatUSD(liveBrokerage)} in brokerage accounts (Plaid: Stash, Robinhood, SoFi, Acorns)
- ${formatUSD(liveManualAssets)} in manually tracked assets (retirement accounts, cash, etc.)
- ${formatUSD(liveManualDebts)} in tracked debts
- True net worth: ${formatUSD(liveNetWorth)}
- Contributing ~$1,000/month to brokerage

Be direct, data-driven, and actionable. Use the tools to get real data before answering portfolio questions.
Format numbers as currency when relevant. Keep responses concise and focused.`,

    messages,
    maxSteps: 5, // allow multi-step tool use

    tools: {
      get_portfolio_summary: tool({
        description:
          "Get the current portfolio summary: total value, gain/loss, positions, brokerage breakdown, and asset allocation.",
        parameters: z.object({}),
        execute: async () => fetchPortfolioSummary(),
      }),

      get_analysis: tool({
        description:
          "Get Claude's latest portfolio analysis: health assessment, risk level, sector concentration, top concern, and action items.",
        parameters: z.object({}),
        execute: async () => fetchLatestAnalysis(),
      }),

      get_recommendations: tool({
        description:
          "Get buy/sell/hold recommendations. Optionally filter by action type.",
        parameters: z.object({
          action_filter: z
            .enum(["BUY", "SELL", "HOLD", "ALL"])
            .optional()
            .describe("Filter by action type. Omit for all."),
        }),
        execute: async ({ action_filter }) =>
          fetchRecommendations(
            action_filter === "ALL" ? undefined : action_filter
          ),
      }),

      get_holding_detail: tool({
        description:
          "Get detailed market data and position info for a specific ticker (RSI, MACD, fundamentals, performance, position sizes).",
        parameters: z.object({
          ticker: z.string().describe("Stock/ETF ticker symbol, e.g. AAPL"),
        }),
        execute: async ({ ticker }) => fetchHoldingDetail(ticker),
      }),

      run_projection: tool({
        description:
          "Run a wealth projection to see how net worth grows over time with given assumptions.",
        parameters: z.object({
          monthly_contribution: z
            .number()
            .describe("Monthly brokerage contribution in USD"),
          annual_return_pct: z
            .number()
            .describe("Assumed annual return percentage (e.g. 8 for 8%)"),
          target_age: z
            .number()
            .describe("Age at which to compute projected net worth"),
        }),
        execute: async ({ monthly_contribution, annual_return_pct, target_age }) =>
          runProjection(monthly_contribution, annual_return_pct, target_age,
            liveBrokerage, liveManualAssets, liveManualDebts),
      }),
    },
  });

  // Cast needed: TypeScript can't resolve toDataStreamResponse on complex TOOLS generic in ai@3.4.33
  return (result as unknown as { toDataStreamResponse: () => Response }).toDataStreamResponse();
}
