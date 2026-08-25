"use client";
import { useEffect, useState, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Plus, Trash2, ArrowLeft, Link } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Button from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { TemplateSelector } from "@/components/teacher/CriteriaTemplates";
import type { Class, CriteriaItem } from "@/types";

function NovaTarefaForm() {
  const t = useTranslations("teacher");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    class_id: searchParams.get("class") || "",
    title: "",
    description: "",
    proposal_text: "",
    language: "pt" as "pt" | "en",
    available_from: "",
    available_to: "",
  });
  const [criteria, setCriteria] = useState<CriteriaItem[]>([]);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push(`/${locale}/professor/login`); return; }
      const { data } = await supabase.from("classes").select("*").eq("teacher_id", user.id);
      setClasses(data || []);
    }
    load();
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const addCriterion = () => setCriteria(c => [...c, {
    id: `crit_${Date.now()}`, name: "", description: "", max_points: 4, weight: 0.2,
  }]);

  const updateCriterion = (id: string, field: keyof CriteriaItem, value: string | number) =>
    setCriteria(c => c.map(x => x.id === id ? { ...x, [field]: value } : x));

  const removeCriterion = (id: string) => setCriteria(c => c.filter(x => x.id !== id));

  const applyTemplate = (tpl: Omit<CriteriaItem, "id">[]) => {
    setCriteria(tpl.map((x, i) => ({ ...x, id: `crit_${Date.now()}_${i}` })));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.class_id) { setError("Seleciona uma turma"); return; }
    if (criteria.length === 0) { setError("Adiciona pelo menos um critério"); return; }
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error: err } = await supabase.from("assignments").insert({
        teacher_id: user.id,
        class_id: form.class_id,
        title: form.title,
        description: form.description || null,
        proposal_text: form.proposal_text,
        language: form.language,
        criteria,
        available_from: new Date(form.available_from).toISOString(),
        available_to: form.available_to ? new Date(form.available_to).toISOString() : null,
        status: "active",
      }).select().single();
      if (err) throw err;
      router.push(`/${locale}/professor/tarefas/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar tarefa");
    } finally {
      setLoading(false);
    }
  }

  const totalPoints = criteria.reduce((s, c) => s + Number(c.max_points), 0);

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted hover:text-secondary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-card rounded-2xl border border-base shadow-card dark:shadow-card-dark p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-green-DEFAULT/10 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-brand-green-DEFAULT" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-primary">{t("new_assignment")}</h1>
              <p className="text-sm text-muted">Cria uma nova tarefa de escrita para os teus alunos</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Turma */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">{t("classes")} *</label>
              <select
                required
                value={form.class_id}
                onChange={e => set("class_id", e.target.value)}
                className="w-full rounded-xl border border-base bg-surface text-primary px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow-DEFAULT"
              >
                <option value="">— Selecionar turma —</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.year})</option>)}
              </select>
            </div>

            {/* Lingua */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">{t("language")} *</label>
              <div className="flex gap-3">
                {(["pt", "en"] as const).map(lang => (
                  <label key={lang} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.language === lang ? "border-brand-yellow-DEFAULT bg-brand-yellow-DEFAULT/5" : "border-base hover:border-brand-yellow-DEFAULT/40"}`}>
                    <input type="radio" name="language" value={lang} checked={form.language === lang} onChange={() => set("language", lang)} className="sr-only" />
                    <span className="font-medium text-primary">{lang === "pt" ? "🇵🇹 Português" : "🇬🇧 English"}</span>
                  </label>
                ))}
              </div>
            </div>

            <Input label={`${t("assignment_title")} *`} required placeholder="Texto de opinião sobre..." value={form.title} onChange={e => set("title", e.target.value)} />
            <Textarea label={t("assignment_desc")} placeholder="Instruções adicionais..." rows={2} value={form.description} onChange={e => set("description", e.target.value)} />

            {/* Proposta */}
            <Textarea
              label={`${t("proposal_text")} *`}
              required
              placeholder="Escreve aqui a proposta de texto que os alunos irão receber..."
              rows={6}
              value={form.proposal_text}
              onChange={e => set("proposal_text", e.target.value)}
            />

            {/* Horário */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={`${t("available_from")} *`}
                type="datetime-local"
                required
                value={form.available_from}
                onChange={e => set("available_from", e.target.value)}
              />
              <Input
                label={t("available_to")}
                type="datetime-local"
                value={form.available_to}
                onChange={e => set("available_to", e.target.value)}
              />
            </div>

            {/* Critérios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-medium text-secondary">{t("criteria")} *</label>
                  {totalPoints > 0 && (
                    <span className="text-xs text-muted">Total: {totalPoints} pontos</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <TemplateSelector onSelect={applyTemplate} />
                </div>
              </div>

              <div className="space-y-3 mb-3">
                {criteria.map((c, i) => (
                  <div key={c.id} className="bg-beige-50 dark:bg-dark-surface rounded-xl p-4 border border-base">
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-muted mt-3 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Input
                          placeholder={t("criteria_name")}
                          required
                          value={c.name}
                          onChange={e => updateCriterion(c.id, "name", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder={t("criteria_points")}
                          min={1} max={20}
                          required
                          value={c.max_points}
                          onChange={e => updateCriterion(c.id, "max_points", Number(e.target.value))}
                        />
                        <div className="col-span-2">
                          <Input
                            placeholder={t("criteria_desc")}
                            value={c.description}
                            onChange={e => updateCriterion(c.id, "description", e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="button" onClick={() => removeCriterion(c.id)} className="text-muted hover:text-red-500 transition-colors mt-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Button type="button" variant="ghost" size="sm" onClick={addCriterion}>
                <Plus className="w-4 h-4" /> {t("criteria_add")}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>{t("cancel")}</Button>
              <Button type="submit" loading={loading} className="gap-2">
                <Link className="w-4 h-4" /> Criar e Gerar Link
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default function NovaTarefaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-brand-yellow-DEFAULT border-t-transparent rounded-full" /></div>}>
      <NovaTarefaForm />
    </Suspense>
  );
}
