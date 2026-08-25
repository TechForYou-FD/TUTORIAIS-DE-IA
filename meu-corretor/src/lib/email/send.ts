import { Resend } from "resend";
import type { Correction, Submission, Assignment, FraudReport } from "@/types";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "re_placeholder");
}
const FROM = process.env.RESEND_FROM_EMAIL || "noreply@omeuecorretor.pt";

export async function sendStudentReport(params: {
  submission: Submission;
  correction: Correction;
  assignment: Assignment;
  locale: "pt" | "en";
}) {
  const { submission, correction, assignment, locale } = params;
  const isPt = locale === "pt" || assignment.language === "pt";

  const subject = isPt
    ? `O Meu Corretor — Relatório de Correção: ${assignment.title}`
    : `My Corrector — Correction Report: ${assignment.title}`;

  const html = buildStudentEmailHtml(submission, correction, assignment, isPt);

  return getResend().emails.send({
    from: FROM,
    to: submission.student_email,
    subject,
    html,
  });
}

export async function sendTeacherReport(params: {
  teacherEmail: string;
  assignmentTitle: string;
  className: string;
  submissions: Array<{ submission: Submission; correction: Correction; fraud: FraudReport }>;
  locale: "pt" | "en";
}) {
  const { teacherEmail, assignmentTitle, className, submissions, locale } = params;
  const isPt = locale === "pt";

  const subject = isPt
    ? `O Meu Corretor — Relatório Completo: ${assignmentTitle} — ${className}`
    : `My Corrector — Full Report: ${assignmentTitle} — ${className}`;

  const html = buildTeacherEmailHtml(assignmentTitle, className, submissions, isPt);

  return getResend().emails.send({
    from: FROM,
    to: teacherEmail,
    subject,
    html,
  });
}

function buildStudentEmailHtml(
  submission: Submission,
  correction: Correction,
  assignment: Assignment,
  isPt: boolean
): string {
  const errorsByCategory = groupBy(correction.errors, "category");
  const categoryLabels: Record<string, string> = {
    ortografia: "Ortografia", gramatica: "Gramática", pontuacao: "Pontuação",
    vocabulario: "Vocabulário", coesao: "Coesão Textual", coerencia: "Coerência",
    estrutura: "Estrutura do Texto", spelling: "Ortografia (Inglês)",
    grammar: "Gramática (Inglês)", punctuation: "Pontuação (Inglês)",
    vocabulary: "Vocabulário (Inglês)", cohesion: "Coesão (Inglês)",
    coherence: "Coerência (Inglês)", structure: "Estrutura (Inglês)",
  };

  const errorsHtml = Object.entries(errorsByCategory).map(([cat, errs]) => `
    <div style="margin-bottom:24px;">
      <h3 style="color:#6B4FA0;font-size:16px;border-bottom:2px solid #6B4FA0;padding-bottom:4px;">
        ${categoryLabels[cat] || cat} (${errs.length} ocorrência${errs.length !== 1 ? "s" : ""})
      </h3>
      ${errs.map(e => `
        <div style="background:#FBF7EF;border-left:4px solid #E07B39;padding:12px;margin:8px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px;"><strong>❌ Original:</strong> <em>${escapeHtml(e.original)}</em></p>
          <p style="margin:0 0 4px;"><strong>✅ Correto:</strong> <em>${escapeHtml(e.corrected)}</em></p>
          <p style="margin:0 0 4px;"><strong>📝 Explicação:</strong> ${escapeHtml(e.explanation)}</p>
          <p style="margin:0;color:#5C4A2A;"><strong>💡 Sugestão:</strong> ${escapeHtml(e.suggestion)}</p>
        </div>
      `).join("")}
    </div>
  `).join("");

  return `
<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8">
<title>Relatório de Correção</title></head>
<body style="font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#C8860A,#E07B39);padding:32px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:24px;">📝 O Meu Corretor</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">Relatório Individual de Correção</p>
    </div>
    <div style="padding:32px;">
      <p>Olá, <strong>${escapeHtml(submission.student_name)}</strong>!</p>
      <p>Segue o teu relatório de correção para o exercício <strong>${escapeHtml(assignment.title)}</strong>.</p>

      <div style="background:#EDD9B5;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:14px;color:#5C4A2A;">
          <strong>Total de erros identificados:</strong> ${correction.errors.length}<br>
          <strong>Data de entrega:</strong> ${submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString("pt-PT") : "—"}
        </p>
      </div>

      <h2 style="color:#2D6A4F;font-size:18px;">Resumo</h2>
      <p style="line-height:1.7;">${escapeHtml(correction.summary)}</p>

      <h2 style="color:#2D6A4F;font-size:18px;">Erros por Categoria</h2>
      ${correction.errors.length === 0
        ? '<p style="color:#40916C;">✅ Nenhum erro encontrado. Excelente trabalho!</p>'
        : errorsHtml}

      <h2 style="color:#2D6A4F;font-size:18px;">Relatório Detalhado</h2>
      <div style="background:#F5ECD7;border-radius:8px;padding:20px;line-height:1.8;">
        ${correction.student_report.replace(/\n/g, "<br>")}
      </div>

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #E8DCC8;text-align:center;color:#8C7A5A;font-size:12px;">
        <p>Relatório gerado por <strong>O Meu Corretor</strong> — ferramenta de apoio ao ensino</p>
      </div>
    </div>
  </div>
</body></html>`;
}

function buildTeacherEmailHtml(
  title: string,
  className: string,
  submissions: Array<{ submission: Submission; correction: Correction; fraud: FraudReport }>,
  isPt: boolean
): string {
  const rows = submissions.map(({ submission, correction, fraud }) => `
    <tr style="border-bottom:1px solid #E8DCC8;">
      <td style="padding:10px;">${escapeHtml(submission.student_name)}</td>
      <td style="padding:10px;">${escapeHtml(submission.student_email)}</td>
      <td style="padding:10px;text-align:center;">${correction.errors.length}</td>
      <td style="padding:10px;text-align:center;">
        <span style="color:${correction.approved_grade !== undefined ? '#2D6A4F' : '#C8860A'};">
          ${correction.approved_grade !== undefined ? correction.approved_grade : correction.proposed_grade + " (proposta)"}
        </span>
      </td>
      <td style="padding:10px;text-align:center;">
        <span style="color:${fraud.risk_level === 'high' ? '#B00020' : fraud.risk_level === 'medium' ? '#E07B39' : '#2D6A4F'};">
          ${fraud.total_events === 0 ? "Sem ocorrências" : `${fraud.total_events} ocorrência${fraud.total_events !== 1 ? "s" : ""} — ${fraud.risk_level === "high" ? "Alto" : fraud.risk_level === "medium" ? "Médio" : "Baixo"}`}
        </span>
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8">
<title>Relatório do Professor</title></head>
<body style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:20px;background:#f5f5f5;">
  <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#2D6A4F,#40916C);padding:32px;">
      <h1 style="color:white;margin:0;font-size:22px;">📊 O Meu Corretor — Relatório do Professor</h1>
      <p style="color:rgba(255,255,255,0.9);margin:8px 0 0;">${escapeHtml(title)} — ${escapeHtml(className)}</p>
    </div>
    <div style="padding:32px;">
      <p><strong>Total de alunos:</strong> ${submissions.length}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#F5ECD7;">
            <th style="padding:10px;text-align:left;">Aluno</th>
            <th style="padding:10px;text-align:left;">Email</th>
            <th style="padding:10px;text-align:center;">Erros</th>
            <th style="padding:10px;text-align:center;">Nota</th>
            <th style="padding:10px;text-align:center;">Fraude</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      ${submissions.map(({ submission, correction, fraud }) => `
        <div style="margin-top:32px;padding:20px;background:#FBF7EF;border-radius:8px;border-left:4px solid #C8860A;">
          <h3 style="color:#C8860A;margin:0 0 8px;">${escapeHtml(submission.student_name)}</h3>
          ${fraud.total_events > 0 ? `
            <div style="background:#FFF0F0;border:1px solid #FFCCCC;border-radius:6px;padding:12px;margin-bottom:12px;">
              <strong>⚠️ Eventos de potencial fraude:</strong>
              <ul style="margin:8px 0 0;padding-left:20px;">
                ${Object.entries(fraud.by_type).map(([type, count]) =>
                  `<li>${type}: ${count}×</li>`
                ).join("")}
              </ul>
            </div>
          ` : ""}
          <p><strong>Erros encontrados:</strong> ${correction.errors.length}</p>
          <p style="color:#5C4A2A;">${escapeHtml(correction.summary)}</p>
        </div>
      `).join("")}

      <div style="margin-top:32px;text-align:center;color:#8C7A5A;font-size:12px;border-top:1px solid #E8DCC8;padding-top:16px;">
        Gerado por <strong>O Meu Corretor</strong>
      </div>
    </div>
  </div>
</body></html>`;
}

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]);
    acc[k] = [...(acc[k] || []), item];
    return acc;
  }, {} as Record<string, T[]>);
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
