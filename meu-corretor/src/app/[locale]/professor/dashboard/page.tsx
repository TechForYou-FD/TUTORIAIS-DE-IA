"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Plus, BookOpen, Users, ClipboardList, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/shared/Navbar";
import Button from "@/components/ui/Button";
import type { Class, Assignment, Teacher } from "@/types";

export default function DashboardPage() {
  const t = useTranslations("teacher");
  const locale = useLocale();
  const router = useRouter();
  const supabase = createClient();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push(`/${locale}/professor/login`); return; }

      const [{ data: t }, { data: cls }, { data: asgn }] = await Promise.all([
        supabase.from("teachers").select("*").eq("id", user.id).single(),
        supabase.from("classes").select("*").eq("teacher_id", user.id).order("created_at", { ascending: false }),
        supabase.from("assignments").select("*, class:classes(name)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      setTeacher(t);
      setClasses(cls || []);
      setAssignments(asgn || []);
      setLoading(false);
    }
    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push(`/${locale}/professor/login`);
  }

  const statusColors: Record<string, string> = {
    draft:  "bg-beige-200 text-secondary",
    active: "bg-brand-green-DEFAULT/10 text-brand-green-DEFAULT",
    closed: "bg-gray-100 dark:bg-dark-card text-muted",
  };

  const statusLabels: Record<string, string> = {
    draft:  t("status_draft"),
    active: t("status_active"),
    closed: t("status_closed"),
  };

  if (loading) return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-brand-yellow-DEFAULT border-t-transparent rounded-full" />
      </div>
    </>
  );

  return (
    <>
      <Navbar teacherName={teacher?.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">{t("dashboard")}</h1>
            <p className="text-secondary mt-1">{t("welcome")}, <strong>{teacher?.name}</strong></p>
          </div>
          <Button variant="ghost" onClick={logout} className="gap-2">
            <LogOut className="w-4 h-4" /> {useTranslations("nav")("logout")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Users, label: t("classes"), value: classes.length, color: "text-brand-yellow-DEFAULT" },
            { icon: ClipboardList, label: t("assignments"), value: assignments.length, color: "text-brand-green-DEFAULT" },
            { icon: BookOpen, label: "Total alunos", value: "—", color: "text-brand-purple-DEFAULT" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-2xl border border-base p-6 shadow-card dark:shadow-card-dark">
              <s.icon className={`w-8 h-8 ${s.color} mb-3`} />
              <p className="text-3xl font-bold font-display text-primary">{s.value}</p>
              <p className="text-sm text-secondary mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Classes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-primary">{t("classes")}</h2>
              <Button size="sm" onClick={() => router.push(`/${locale}/professor/nova-turma`)}>
                <Plus className="w-4 h-4" /> {t("new_class")}
              </Button>
            </div>
            <div className="space-y-3">
              {classes.length === 0 ? (
                <div className="bg-card rounded-2xl border border-base p-8 text-center text-muted">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Sem turmas ainda. Cria a primeira!</p>
                </div>
              ) : classes.map(c => (
                <div key={c.id} className="bg-card rounded-xl border border-base p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">{c.name}</p>
                    <p className="text-sm text-muted">{c.year}</p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => router.push(`/${locale}/professor/nova-tarefa?class=${c.id}`)}
                  >
                    <Plus className="w-3 h-3" /> Tarefa
                  </Button>
                </div>
              ))}
            </div>
          </section>

          {/* Assignments */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold text-primary">{t("assignments")}</h2>
              <Button size="sm" onClick={() => router.push(`/${locale}/professor/nova-tarefa`)}>
                <Plus className="w-4 h-4" /> {t("new_assignment")}
              </Button>
            </div>
            <div className="space-y-3">
              {assignments.length === 0 ? (
                <div className="bg-card rounded-2xl border border-base p-8 text-center text-muted">
                  <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p>Sem tarefas ainda.</p>
                </div>
              ) : assignments.map(a => (
                <button
                  key={a.id}
                  onClick={() => router.push(`/${locale}/professor/tarefas/${a.id}`)}
                  className="w-full bg-card rounded-xl border border-base p-4 flex items-center justify-between hover:border-brand-yellow-DEFAULT transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary truncate">{a.title}</p>
                    <p className="text-sm text-muted">{(a.class as unknown as { name: string })?.name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[a.status]}`}>
                      {statusLabels[a.status]}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
