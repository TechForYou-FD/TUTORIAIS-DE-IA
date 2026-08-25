"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Users, FolderOpen, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function NovasTurmaPage() {
  const t = useTranslations("teacher");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", year: new Date().getFullYear().toString(), drive_folder_url: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const driveMatch = form.drive_folder_url.match(/folders\/([a-zA-Z0-9_-]+)/);
      const drive_folder_id = driveMatch ? driveMatch[1] : undefined;

      const { error: err } = await supabase.from("classes").insert({
        teacher_id: user.id,
        name: form.name,
        year: form.year,
        drive_folder_id,
        drive_folder_url: form.drive_folder_url || undefined,
      });
      if (err) throw err;
      router.push(`/${locale}/professor/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : useTranslations("errors")("generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-secondary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="bg-card rounded-2xl border border-base shadow-card dark:shadow-card-dark p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-yellow-DEFAULT/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-yellow-DEFAULT" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-primary">{t("new_class")}</h1>
              <p className="text-sm text-muted">Cria uma nova turma para organizar as tarefas</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t("class_name")}
              required
              placeholder="10.º A"
              value={form.name}
              onChange={e => set("name", e.target.value)}
            />
            <Input
              label={t("class_year")}
              required
              placeholder="2025/2026"
              value={form.year}
              onChange={e => set("year", e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-secondary mb-1">
                {t("drive_folder")}
              </label>
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={form.drive_folder_url}
                  onChange={e => set("drive_folder_url", e.target.value)}
                />
                <FolderOpen className="absolute right-3 top-2.5 w-4 h-4 text-muted" />
              </div>
              <p className="text-xs text-muted mt-1.5">
                Cola o link de uma pasta do Google Drive partilhada contigo. Os textos dos alunos serão guardados aí.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                {t("cancel")}
              </Button>
              <Button type="submit" loading={loading}>
                {t("save")}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
