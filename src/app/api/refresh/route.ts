import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// POST /api/refresh — queue a pipeline refresh
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: check if last pipeline run was within 30 minutes
  const { data: lastRun } = await supabase
    .from("pipeline_runs")
    .select("run_at")
    .order("run_at", { ascending: false })
    .limit(1)
    .single();

  if (lastRun) {
    const diffMins = (Date.now() - new Date(lastRun.run_at).getTime()) / 60_000;
    if (diffMins < 30) {
      return NextResponse.json(
        { error: `Pipeline ran ${Math.floor(diffMins)}m ago. Wait ${30 - Math.floor(diffMins)}m before refreshing again.` },
        { status: 429 }
      );
    }
  }

  // Check if there's already a pending/running request
  const { data: existing } = await supabase
    .from("refresh_requests")
    .select("id, status")
    .in("status", ["pending", "running"])
    .order("requested_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status });
  }

  // Insert new request
  const { data, error } = await supabase
    .from("refresh_requests")
    .insert({ status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ id: data.id, status: "pending" });
}

// GET /api/refresh?id=<uuid> — poll request status
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("refresh_requests")
    .select("id, status, requested_at, picked_up_at, completed_at, error_message")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  return NextResponse.json(data);
}
