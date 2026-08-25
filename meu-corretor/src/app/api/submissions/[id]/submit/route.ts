import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { text_content } = await req.json();
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from("submissions")
    .update({
      text_content,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "draft");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
