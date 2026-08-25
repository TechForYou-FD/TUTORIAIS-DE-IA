"use client";
import { useEffect, useState, useRef, useCallback, use } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AlertTriangle, CheckCircle, Clock, BookOpen, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FraudEvent } from "@/types";

type Phase = "loading" | "not_available" | "closed" | "form" | "writing" | "submitted" | "error";

interface AssignmentInfo {
  id: string;
  title: string;
  description?: string;
  proposal_text: string;
  language: string;
  available_from: string;
  available_to?: string;
  status: string;
  class_name: string;
}

export default function StudentPage({ params }: { params: Promise<{ token: string; locale: string }> }) {
  const { token } = use(params);
  const t = useTranslations("student");
  const locale = useLocale();

  const [phase, setPhase] = useState<Phase>("loading");
  const [assignment, setAssignment] = useState<AssignmentInfo | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", class: "" });
  const [text, setText] = useState("");
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
  const [fraudWarning, setFraudWarning] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fraudRef = useRef<FraudEvent[]>([]);
  const subIdRef = useRef<string | null>(null);
  const textRef = useRef("");
  const autoSaveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Load assignment
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assignments/by-token/${token}`);
        if (!res.ok) { setPhase("error"); return; }
        const data: AssignmentInfo = await res.json();

        const now = new Date();
        const from = new Date(data.available_from);
        const to = data.available_to ? new Date(data.available_to) : null;

        if (data.status === "closed" || (to && now > to)) { setPhase("closed"); setAssignment(data); return; }
        if (now < from) { setPhase("not_available"); setAssignment(data); return; }

        setAssignment(data);
        setPhase("form");
      } catch {
        setPhase("error");
      }
    }
    load();
  }, [token]);

  const addFraudEvent = useCallback((type: FraudEvent["type"], details?: string) => {
    const event: FraudEvent = { type, timestamp: new Date().toISOString(), details };
    fraudRef.current = [...fraudRef.current, event];
    setFraudEvents([...fraudRef.current]);

    const messages: Record<string, string> = {
      tab_switch: t("fraud_tab_switch"),
      window_blur: t("fraud_window_blur"),
      copy_paste: t("fraud_copy_paste"),
      right_click: t("fraud_right_click"),
      visibility_hidden: "Janela oculta detetada",
      keyboard_shortcut: "Atalho de teclado suspeito",
    };

    setFraudWarning({ show: true, message: messages[type] || "Ação suspeita registada" });
    setTimeout(() => setFraudWarning(f => ({ ...f, show: false })), 3000);

    // Persist fraud event to server
    if (subIdRef.current) {
      fetch(`/api/submissions/${subIdRef.current}/fraud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event }),
      }).catch(() => {});
    }
  }, [t]);

  // Anti-fraud listeners
  useEffect(() => {
    if (phase !== "writing") return;

    const onVisibility = () => {
      if (document.hidden) addFraudEvent("visibility_hidden");
    };
    const onBlur = () => addFraudEvent("window_blur");
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addFraudEvent("copy_paste");
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addFraudEvent("right_click");
    };
    const onKeydown = (e: KeyboardEvent) => {
      const blocked = [
        (e.ctrlKey || e.metaKey) && e.key === "v",
        (e.ctrlKey || e.metaKey) && e.key === "c",
        (e.ctrlKey || e.metaKey) && e.key === "x",
        (e.ctrlKey || e.metaKey) && e.key === "a" && e.shiftKey,
        e.key === "F12",
        (e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I",
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        if ((e.ctrlKey || e.metaKey) && e.key === "v") addFraudEvent("copy_paste");
        else addFraudEvent("keyboard_shortcut", `${e.key}`);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeydown, true);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeydown, true);
    };
  }, [phase, addFraudEvent]);

  // Auto-save
  useEffect(() => {
    if (phase !== "writing") return;
    autoSaveInterval.current = setInterval(async () => {
      if (!subIdRef.current || !textRef.current) return;
      try {
        await fetch(`/api/submissions/${subIdRef.current}/autosave`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text_content: textRef.current }),
        });
        setLastSaved(new Date());
      } catch {}
    }, 30000);
    return () => { if (autoSaveInterval.current) clearInterval(autoSaveInterval.current); };
  }, [phase]);

  useEffect(() => { textRef.current = text; }, [text]);
  useEffect(() => { subIdRef.current = submissionId; }, [submissionId]);

  async function startWriting(e: React.FormEvent) {
    e.preventDefault();
    if (!assignment) return;
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: assignment.id,
          student_name: form.name,
          student_email: form.email,
          student_class: form.class,
        }),
      });
      const data = await res.json();
      setSubmissionId(data.id);
      setPhase("writing");
    } catch {
      alert("Erro ao iniciar. Tenta novamente.");
    }
  }

  async function submitText() {
    if (!submissionId) return;
    setSubmitting(true);
    try {
      await fetch(`/api/submissions/${submissionId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text_content: text }),
      });
      setPhase("submitted");
    } catch {
      alert("Erro ao entregar. Tenta novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  // ---- Render phases ----

  if (phase === "loading") return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-2 border-brand-yellow-DEFAULT border-t-transparent rounded-full" />
    </div>
  );

  if (phase === "not_available") return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-base shadow-card p-10 text-center max-w-md">
        <Clock className="w-16 h-16 text-brand-orange-DEFAULT mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-primary mb-2">{t("not_available_yet")}</h1>
        <p className="text-secondary">{t("available_from")}: <strong>{new Date(assignment!.available_from).toLocaleString("pt-PT")}</strong></p>
      </div>
    </div>
  );

  if (phase === "closed") return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-base shadow-card p-10 text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-muted mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-primary mb-2">{t("closed")}</h1>
      </div>
    </div>
  );

  if (phase === "submitted") return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-base shadow-card p-10 text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-brand-green-DEFAULT mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-primary mb-2">{t("submitted_title")}</h1>
        <p className="text-secondary">{t("submitted_body")}</p>
      </div>
    </div>
  );

  if (phase === "form") return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 text-brand-yellow-DEFAULT mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold text-primary">{assignment?.title}</h1>
          <p className="text-sm text-muted mt-1">{assignment?.class_name}</p>
        </div>

        <div className="bg-card rounded-2xl border border-base shadow-card p-8">
          {assignment?.proposal_text && (
            <div className="bg-beige-50 dark:bg-dark-surface rounded-xl p-4 mb-6 border border-base">
              <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">Proposta</p>
              <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{assignment.proposal_text}</p>
            </div>
          )}

          <form onSubmit={startWriting} className="space-y-4">
            <Input label={t("form_name")} required placeholder="Maria Silva" value={form.name} onChange={e => set("name", e.target.value)} />
            <Input label={t("form_email")} type="email" required placeholder="aluno@escola.pt" value={form.email} onChange={e => set("email", e.target.value)} />
            <Input label={t("form_class")} required placeholder="10.º A" value={form.class} onChange={e => set("class", e.target.value)} />
            <Button type="submit" size="lg" className="w-full mt-2">{t("form_start")}</Button>
          </form>
        </div>
      </div>
    </div>
  );

  // Writing phase
  return (
    <div className="min-h-screen flex flex-col select-none" onCopy={e => e.preventDefault()}>
      {/* Fraud warning toast */}
      {fraudWarning.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <AlertTriangle className="w-5 h-5" />
          <div>
            <p className="font-bold text-sm">{t("fraud_warning_title")}</p>
            <p className="text-xs opacity-90">{fraudWarning.message}</p>
          </div>
        </div>
      )}

      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-base px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-yellow-DEFAULT" />
          <div>
            <p className="font-display font-semibold text-primary text-sm truncate max-w-xs">{assignment?.title}</p>
            <p className="text-xs text-muted">{form.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-muted">
              <Save className="w-3 h-3" /> {t("auto_saved")} {lastSaved.toLocaleTimeString("pt-PT")}
            </span>
          )}
          {fraudEvents.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
              <AlertTriangle className="w-3 h-3" /> {fraudEvents.length} reg.
            </span>
          )}
          <Button size="sm" onClick={() => setShowConfirm(true)} disabled={text.trim().length < 20}>
            {t("submit")}
          </Button>
        </div>
      </header>

      {/* Proposal banner */}
      {assignment?.proposal_text && (
        <div className="bg-brand-yellow-DEFAULT/5 border-b border-brand-yellow-DEFAULT/20 px-4 py-3">
          <p className="text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow-light mb-1">Proposta:</p>
          <p className="text-sm text-secondary leading-relaxed">{assignment.proposal_text}</p>
        </div>
      )}

      {/* Writing area */}
      <div className="flex-1 p-4 sm:p-8">
        <textarea
          className="w-full h-full min-h-[calc(100vh-280px)] bg-white dark:bg-dark-card border border-base rounded-2xl p-6 text-primary text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-yellow-DEFAULT resize-none shadow-card dark:shadow-card-dark font-sans"
          placeholder={t("writing_area")}
          value={text}
          onChange={e => setText(e.target.value)}
          spellCheck
          autoFocus
        />
      </div>

      {/* Footer stats */}
      <footer className="border-t border-base bg-card px-4 py-2 flex items-center justify-between text-xs text-muted">
        <span>{wordCount} {t("words")} · {charCount} {t("chars")}</span>
        {lastSaved && <span className="flex items-center gap-1"><Save className="w-3 h-3" /> {lastSaved.toLocaleTimeString("pt-PT")}</span>}
      </footer>

      {/* Confirm submit dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card rounded-2xl border border-base shadow-xl p-8 max-w-sm w-full text-center">
            <CheckCircle className="w-12 h-12 text-brand-green-DEFAULT mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-primary mb-2">Entregar texto?</h2>
            <p className="text-sm text-secondary mb-6">{t("confirm_submit")}</p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowConfirm(false)}>Cancelar</Button>
              <Button variant="secondary" className="flex-1" loading={submitting} onClick={submitText}>
                {t("submit")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
