import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { correctSubmission } from "@/lib/anthropic/correct";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createAdminClient();

  // Load submission + assignment
  const { data: sub } = await supabase
    .from("submissions")
    .select("*, assignment:assignments(*, class:classes(*))")
    .eq("id", id)
    .single();

  if (!sub) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (sub.status !== "submitted") return NextResponse.json({ error: "Not submitted" }, { status: 400 });

  const assignment = sub.assignment as { proposal_text: string; criteria: Parameters<typeof correctSubmission>[0]["criteria"]; language: "pt" | "en" };

  try {
    const result = await correctSubmission({
      studentText: sub.text_content,
      proposalText: assignment.proposal_text,
      criteria: assignment.criteria,
      language: assignment.language,
    });

    const { error: corrErr } = await supabase.from("corrections").insert({
      submission_id: id,
      proposed_grade: result.proposed_grade,
      max_grade: result.max_grade,
      criteria_scores: result.criteria_scores,
      errors: result.errors,
      summary: result.summary,
      student_report: result.student_report,
    });

    if (corrErr) {
      // Update if already exists
      await supabase.from("corrections").update({
        proposed_grade: result.proposed_grade,
        criteria_scores: result.criteria_scores,
        errors: result.errors,
        summary: result.summary,
        student_report: result.student_report,
      }).eq("submission_id", id);
    }

    await supabase.from("submissions").update({ status: "corrected" }).eq("id", id);

    return NextResponse.json({ ok: true, result });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Correction failed" }, { status: 500 });
  }
}
