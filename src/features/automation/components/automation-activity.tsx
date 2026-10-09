"use client";

import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/dashboard/tone";
import type { Tone } from "@/mocks/dashboard/types";

import type { AutomationActivity, AutomationDefinition } from "../model";

const resultTone: Record<AutomationActivity["result"], Tone> = {
  success: "green",
  needs_review: "orange",
  skipped: "slate",
  failed: "red",
  approved: "blue",
};

function formatWhen(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AutomationActivityFeed({
  activities,
  automations,
}: {
  activities: AutomationActivity[];
  automations: AutomationDefinition[];
}) {
  const t = useTranslations("automation");
  const locale = useLocale();
  const byId = new Map(automations.map((item) => [item.id, item]));

  return (
    <section className="dashboard-card flex min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-[#edf2f8] px-3.5 py-2.5">
        <h2 className="dashboard-card-title">{t("activity.title")}</h2>
        <p className="dashboard-label mt-0.5 text-[11px]">{t("activity.subtitle")}</p>
      </div>
      {activities.length === 0 ? (
        <p className="px-4 py-8 text-center text-[11px] text-[#98a4b5]">{t("activity.empty")}</p>
      ) : (
        <ul className="dashboard-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
          {activities.map((item) => {
            const automation = byId.get(item.automationId);
            return (
              <li
                className="border-b border-[rgb(220_229_239/0.7)] px-3.5 py-2.5 last:border-b-0"
                key={item.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-[#24334c]">
                      {t(item.titleKey)}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-4 text-[#7d8aa0]">
                      {t(item.bodyKey, item.bodyParams)}
                    </p>
                    <p className="mt-1 text-[10px] text-[#98a4b5]">
                      {automation ? t(automation.nameKey) : item.automationId}
                      {" · "}
                      {item.actor}
                      {" · "}
                      <span className="tabular-nums">{formatWhen(item.at, locale)}</span>
                    </p>
                  </div>
                  <StatusBadge size="xs" tone={resultTone[item.result]}>
                    {t(`activity.result.${item.result}`)}
                  </StatusBadge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
