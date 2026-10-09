"use client";

import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/dashboard/tone";

import { formatDuration } from "../kpis";
import type { AutomationDefinition, AutomationRun } from "../model";
import { runStatusTone } from "../status";

function formatWhen(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function AutomationRecentRuns({
  runs,
  automations,
  onView,
}: {
  runs: AutomationRun[];
  automations: AutomationDefinition[];
  onView: (runId: string) => void;
}) {
  const t = useTranslations("automation");
  const locale = useLocale();
  const byId = new Map(automations.map((item) => [item.id, item]));
  const sorted = [...runs].sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, 8);

  return (
    <section className="dashboard-card dashboard-list flex min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-2 border-b border-[#edf2f8] px-3.5 py-2.5">
        <div className="min-w-0">
          <h2 className="dashboard-card-title">{t("runs.title")}</h2>
          <p className="dashboard-label mt-0.5 text-[11px]">{t("runs.subtitle")}</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="px-4 py-8 text-center text-[11px] text-[#98a4b5]">{t("runs.empty")}</p>
      ) : (
        <>
          <div className="dashboard-scroll hidden min-h-[220px] max-h-[min(42vh,360px)] overflow-auto md:block">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead className="sticky top-0 z-[1] bg-[#f8fafc]/96 text-[10px] font-semibold tracking-wide text-[#7d8aa0] uppercase backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2 whitespace-nowrap">{t("runs.columns.when")}</th>
                  <th className="px-3 py-2">{t("runs.columns.automation")}</th>
                  <th className="px-3 py-2">{t("runs.columns.trigger")}</th>
                  <th className="px-3 py-2">{t("runs.columns.result")}</th>
                  <th className="px-3 py-2 whitespace-nowrap">{t("runs.columns.processed")}</th>
                  <th className="px-3 py-2 whitespace-nowrap">{t("runs.columns.duration")}</th>
                  <th className="px-3 py-2 whitespace-nowrap">{t("runs.columns.status")}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((run) => {
                  const automation = byId.get(run.automationId);
                  const result = t(run.summaryKey, run.summaryParams);
                  return (
                    <tr
                      className="soft-row border-t border-[rgb(220_229_239/0.7)]"
                      key={run.id}
                    >
                      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap text-[#516078]">
                        {formatWhen(run.startedAt, locale)}
                      </td>
                      <td className="min-w-0 px-3 py-2.5 font-semibold text-[#24334c]">
                        {automation ? t(automation.nameKey) : run.automationId}
                      </td>
                      <td className="min-w-0 px-3 py-2.5 text-[#516078]">{run.trigger}</td>
                      <td className="min-w-0 max-w-[220px] px-3 py-2.5">
                        <p className="truncate text-[#516078]" title={result}>
                          {result}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums text-[#516078]">{run.processed}</td>
                      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap text-[#516078]">
                        {formatDuration(run.durationMs)}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <StatusBadge size="xs" tone={runStatusTone[run.status]}>
                          {t(`runStatus.${run.status}`)}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          className="action-motion soft-button h-7 rounded-[8px] px-2 text-[10px] font-semibold text-[#405069]"
                          type="button"
                          onClick={() => onView(run.id)}
                        >
                          {t("runs.view")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="flex flex-col gap-2 p-2.5 md:hidden">
            {sorted.map((run) => {
              const automation = byId.get(run.automationId);
              return (
                <li
                  className="rounded-[10px] border border-[#edf2f8] bg-[#fbfcfe] px-3 py-2.5"
                  key={run.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[#24334c]">
                        {automation ? t(automation.nameKey) : run.automationId}
                      </p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-[#98a4b5]">
                        {formatWhen(run.startedAt, locale)}
                      </p>
                    </div>
                    <StatusBadge size="xs" tone={runStatusTone[run.status]}>
                      {t(`runStatus.${run.status}`)}
                    </StatusBadge>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#516078]">
                    {t(run.summaryKey, run.summaryParams)}
                  </p>
                  <button
                    className="action-motion soft-button mt-2 h-8 w-full rounded-[8px] text-[10px] font-semibold text-[#405069]"
                    type="button"
                    onClick={() => onView(run.id)}
                  >
                    {t("runs.view")}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
