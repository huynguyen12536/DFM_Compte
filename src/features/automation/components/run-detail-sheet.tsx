"use client";

import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/dashboard/tone";
import { FormSheet } from "@/components/forms/form-sheet";

import { formatDuration } from "../kpis";
import type { AutomationDefinition, AutomationRun } from "../model";
import { runStatusTone } from "../status";

function formatWhen(iso: string | null, locale: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function RunDetailSheet({
  open,
  run,
  automation,
  onClose,
}: {
  open: boolean;
  run: AutomationRun | null;
  automation: AutomationDefinition | null;
  onClose: () => void;
}) {
  const t = useTranslations("automation");
  const locale = useLocale();

  return (
    <FormSheet
      description={automation ? t(automation.nameKey) : undefined}
      open={open}
      title={t("runDetail.title")}
      onClose={onClose}
    >
      {!run ? (
        <p className="text-[11px] text-[#98a4b5]">{t("runs.empty")}</p>
      ) : (
        <div className="space-y-3 text-[11px]">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-[#24334c]">
              {automation ? t(automation.nameKey) : run.automationId}
            </p>
            <StatusBadge size="xs" tone={runStatusTone[run.status]}>
              {t(`runStatus.${run.status}`)}
            </StatusBadge>
          </div>
          <dl className="space-y-1.5 rounded-[10px] border border-[#edf2f8] px-3 py-2.5 text-[#516078]">
            <Row label={t("runDetail.trigger")} value={run.trigger} />
            <Row label={t("runDetail.started")} value={formatWhen(run.startedAt, locale)} />
            <Row label={t("runDetail.finished")} value={formatWhen(run.finishedAt, locale)} />
            <Row label={t("runDetail.duration")} value={formatDuration(run.durationMs)} />
            <Row label={t("runDetail.processed")} value={String(run.processed)} />
            <Row label={t("runDetail.succeeded")} value={String(run.succeeded)} />
            <Row label={t("runDetail.skipped")} value={String(run.skipped)} />
            <Row label={t("runDetail.needsReview")} value={String(run.needsReview)} />
            <Row label={t("runDetail.failed")} value={String(run.failed)} />
          </dl>
          {run.errorSummaryKey ? (
            <p className="rounded-[10px] border border-[#f3d6d2] bg-[#fff7f5] px-3 py-2 text-[#c9564f]">
              {t(run.errorSummaryKey)}
            </p>
          ) : null}
          <div>
            <p className="mb-1.5 font-semibold text-[#24334c]">{t("runDetail.logs")}</p>
            <ul className="space-y-1.5">
              {run.logLines.map((line) => (
                <li
                  className="flex gap-2 rounded-[8px] border border-[#edf2f8] px-2.5 py-2"
                  key={`${line.at}-${line.messageKey}`}
                >
                  <span className="shrink-0 tabular-nums text-[#98a4b5]">{line.at}</span>
                  <span className="text-[#405069]">{t(line.messageKey, line.params)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </FormSheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-right font-medium tabular-nums text-[#24334c]">{value}</dd>
    </div>
  );
}
