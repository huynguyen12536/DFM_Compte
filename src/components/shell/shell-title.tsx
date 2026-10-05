"use client";

import { useTranslations } from "next-intl";

import { usePathname } from "@/i18n/navigation";

export function ShellTitle() {
  const pathname = usePathname();
  const t = useTranslations();

  if (pathname.startsWith("/devis")) return <>{t("register.title")}</>;
  if (pathname.startsWith("/parametres")) return <>{t("settings.title")}</>;
  if (pathname.startsWith("/activite")) return <>{t("activity.title")}</>;
  return <>{t("header.title")}</>;
}
