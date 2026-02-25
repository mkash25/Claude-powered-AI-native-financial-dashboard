// ── Portfolio types — mirrors the Python pipeline JSON schemas ─────────────

export type Brokerage = "Stash" | "Robinhood" | "Sofi" | "Acorns";
export type AssetType = "etf" | "equity" | "cash";

export interface BrokerageSummary {
  value: number;
  positions: number;
}

export interface AssetTypeSummary {
  value: number;
  pct: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_cost_basis: number;
  total_gain_loss: number;
  total_gain_loss_pct?: number;
  total_positions: number;
  brokerages: Brokerage[];
}

export interface Holding {
  id?: string;
  snapshot_id?: string;
  brokerage: Brokerage;
  ticker: string;
  name: string;
  type: AssetType;
  quantity: number;
  cost_basis: number | null;
  price: number;
  value: number;
  gain_loss: number | null;
  gain_loss_pct: number | null;
  currency?: string;
}

export interface Technicals {
  price: number;
  sma_50: number | null;
  sma_200: number | null;
  ema_12: number | null;
  ema_26: number | null;
  rsi_14: number | null;
  rsi_signal: "oversold" | "overbought" | "neutral" | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_lower: number | null;
  bb_mid: number | null;
  bb_upper: number | null;
  bb_position: "within_bands" | "below_lower" | "above_upper" | null;
  pct_above_sma50: number | null;
  pct_above_sma200: number | null;
  golden_cross: boolean | null;
}

export interface Fundamentals {
  sector: string | null;
  industry: string | null;
  market_cap: number | null;
  pe_trailing: number | null;
  pe_forward: number | null;
  peg_ratio: number | null;
  price_to_book: number | null;
  dividend_yield: number | null;
  beta: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  avg_volume: number | null;
  revenue_growth: number | null;
  earnings_growth: number | null;
  profit_margin: number | null;
  return_on_equity: number | null;
  debt_to_equity: number | null;
  free_cash_flow: number | null;
  analyst_target: number | null;
  analyst_rec: string | null;
  short_description: string | null;
}

export interface Performance {
  return_1d: number | null;
  return_1w: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_6m: number | null;
  pct_from_52w_high: number | null;
  pct_from_52w_low: number | null;
  analyst_upside_pct: number | null;
}

export interface NewsItem {
  title: string;
  publisher: string;
  link: string;
  published: string;
}

export interface Enrichment {
  id?: string;
  snapshot_id?: string;
  ticker: string;
  technicals: Technicals;
  fundamentals: Fundamentals;
  performance: Performance;
  news: NewsItem[];
}

export interface PortfolioSnapshot {
  id: string;
  run_id: string;
  snapshot_date: string;
  total_value: number;
  total_cost_basis: number;
  total_gain_loss: number;
  total_positions: number;
  brokerages_json: Record<Brokerage, BrokerageSummary>;
  asset_types_json: Record<AssetType, AssetTypeSummary>;
  created_at: string;
}

export interface PortfolioHistoryEntry {
  date: string;
  total_value: number;
  total_cost_basis: number;
  total_gain_loss: number;
  gain_loss_pct: number;
  total_positions: number;
  brokerages: Record<Brokerage, BrokerageSummary>;
  asset_types: Record<AssetType, AssetTypeSummary>;
}

export interface PipelineRun {
  id: string;
  run_at: string;
  trigger: "scheduled" | "manual";
  status: "success" | "failed";
  model: string;
  input_tokens: number;
  output_tokens: number;
  duration_s: number;
}
