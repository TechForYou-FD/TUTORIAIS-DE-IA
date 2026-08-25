"use client";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { BookOpen, Mail, Lock, UserPlus, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "", name: "", school: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: form.email, password: form.password,
        });
        if (err) throw err;
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: form.email, password: form.password,
        });
        if (err) throw err;
        if (data.user) {
          await supabase.from("teachers").insert({
            id: data.user.id, email: form.email,
            name: form.name, school: form.school,
          });
        }
      }
      router.push(`/${locale}/professor/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-yellow-DEFAULT/10 mb-4">
            <BookOpen className="w-8 h-8 text-brand-yellow-DEFAULT" />
          </div>
          <h1 className="font-display text-2xl font-bold text-primary">{t("app.name")}</h1>
          <p className="text-secondary text-sm mt-1">{t("nav.teacher")}</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card dark:shadow-card-dark border border-base p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-beige-100 dark:bg-dark-surface p-1 mb-6">
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === m
                    ? "bg-card shadow text-primary"
                    : "text-muted hover:text-secondary"
                }`}
              >
                {m === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {m === "login" ? t("nav.login") : "Registar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <Input
                  label="Nome completo"
                  type="text"
                  required
                  placeholder="Prof. Maria Silva"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                />
                <Input
                  label="Escola (opcional)"
                  type="text"
                  placeholder="Escola Secundária..."
                  value={form.school}
                  onChange={e => set("school", e.target.value)}
                />
              </>
            )}

            <div className="relative">
              <Input
                label="Email"
                type="email"
                required
                placeholder="professor@escola.pt"
                value={form.email}
                onChange={e => set("email", e.target.value)}
              />
              <Mail className="absolute right-3 top-9 w-4 h-4 text-muted" />
            </div>

            <div className="relative">
              <Input
                label="Palavra-passe"
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={e => set("password", e.target.value)}
              />
              <Lock className="absolute right-3 top-9 w-4 h-4 text-muted" />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {mode === "login" ? t("nav.login") : "Criar conta"}
            </Button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-muted">
          <a href={`/${locale}`} className="hover:text-secondary transition-colors">
            ← Voltar ao início
          </a>
        </p>
      </div>
    </div>
  );
}
