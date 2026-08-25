import { useTranslations } from "next-intl";
import { getLocale } from "next-intl/server";
import Navbar from "@/components/shared/Navbar";
import { BookOpen, Shield, FileText, Clock, Globe } from "lucide-react";

export default async function LandingPage() {
  const locale = await getLocale();
  return (
    <>
      <Navbar />
      <LandingContent locale={locale} />
    </>
  );
}

function LandingContent({ locale }: { locale: string }) {
  /* eslint-disable react-hooks/rules-of-hooks */
  const t = useTranslations();

  const features = [
    { icon: BookOpen, title: t("landing.feature_1_title"), desc: t("landing.feature_1_desc"), color: "text-brand-yellow-DEFAULT" },
    { icon: Shield,   title: t("landing.feature_2_title"), desc: t("landing.feature_2_desc"), color: "text-brand-orange-DEFAULT" },
    { icon: FileText, title: t("landing.feature_3_title"), desc: t("landing.feature_3_desc"), color: "text-brand-green-DEFAULT" },
    { icon: Clock,    title: t("landing.feature_4_title"), desc: t("landing.feature_4_desc"), color: "text-brand-purple-DEFAULT" },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-yellow-DEFAULT/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-purple-DEFAULT/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-yellow-DEFAULT/10 text-brand-yellow-dark dark:text-brand-yellow-light text-sm font-medium mb-8 border border-brand-yellow-DEFAULT/20">
            <Globe className="w-4 h-4" />
            {t("landing.languages")}
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-bold text-primary leading-tight mb-6">
            {t("app.name")}
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`/${locale}/professor/login`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-brand-yellow-DEFAULT text-white font-semibold text-lg hover:bg-brand-yellow-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <BookOpen className="w-5 h-5" />
              {t("landing.cta_teacher")}
            </a>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-base text-secondary font-semibold text-lg hover:bg-beige-100 dark:hover:bg-dark-card transition-all"
            >
              {t("landing.cta_learn")}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-beige-50 dark:bg-dark-surface">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-primary text-center mb-16">
            {t("landing.features_title")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-card rounded-2xl p-6 shadow-card dark:shadow-card-dark border border-base">
                <f.icon className={`w-10 h-10 ${f.color} mb-4`} />
                <h3 className="font-display font-semibold text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-brand-yellow-DEFAULT to-brand-orange-DEFAULT rounded-3xl p-10 text-white shadow-xl">
            <h2 className="font-display text-3xl font-bold mb-4">{t("app.name")}</h2>
            <p className="text-white/90 mb-8 leading-relaxed">{t("app.tagline")}</p>
            <a
              href={`/${locale}/professor/login`}
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-yellow-dark rounded-xl font-semibold hover:bg-beige-50 transition-colors"
            >
              {t("landing.cta_teacher")}
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-base py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} O Meu Corretor
      </footer>
    </main>
  );
}
