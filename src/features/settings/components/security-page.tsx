"use client";

import { useTranslations } from "next-intl";

import { mockSecuritySettings } from "../mocks/security";
import { SecuritySettingsCard } from "./security-settings-card";
import { SensitiveActionsCard } from "./sensitive-actions-card";
import { SettingsShell } from "./settings-shell";

export function SecurityPage() {
  const t = useTranslations("settingsSecurity");

  return (
    <SettingsShell description={t("page.description")} title={t("page.title")}>
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <SecuritySettingsCard initial={mockSecuritySettings} />
        <SensitiveActionsCard />
      </div>
    </SettingsShell>
  );
}
