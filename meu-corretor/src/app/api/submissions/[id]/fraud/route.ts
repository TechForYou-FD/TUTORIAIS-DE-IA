import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { event } = await req.json();
  const supabase = await createAdminClient();

  // Append event to JSONB array
  const { error } = await supabase.rpc("append_fraud_event", {
    p_submission_id: id,
    p_event: event,
  });

  // Fallback if RPC not available — fetch and update
  if (error) {
    const { data: sub } = await supabase.from("submissions").select("fraud_events").eq("id", id).single();
    if (sub) {
      const events = [...(sub.fraud_events || []), event];
      await supabase.from("submissions").update({ fraud_events: events }).eq("id", id);
    }
  }

  return NextResponse.json({ ok: true });
}
