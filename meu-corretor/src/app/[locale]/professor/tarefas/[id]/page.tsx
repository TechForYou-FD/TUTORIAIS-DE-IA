"use client";
import { useEffect, useState, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Copy, Check, RefreshCw, Send, ArrowLeft, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Assignment, Submission, Correction, FraudReport } from "@/types";

type RowData = { submission: Submission; correction?: Correction; fraud: FraudReport; expanded: boolean };

export default function TarefaDetailPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id } = use(params);
  const t = useTranslations("teacher");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [rows, setRows] = useState<RowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [sendingReports, setSendingReports] = useState(false);

  async function loadData() {
    const { data: asgn } = await supabase
      .from("assignments").select("*, class:classes(*)").eq("id", id).single();
    if (!asgn) { router.push(`/${locale}/professor/dashboard`); return; }
    setAssignment(asgn as Assignment);

    const { data: subs } = await supabase
      .from("submissions").select("*, correction:corrections(*)").eq("assignment_id", id).order("submitted_at");

    const rowData: RowData[] = (subs || []).map(s => {
      const fraudEvents = (s.fraud_events || []) as Submission["fraud_events"];
      const byType: Record<string, number> = {};
      fraudEvents.forEach((ev) => { byType[ev.type] = (byType[ev.type] || 0) + 1; });
      const total = fraudEvents.length;
      const riskLevel = total === 0 ? "low" : total <= 2 ? "low" : total <= 5 ? "medium" : "high";
      return {
        submission: s as Submission,
        correction: (s as Submission & { correction?: Correction }).correction,
        fraud: { total_events: total, by_type: byType, risk_level: riskLevel as FraudReport["risk_level"], events: fraudEvents },
        expanded: false,
      };
    });
    setRows(rowData);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [id]);

  const studentLink = assignment
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/aluno/${assignment.token}`
    : "";

  async function copyLink() {
    await navigator.clipboard.writeText(studentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function correctSubmission(subId: string) {
    setCorrecting(subId);
    try {
      await fetch(`/api/correct/${subId}`, { method: "POST" });
      await loadData();
    } finally {
      setCorrecting(null);
    }
  }

  async function approveGrade(subId: string, corrId: string, grade: number) {
    await supabase.from("corrections").update({ approved_grade: grade }).eq("id", corrId);
    setRows(r => r.map(row => row.submission.id === subId
      ? { ...row, correction: { ...row.correction!, approved_grade: grade } }
      : row));
  }

  async function approveAll() {
    for (const row of rows) {
      if (row.correction && row.correction.approved_grade === undefined) {
        await approveGrade(row.submission.id, row.correction.id, row.correction.proposed_grade);
      }
    }
  }

  async function sendReports() {
    setSendingReports(true);
    try {
      await fetch(`/api/send-report/${id}`, { method: "POST" });
      await loadData();
    } finally {
      setSendingReports(false);
    }
  }

  const toggleExpand = (subId: string) =>
    setRows(r => r.map(row => row.submission.id === subId ? { ...row, expanded: !row.expanded } : row));

  const fraudColors = { low: "text-brand-green-DEFAULT", medium: "text-brand-orange-DEFAULT", high: "text-red-600" };
  const fraudLabels = { low: "Baixo", medium: "Médio", high: "Alto" };

  if (loading || !assignment) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-yellow-DEFAULT border-t-transparent rounded-full" />
      </div>
    </>
  );

  const pendingCorrection = rows.filter(r => r.submission.status === "submitted" && !r.correction).length;
  const corrected = rows.filter(r => r.correction).length;
  const approvedCount = rows.filter(r => r.correction?.approved_grade !== undefined).length;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <button onClick={() => router.push(`/${locale}/professor/dashboard`)} className="flex items-center gap-2 text-sm text-muted hover:text-secondary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>

        {/* Header */}
        <div className="bg-card rounded-2xl border border-base shadow-card dark:shadow-card-dark p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-primary">{assignment.title}</h1>
              <p className="text-secondary text-sm mt-1">
                {(assignment.class as unknown as { name: string })?.name} ·
                {assignment.language === "pt" ? " 🇵🇹 Português" : " 🇬🇧 English"}
              </p>
              <p className="text-xs text-muted mt-1">
                Disponível a partir de: {new Date(assignment.available_from).toLocaleString("pt-PT")}
                {assignment.available_to && ` · Até: ${new Date(assignment.available_to).toLocaleString("pt-PT")}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={copyLink} className="gap-2">
                {copied ? <Check className="w-4 h-4 text-brand-green-DEFAULT" /> : <Copy className="w-4 h-4" />}
                {copied ? t("link_copied") : t("copy_link")}
              </Button>
            </div>
          </div>

          {/* Link */}
          <div className="mt-4 flex gap-2">
            <input
              readOnly value={studentLink}
              className="flex-1 text-xs bg-beige-50 dark:bg-dark-surface border border-base rounded-xl px-3 py-2 text-muted"
            />
            <Button size="sm" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Entregas", value: rows.length },
            { label: "Por corrigir", value: pendingCorrection },
            { label: "Corrigidas", value: corrected },
            { label: "Notas aprovadas", value: approvedCount },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-base p-4 text-center">
              <p className="text-2xl font-bold font-display text-primary">{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
          {approvedCount > 0 && (
            <Button variant="secondary" size="sm" loading={sendingReports} onClick={sendReports}>
              <Send className="w-4 h-4" /> {t("send_reports")} ({approvedCount})
            </Button>
          )}
          {corrected > 0 && approvedCount < corrected && (
            <Button variant="ghost" size="sm" onClick={approveAll}>
              <Check className="w-4 h-4" /> {t("approve_all")}
            </Button>
          )}
        </div>

        {/* Submissions Table */}
        <div className="bg-card rounded-2xl border border-base shadow-card dark:shadow-card-dark overflow-hidden">
          {rows.length === 0 ? (
            <div className="p-12 text-center text-muted">
              <p className="text-lg">Ainda sem entregas.</p>
              <p className="text-sm mt-1">Partilha o link com os teus alunos.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-base">
              {rows.map(row => (
                <div key={row.submission.id}>
                  <div className="p-4 flex items-center gap-4">
                    {/* Student info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-primary truncate">{row.submission.student_name}</p>
                      <p className="text-xs text-muted truncate">{row.submission.student_email}</p>
                    </div>

                    {/* Fraud indicator */}
                    {row.fraud.total_events > 0 && (
                      <div className={`flex items-center gap-1 text-xs font-medium ${fraudColors[row.fraud.risk_level]}`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {fraudLabels[row.fraud.risk_level]} ({row.fraud.total_events})
                      </div>
                    )}

                    {/* Grade */}
                    {row.correction && (
                      <div className="flex items-center gap-2">
                        {row.correction.approved_grade !== undefined ? (
                          <span className="text-sm font-bold text-brand-green-DEFAULT">
                            {row.correction.approved_grade}/{row.correction.max_grade}
                          </span>
                        ) : (
                          <form onSubmit={async e => {
                            e.preventDefault();
                            const input = (e.target as HTMLFormElement).elements.namedItem("grade") as HTMLInputElement;
                            await approveGrade(row.submission.id, row.correction!.id, Number(input.value));
                          }} className="flex gap-1">
                            <Input
                              name="grade"
                              type="number"
                              step="0.1" min={0} max={row.correction.max_grade}
                              defaultValue={row.correction.proposed_grade}
                              className="w-20 text-center text-sm"
                            />
                            <Button type="submit" size="sm" variant="secondary">
                              <Check className="w-3 h-3" />
                            </Button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {row.submission.status === "submitted" && !row.correction && (
                        <Button
                          size="sm"
                          loading={correcting === row.submission.id}
                          onClick={() => correctSubmission(row.submission.id)}
                        >
                          {correcting === row.submission.id ? t("correcting") : t("correct_now")}
                        </Button>
                      )}
                      {row.correction && (
                        <Button variant="ghost" size="sm" onClick={() => toggleExpand(row.submission.id)}>
                          {row.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {t("view_correction")}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded correction detail */}
                  {row.expanded && row.correction && (
                    <div className="bg-beige-50 dark:bg-dark-surface px-4 pb-4 border-t border-base">
                      <div className="pt-4 space-y-4">
                        {/* Summary */}
                        <p className="text-sm text-secondary">{row.correction.summary}</p>

                        {/* Fraud details */}
                        {row.fraud.total_events > 0 && (
                          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Eventos de potencial fraude
                            </p>
                            <ul className="text-sm text-red-600 dark:text-red-300 space-y-1">
                              {Object.entries(row.fraud.by_type).map(([type, count]) => (
                                <li key={type}>• {type}: {count}×</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Criteria scores */}
                        <div>
                          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Critérios</p>
                          <div className="space-y-2">
                            {row.correction.criteria_scores.map(cs => (
                              <div key={cs.criteria_id} className="flex items-center gap-3">
                                <span className="flex-1 text-sm text-secondary truncate">{cs.criteria_name}</span>
                                <span className="text-sm font-medium text-primary">{cs.score}/{cs.max_score}</span>
                                <div className="w-24 h-2 bg-beige-200 dark:bg-dark-border rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-brand-green-DEFAULT rounded-full"
                                    style={{ width: `${Math.round((cs.score / cs.max_score) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Errors */}
                        <div>
                          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">
                            Erros ({row.correction.errors.length})
                          </p>
                          <div className="space-y-2">
                            {row.correction.errors.slice(0, 5).map(err => (
                              <div key={err.id} className="bg-white dark:bg-dark-card rounded-lg p-3 border border-base text-sm">
                                <span className="text-xs font-medium text-brand-orange-DEFAULT uppercase">{err.category}</span>
                                <p className="mt-1"><del className="text-red-500">{err.original}</del> → <span className="text-brand-green-DEFAULT">{err.corrected}</span></p>
                                <p className="text-muted mt-1">{err.explanation}</p>
                              </div>
                            ))}
                            {row.correction.errors.length > 5 && (
                              <p className="text-xs text-muted">+{row.correction.errors.length - 5} erros adicionais no relatório do aluno.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
