import { createClient } from "@/lib/supabase/server";

export interface ManualAsset {
  id: string;
  name: string;
  institution: string | null;
  category: string;
  account_type: string | null;
  balance: number;
  notes: string | null;
  updated_at: string;
}

export interface ManualDebt {
  id: string;
  name: string;
  institution: string | null;
  debt_type: string;
  balance: number;
  notes: string | null;
  updated_at: string;
}

export async function getManualAssets(): Promise<ManualAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manual_assets")
    .select("*")
    .order("category")
    .order("name");
  return data ?? [];
}

export async function getManualDebts(): Promise<ManualDebt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("manual_debts")
    .select("*")
    .order("debt_type")
    .order("name");
  return data ?? [];
}
