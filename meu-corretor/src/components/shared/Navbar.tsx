"use client";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Moon, Sun, Globe, BookOpen } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export default function Navbar({ teacherName }: { teacherName?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const switchLocale = () => {
    const next = locale === "pt" ? "en" : "pt";
    const withoutLocale = pathname.replace(/^\/(pt|en)/, "");
    router.push(`/${next}${withoutLocale}`);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-base bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href={`/${locale}`} className="flex items-center gap-2 font-display font-bold text-lg">
          <BookOpen className="w-6 h-6 text-brand-yellow-DEFAULT" />
          <span className="text-primary">{t("app.name")}</span>
        </a>

        <div className="flex items-center gap-3">
          {teacherName && (
            <span className="hidden sm:block text-sm text-secondary">
              {teacherName}
            </span>
          )}

          <button
            onClick={switchLocale}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-secondary hover:bg-beige-100 dark:hover:bg-dark-card transition-colors"
            title="Switch language"
          >
            <Globe className="w-4 h-4" />
            <span>{locale === "pt" ? "EN" : "PT"}</span>
          </button>

          <button
            onClick={toggle}
            className="p-2 rounded-lg text-secondary hover:bg-beige-100 dark:hover:bg-dark-card transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {teacherName ? (
            <a
              href={`/${locale}/professor/login`}
              className="text-sm px-4 py-2 rounded-xl bg-brand-purple-DEFAULT text-white hover:bg-brand-purple-dark transition-colors"
            >
              {t("nav.logout")}
            </a>
          ) : (
            <a
              href={`/${locale}/professor/login`}
              className="text-sm px-4 py-2 rounded-xl bg-brand-yellow-DEFAULT text-white hover:bg-brand-yellow-dark transition-colors"
            >
              {t("nav.login")}
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
