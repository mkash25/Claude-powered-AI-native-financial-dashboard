// ── Analysis types — mirrors Claude's output schema ────────────────────────

export type Action = "BUY" | "SELL" | "HOLD";
export type Confidence = "high" | "medium" | "low";
export type Urgency = "immediate" | "soon" | "no_rush";
export type Health = "strong" | "moderate" | "weak";

export interface Recommendation {
  id?: string;
  report_id?: string;
  ticker: string;
  name: string;
  brokerage: string;
  action: Action;
  confidence: Confidence;
  urgency: Urgency;
  thesis: string;
  bull_case: string;
  bear_case: string;
  key_signals: string[];
  risk_factors: string[];
  position_note: string;
}

export interface WatchlistItem {
  ticker: string;
  reason: string;
}

export interface PortfolioAssessment {
  overall_health: Health;
  summary: string;
  sector_concentration: string;
  risk_level: string;
  top_concern: string;
}

export interface AnalysisReport {
  id: string;
  run_id: string;
  analysis_date: string;
  overall_health: Health;
  summary: string;
  sector_concentration: string;
  risk_level: string;
  top_concern: string;
  action_items: string[];
  watchlist: WatchlistItem[];
  created_at?: string;
  // Joined from pipeline_runs
  run?: {
    run_at: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
  };
}

export interface RefreshRequest {
  id: string;
  requested_at: string;
  status: "pending" | "running" | "completed" | "failed";
  picked_up_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}
