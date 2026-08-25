import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { sendStudentReport, sendTeacherReport } from "@/lib/email/send";
import type { Submission, Correction, Assignment, FraudReport } from "@/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  const { assignmentId } = await params;
  const supabase = await createAdminClient();

  // Load assignment with teacher info
  const { data: asgn } = await supabase
    .from("assignments")
    .select("*, class:classes(*), teacher:teachers(*)")
    .eq("id", assignmentId)
    .single();

  if (!asgn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Load approved submissions with corrections
  const { data: subs } = await supabase
    .from("submissions")
    .select("*, correction:corrections(*)")
    .eq("assignment_id", assignmentId)
    .eq("status", "corrected");

  if (!subs || subs.length === 0) {
    return NextResponse.json({ error: "No corrected submissions" }, { status: 400 });
  }

  const results: { sent: string[]; failed: string[] } = { sent: [], failed: [] };
  const teacherData: { submission: Submission; correction: Correction; fraud: FraudReport }[] = [];

  for (const sub of subs) {
    const correction = (sub as Submission & { correction: Correction }).correction;
    if (!correction || correction.approved_grade === undefined) continue;
    if (correction.email_sent) continue;

    const fraudEvents = (sub as Submission).fraud_events || [];
    const byType: Record<string, number> = {};
    fraudEvents.forEach((ev) => { byType[ev.type] = (byType[ev.type] || 0) + 1; });
    const total = fraudEvents.length;
    const fraud: FraudReport = {
      total_events: total,
      by_type: byType,
      risk_level: total === 0 ? "low" : total <= 2 ? "low" : total <= 5 ? "medium" : "high",
      events: fraudEvents,
    };

    teacherData.push({ submission: sub as Submission, correction, fraud });

    try {
      await sendStudentReport({
        submission: sub as Submission,
        correction,
        assignment: asgn as Assignment,
        locale: asgn.language as "pt" | "en",
      });
      await supabase.from("corrections").update({ email_sent: true, email_sent_at: new Date().toISOString() }).eq("id", correction.id);
      results.sent.push(sub.student_email);
    } catch {
      results.failed.push(sub.student_email);
    }
  }

  // Send consolidated report to teacher
  if (teacherData.length > 0) {
    try {
      const teacher = asgn.teacher as { email: string };
      const className = (asgn.class as { name: string }).name;
      await sendTeacherReport({
        teacherEmail: teacher.email,
        assignmentTitle: asgn.title,
        className,
        submissions: teacherData,
        locale: asgn.language as "pt" | "en",
      });
    } catch {}
  }

  return NextResponse.json(results);
}
