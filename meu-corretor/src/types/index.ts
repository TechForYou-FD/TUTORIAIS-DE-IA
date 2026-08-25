export type Locale = "pt" | "en";

export interface Teacher {
  id: string;
  email: string;
  name: string;
  school?: string;
  created_at: string;
}

export interface Class {
  id: string;
  teacher_id: string;
  name: string;
  year: string;
  drive_folder_id?: string;
  drive_folder_url?: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  proposal_text: string;
  language: "pt" | "en";
  criteria: CriteriaItem[];
  available_from: string;
  available_to?: string;
  token: string;
  status: "draft" | "active" | "closed";
  created_at: string;
  class?: Class;
}

export interface CriteriaItem {
  id: string;
  name: string;
  description: string;
  max_points: number;
  weight: number;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_name: string;
  student_email: string;
  student_class: string;
  text_content: string;
  submitted_at?: string;
  status: "draft" | "submitted" | "corrected";
  fraud_events: FraudEvent[];
  auto_saved_at?: string;
  assignment?: Assignment;
  correction?: Correction;
}

export interface FraudEvent {
  type: "tab_switch" | "window_blur" | "copy_paste" | "right_click" | "visibility_hidden" | "keyboard_shortcut";
  timestamp: string;
  details?: string;
}

export interface Correction {
  id: string;
  submission_id: string;
  proposed_grade: number;
  approved_grade?: number;
  max_grade: number;
  criteria_scores: CriteriaScore[];
  errors: CorrectionError[];
  summary: string;
  student_report: string;
  teacher_notes?: string;
  corrected_at: string;
  email_sent: boolean;
  email_sent_at?: string;
}

export interface CriteriaScore {
  criteria_id: string;
  criteria_name: string;
  score: number;
  max_score: number;
  feedback: string;
}

export interface CorrectionError {
  id: string;
  category: ErrorCategory;
  original: string;
  corrected: string;
  explanation: string;
  suggestion: string;
  position?: { start: number; end: number };
}

export type ErrorCategory =
  | "ortografia"
  | "gramatica"
  | "pontuacao"
  | "vocabulario"
  | "coesao"
  | "coerencia"
  | "estrutura"
  | "spelling"
  | "grammar"
  | "punctuation"
  | "vocabulary"
  | "cohesion"
  | "coherence"
  | "structure";

export interface FraudReport {
  total_events: number;
  by_type: Record<string, number>;
  risk_level: "low" | "medium" | "high";
  events: FraudEvent[];
}
