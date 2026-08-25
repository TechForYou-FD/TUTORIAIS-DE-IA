import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { assignment_id, student_name, student_email, student_class } = body;

  if (!assignment_id || !student_name || !student_email || !student_class) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await createAdminClient();

  // Check assignment is active and available
  const { data: asgn } = await supabase
    .from("assignments")
    .select("id, status, available_from, available_to")
    .eq("id", assignment_id)
    .single();

  if (!asgn) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  const now = new Date();
  if (asgn.status === "closed" || now < new Date(asgn.available_from)) {
    return NextResponse.json({ error: "Assignment not available" }, { status: 403 });
  }
  if (asgn.available_to && now > new Date(asgn.available_to)) {
    return NextResponse.json({ error: "Assignment closed" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("submissions")
    .insert({ assignment_id, student_name, student_email, student_class, status: "draft" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
