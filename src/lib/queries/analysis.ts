import { createClient } from "@/lib/supabase/server";
import type { AnalysisReport, Recommendation } from "@/lib/types/analysis";

/** Latest analysis report with metadata */
export async function getLatestAnalysis(): Promise<AnalysisReport | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analysis_reports")
    .select("*, pipeline_runs(run_at, model, input_tokens, output_tokens)")
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

/** All recommendations for latest report */
export async function getLatestRecommendations(): Promise<Recommendation[]> {
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("analysis_reports")
    .select("id")
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();

  if (!report) return [];

  const { data } = await supabase
    .from("recommendations")
    .select("*")
    .eq("report_id", report.id)
    .order("action", { ascending: true }); // BUY first, then HOLD, SELL

  return data ?? [];
}

/** Recommendation for a specific ticker */
export async function getTickerRecommendation(ticker: string): Promise<Recommendation | null> {
  const supabase = await createClient();

  const { data: report } = await supabase
    .from("analysis_reports")
    .select("id")
    .order("analysis_date", { ascending: false })
    .limit(1)
    .single();

  if (!report) return null;

  const { data } = await supabase
    .from("recommendations")
    .select("*")
    .eq("report_id", report.id)
    .eq("ticker", ticker)
    .single();

  return data ?? null;
}
