"use client";

import {
  Bell,
  FileText,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { IconTile, StatusBadge } from "@/components/dashboard/tone";
import { cn } from "@/lib/utils";
import type { Tone } from "@/mocks/dashboard/types";

import type { AutomationDefinition } from "../model";
import { automationStatusTone, executionModeLabelKey } from "../status";

const typeIcon: Record<AutomationDefinition["type"], LucideIcon> = {
  bank_reconciliation: Landmark,
  payment_reminders: Bell,
  quote_follow_up: FileText,
};

const typeTone: Record<AutomationDefinition["type"], Tone> = {
  bank_reconciliation: "blue",
  payment_reminders: "orange",
  quote_follow_up: "purple",
};

function formatWhen(iso: string | null, locale: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AutomationList({
  items,
  selectedId,
  locale,
  onSelect,
}: {
  items: AutomationDefinition[];
  selectedId: string | null;
  locale: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("automation");

  if (items.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 px-4 py-10 text-center">
        <p className="text-sm font-semibold text-[#24334c]">{t("empty.title")}</p>
        <p className="max-w-[36ch] text-[11px] leading-5 text-[#7d8aa0]">{t("empty.body")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-scroll hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:block">
        <table className="w-full table-fixed border-collapse text-left text-[11px]">
          <colgroup>
            <col style={{ width: "36%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "8%" }} />
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-[#f8fafc]/96 text-[10px] font-semibold tracking-wide text-[#7d8aa0] uppercase backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2">{t("list.columns.name")}</th>
              <th className="px-3 py-2">{t("list.columns.trigger")}</th>
              <th className="px-3 py-2">{t("list.columns.mode")}</th>
              <th className="px-3 py-2">{t("list.columns.lastRun")}</th>
              <th className="px-3 py-2">{t("list.columns.outcome")}</th>
              <th className="px-3 py-2">{t("list.columns.status")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const selected = item.id === selectedId;
              const Icon = typeIcon[item.type];
              const description = t(item.descriptionKey);
              const triggerHelper = t(item.triggerHelperKey);
              const outcome = t(item.lastOutcomeKey, item.lastOutcomeParams);
              return (
                <tr
                  className={cn(
                    "soft-row cursor-pointer border-t border-[rgb(220_229_239/0.7)]",
                    selected && "bg-[#f3f7ff]",
                  )}
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                >
                  <td className="min-w-0 overflow-hidden px-3 py-2.5 align-top">
                    <div className="flex min-w-0 items-start gap-2">
                      <IconTile icon={Icon} size="xs" tone={typeTone[item.type]} />
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="font-semibold break-words text-[#24334c]">
                          {t(item.nameKey)}
                        </p>
                        <p
                          className="mt-0.5 truncate text-[10px] text-[#98a4b5]"
                          title={description}
                        >
                          {description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="min-w-0 overflow-hidden px-3 py-2.5 align-top">
                    <p className="truncate font-medium text-[#405069]" title={t(item.triggerLabelKey)}>
                      {t(item.triggerLabelKey)}
                    </p>
                    <p
                      className="truncate text-[10px] text-[#98a4b5]"
                      title={triggerHelper}
                    >
                      {triggerHelper}
                    </p>
                  </td>
                  <td className="min-w-0 overflow-hidden px-3 py-2.5 align-top text-[#516078]">
                    <p className="truncate" title={t(executionModeLabelKey(item.executionMode))}>
                      {t(executionModeLabelKey(item.executionMode))}
                    </p>
                  </td>
                  <td className="min-w-0 overflow-hidden px-3 py-2.5 align-top tabular-nums text-[#516078]">
                    <p className="truncate">{formatWhen(item.lastRunAt, locale)}</p>
                  </td>
                  <td className="min-w-0 overflow-hidden px-3 py-2.5 align-top">
                    <p className="truncate text-[#516078]" title={outcome}>
                      {outcome}
                    </p>
                  </td>
                  <td className="overflow-hidden px-3 py-2.5 align-top whitespace-nowrap">
                    <StatusBadge size="xs" tone={automationStatusTone[item.status]}>
                      {t(`status.${item.status}`)}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="dashboard-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5 md:hidden">
        {items.map((item) => {
          const selected = item.id === selectedId;
          const Icon = typeIcon[item.type];
          return (
            <li key={item.id}>
              <button
                className={cn(
                  "flex w-full flex-col gap-2 rounded-[10px] border border-[#edf2f8] bg-[#fbfcfe] px-3 py-2.5 text-left",
                  selected && "border-[#c9d9ff] bg-[#f3f7ff]",
                )}
                type="button"
                onClick={() => onSelect(item.id)}
              >
                <div className="flex items-start gap-2">
                  <IconTile icon={Icon} size="xs" tone={typeTone[item.type]} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-semibold text-[#24334c]">
                        {t(item.nameKey)}
                      </p>
                      <StatusBadge size="xs" tone={automationStatusTone[item.status]}>
                        {t(`status.${item.status}`)}
                      </StatusBadge>
                    </div>
                    <p className="mt-0.5 text-[10px] text-[#98a4b5]">
                      {t(`category.${item.category}`)} · {t(item.triggerHelperKey)}
                    </p>
                    <p className="mt-1 text-[10px] text-[#516078]">
                      {t(item.lastOutcomeKey, item.lastOutcomeParams)}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
