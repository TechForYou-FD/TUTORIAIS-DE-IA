import Anthropic from "@anthropic-ai/sdk";
import type { CriteriaItem, CorrectionError, CriteriaScore } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CorrectionInput {
  studentText: string;
  proposalText: string;
  criteria: CriteriaItem[];
  language: "pt" | "en";
}

interface CorrectionOutput {
  proposed_grade: number;
  max_grade: number;
  criteria_scores: CriteriaScore[];
  errors: CorrectionError[];
  summary: string;
  student_report: string;
}

const SYSTEM_PT = `És um professor especialista em língua portuguesa (Português Europeu de Portugal),
com formação em didática da escrita e avaliação de textos escolares de acordo com os programas
e metas do Ministério da Educação português. Segues rigorosamente as normas do Acordo Ortográfico
de 1990 e as convenções do português europeu. Comunicas SEMPRE em português europeu de Portugal.
Identifica e explica cada erro com clareza pedagógica, contextualizando-o no texto original.`;

const SYSTEM_EN = `You are an expert English language teacher with specialisation in written English
correction for academic contexts. You follow British English conventions.
Identify and explain each error with clear pedagogical reasoning, contextualising it within the original text.
All explanations are written in European Portuguese (Portugal).`;

export async function correctSubmission(input: CorrectionInput): Promise<CorrectionOutput> {
  const { studentText, proposalText, criteria, language } = input;

  const maxGrade = criteria.reduce((sum, c) => sum + c.max_points, 0) || 20;

  const criteriaDesc = criteria.map(c =>
    `- ${c.name} (${c.max_points} pontos): ${c.description}`
  ).join("\n");

  const prompt = language === "pt" ? buildPromptPT(studentText, proposalText, criteriaDesc, maxGrade)
                                   : buildPromptEN(studentText, proposalText, criteriaDesc, maxGrade);

  const message = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 8192,
    system: language === "pt" ? SYSTEM_PT : SYSTEM_EN,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  return parseResponse(content.text, maxGrade, criteria);
}

function buildPromptPT(text: string, proposal: string, criteria: string, maxGrade: number): string {
  return `Analisa e corrige o seguinte texto de aluno, de acordo com os critérios fornecidos.

PROPOSTA DE TRABALHO:
${proposal}

TEXTO DO ALUNO:
${text}

CRITÉRIOS DE AVALIAÇÃO (total: ${maxGrade} pontos):
${criteria}

Devolve a resposta EXCLUSIVAMENTE em JSON válido com a seguinte estrutura:
{
  "proposed_grade": número (0 a ${maxGrade}, com até 1 casa decimal),
  "criteria_scores": [
    {
      "criteria_id": "id do critério",
      "criteria_name": "nome do critério",
      "score": número,
      "max_score": número,
      "feedback": "justificação pedagógica em português europeu"
    }
  ],
  "errors": [
    {
      "id": "err_1",
      "category": "ortografia|gramatica|pontuacao|vocabulario|coesao|coerencia|estrutura",
      "original": "excerto original com erro",
      "corrected": "versão corrigida",
      "explanation": "explicação clara e pedagógica do erro em português europeu",
      "suggestion": "sugestão de melhoria"
    }
  ],
  "summary": "resumo geral da avaliação (3-5 frases) em português europeu",
  "student_report": "relatório detalhado para o aluno em português europeu, com todos os erros explicados por categoria, sugestões de melhoria e encorajamento construtivo. Não inclui a nota."
}`;
}

function buildPromptEN(text: string, proposal: string, criteria: string, maxGrade: number): string {
  return `Analyse and correct the following student text according to the provided criteria.
All explanations must be written in European Portuguese (Portugal).

ASSIGNMENT BRIEF:
${proposal}

STUDENT TEXT:
${text}

ASSESSMENT CRITERIA (total: ${maxGrade} points):
${criteria}

Return ONLY valid JSON with this structure:
{
  "proposed_grade": number (0 to ${maxGrade}, up to 1 decimal place),
  "criteria_scores": [
    {
      "criteria_id": "criteria id",
      "criteria_name": "criteria name",
      "score": number,
      "max_score": number,
      "feedback": "pedagogical justification in European Portuguese"
    }
  ],
  "errors": [
    {
      "id": "err_1",
      "category": "spelling|grammar|punctuation|vocabulary|cohesion|coherence|structure",
      "original": "original excerpt with error",
      "corrected": "corrected version",
      "explanation": "clear pedagogical explanation in European Portuguese",
      "suggestion": "improvement suggestion in European Portuguese"
    }
  ],
  "summary": "general assessment summary (3-5 sentences) in European Portuguese",
  "student_report": "detailed report for the student in European Portuguese, with all errors explained by category, improvement suggestions and constructive encouragement. Does NOT include the grade."
}`;
}

function parseResponse(text: string, maxGrade: number, criteria: CriteriaItem[]): CorrectionOutput {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  const parsed = JSON.parse(jsonMatch[0]);

  const criteriaScores: CriteriaScore[] = (parsed.criteria_scores || []).map((s: CriteriaScore & { criteria_id?: string }) => ({
    criteria_id: s.criteria_id || criteria[0]?.id || "unknown",
    criteria_name: s.criteria_name || "Critério",
    score: Number(s.score) || 0,
    max_score: Number(s.max_score) || 0,
    feedback: s.feedback || "",
  }));

  const errors: CorrectionError[] = (parsed.errors || []).map((e: CorrectionError, i: number) => ({
    id: e.id || `err_${i + 1}`,
    category: e.category || "gramatica",
    original: e.original || "",
    corrected: e.corrected || "",
    explanation: e.explanation || "",
    suggestion: e.suggestion || "",
  }));

  return {
    proposed_grade: Math.min(Number(parsed.proposed_grade) || 0, maxGrade),
    max_grade: maxGrade,
    criteria_scores: criteriaScores,
    errors,
    summary: parsed.summary || "",
    student_report: parsed.student_report || "",
  };
}
