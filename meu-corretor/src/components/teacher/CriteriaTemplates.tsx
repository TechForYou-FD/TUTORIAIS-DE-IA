import type { CriteriaItem } from "@/types";

const templates: Record<string, { label: string; criteria: Omit<CriteriaItem, "id">[] }> = {
  narrativo: {
    label: "Texto Narrativo",
    criteria: [
      { name: "Conteúdo e pertinência", description: "Respeito pela situação de comunicação, tema e proposta de texto.", max_points: 4, weight: 0.2 },
      { name: "Estrutura e coesão", description: "Organização em introdução, desenvolvimento e conclusão; coesão textual.", max_points: 4, weight: 0.2 },
      { name: "Morfossintaxe", description: "Correção gramatical, concordâncias, uso de tempos verbais.", max_points: 4, weight: 0.2 },
      { name: "Vocabulário", description: "Variedade e adequação lexical; registo de língua.", max_points: 4, weight: 0.2 },
      { name: "Ortografia e pontuação", description: "Correção ortográfica e uso adequado da pontuação.", max_points: 4, weight: 0.2 },
    ],
  },
  argumentativo: {
    label: "Texto Argumentativo",
    criteria: [
      { name: "Tese e argumentação", description: "Clareza da tese, qualidade dos argumentos e contra-argumentos.", max_points: 6, weight: 0.3 },
      { name: "Estrutura discursiva", description: "Organização lógica do discurso; coesão e coerência.", max_points: 4, weight: 0.2 },
      { name: "Expressão escrita", description: "Correção gramatical, sintaxe e vocabulário.", max_points: 6, weight: 0.3 },
      { name: "Ortografia e pontuação", description: "Correção ortográfica e pontuação.", max_points: 4, weight: 0.2 },
    ],
  },
  descritivo: {
    label: "Texto Descritivo",
    criteria: [
      { name: "Conteúdo e pertinência", description: "Riqueza de detalhes; adequação ao objeto de descrição.", max_points: 5, weight: 0.25 },
      { name: "Estrutura e organização", description: "Organização espacial/lógica da descrição.", max_points: 4, weight: 0.2 },
      { name: "Vocabulário e expressividade", description: "Variedade lexical; uso de figuras de estilo.", max_points: 5, weight: 0.25 },
      { name: "Correção linguística", description: "Gramática, ortografia e pontuação.", max_points: 6, weight: 0.3 },
    ],
  },
  carta: {
    label: "Email / Carta Formal",
    criteria: [
      { name: "Adequação ao destinatário", description: "Registo formal, saudações e fecho adequados.", max_points: 4, weight: 0.2 },
      { name: "Conteúdo e pertinência", description: "Resposta adequada à situação comunicativa.", max_points: 6, weight: 0.3 },
      { name: "Estrutura e coesão", description: "Organização em parágrafos; conectores textuais.", max_points: 4, weight: 0.2 },
      { name: "Correção linguística", description: "Gramática, ortografia e pontuação.", max_points: 6, weight: 0.3 },
    ],
  },
  english_narrative: {
    label: "Narrative Text (English)",
    criteria: [
      { name: "Content & Task Achievement", description: "Addresses the prompt fully with appropriate ideas.", max_points: 5, weight: 0.25 },
      { name: "Organisation & Cohesion", description: "Clear structure; use of discourse markers.", max_points: 4, weight: 0.2 },
      { name: "Grammar & Accuracy", description: "Grammatical correctness; range of structures.", max_points: 6, weight: 0.3 },
      { name: "Vocabulary", description: "Range, accuracy and appropriacy of vocabulary.", max_points: 5, weight: 0.25 },
    ],
  },
};

export function getTemplate(key: string): Omit<CriteriaItem, "id">[] {
  return templates[key]?.criteria || [];
}

export function TemplateSelector({ onSelect }: { onSelect: (criteria: Omit<CriteriaItem, "id">[]) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-secondary mb-2">Modelos de critérios:</p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(templates).map(([key, { label }]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(templates[key].criteria)}
            className="text-xs px-3 py-1.5 rounded-full border border-brand-yellow-DEFAULT/30 text-brand-yellow-dark dark:text-brand-yellow-light hover:bg-brand-yellow-DEFAULT/10 transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
