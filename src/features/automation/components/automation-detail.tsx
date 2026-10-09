"use client";

import {
  Bell,
  FileText,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
} from "@/components/compte/animated-selection";
import { ConfirmDialog } from "@/components/compte/confirm-dialog";
import { IconTile, StatusBadge } from "@/components/dashboard/tone";
import { SoftSelect } from "@/components/compte/soft-select";
import { cn } from "@/lib/utils";
import type { Tone } from "@/mocks/dashboard/types";

import { formatDuration } from "../kpis";
import type {
  AutomationDefinition,
  AutomationRun,
  ExecutionMode,
} from "../model";
import {
  automationStatusTone,
  executionModeLabelKey,
  runStatusTone,
} from "../status";
import {
  pauseAutomation,
  resumeAutomation,
  setAutomationExecutionMode,
  updateAutomationConfiguration,
} from "../store";
import { AutomationWorkflow } from "./automation-workflow";

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

type DetailTab = "overview" | "history" | "settings" | "logs";

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

export function AutomationDetail({
  automation,
  runs,
  canManage,
  onViewRun,
}: {
  automation: AutomationDefinition | null;
  runs: AutomationRun[];
  canManage: boolean;
  onViewRun: (runId: string) => void;
}) {
  const t = useTranslations("automation");
  const locale = useLocale();
  const [tab, setTab] = useState<DetailTab>("overview");
  const [confirmMode, setConfirmMode] = useState<ExecutionMode | null>(null);

  const automationRuns = useMemo(
    () =>
      runs
        .filter((run) => automation && run.automationId === automation.id)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [automation, runs],
  );
  const latestRun = automationRuns[0] ?? null;

  if (!automation) {
    return (
      <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-1 px-4 text-center">
        <p className="text-sm font-semibold text-[#24334c]">{t("detail.emptyTitle")}</p>
        <p className="max-w-[32ch] text-[11px] leading-5 text-[#7d8aa0]">
          {t("detail.emptyBody")}
        </p>
      </div>
    );
  }

  const Icon = typeIcon[automation.type];
  const tabs: DetailTab[] = ["overview", "history", "settings", "logs"];
  const active = automation.status === "active";

  function onToggle() {
    if (!canManage) return;
    if (active) pauseAutomation(automation!.id);
    else resumeAutomation(automation!.id);
  }

  function requestModeChange(next: ExecutionMode) {
    if (!canManage || next === automation!.executionMode) return;
    if (next === "automatic" && automation!.executionMode !== "automatic") {
      setConfirmMode(next);
      return;
    }
    setAutomationExecutionMode(automation!.id, next);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-[#edf2f8] px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <IconTile icon={Icon} size="sm" tone={typeTone[automation.type]} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[13px] font-semibold text-[#063586]">
                {t(automation.nameKey)}
              </h3>
              <StatusBadge size="xs" tone={automationStatusTone[automation.status]}>
                {t(`status.${automation.status}`)}
              </StatusBadge>
            </div>
            <p className="mt-0.5 line-clamp-3 text-[11px] leading-4 break-words text-[#7d8aa0]">
              {t(automation.descriptionKey)}
            </p>
            <p className="mt-1 text-[10px] text-[#98a4b5]">
              {t("detail.company", { company: automation.companyName })}
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <span className="sr-only">
              {active ? t("detail.pause") : t("detail.resume")}
            </span>
            <button
              aria-checked={active}
              aria-label={active ? t("detail.pause") : t("detail.resume")}
              className={cn(
                "relative h-5 w-9 rounded-full transition-colors",
                active ? "bg-[#044ce2]" : "bg-[#d7deea]",
                !canManage && "cursor-not-allowed opacity-60",
              )}
              disabled={!canManage}
              role="switch"
              type="button"
              onClick={onToggle}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                  active && "translate-x-4",
                )}
              />
            </button>
          </label>
        </div>

        <AnimatedSelectionGroup className="mt-2 min-w-0" id="automation-detail-tabs">
          <div
            aria-label={t("detail.tabsLabel")}
            className="dashboard-scroll flex min-w-0 gap-0.5 overflow-x-auto py-1"
            role="tablist"
          >
            {tabs.map((item) => {
              const selected = tab === item;
              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    "relative shrink-0 rounded-full px-2.5 py-2 text-[11px] font-semibold whitespace-nowrap transition-colors xl:flex-1 xl:px-2",
                    selected ? "text-[#2458d6]" : "text-[#7d8aa0] hover:text-[#405069]",
                  )}
                  key={item}
                  role="tab"
                  type="button"
                  onClick={() => setTab(item)}
                >
                  {selected ? (
                    <AnimatedActiveIndicator
                      className="rounded-full"
                      layoutId="automation-detail-tab"
                      variant="soft-pill"
                    />
                  ) : null}
                  <span className="relative z-[1]">{t(`detail.tabs.${item}`)}</span>
                </button>
              );
            })}
          </div>
        </AnimatedSelectionGroup>
      </header>

      <div className="dashboard-scroll min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
        {tab === "overview" ? (
          <div className="space-y-3" style={{ animation: "compte-tab-in 160ms ease-out" }}>
            <section className="rounded-[10px] border border-[#edf2f8] px-3 py-3">
              <h4 className="text-[11px] font-semibold text-[#24334c]">{t("detail.workflow")}</h4>
              <div className="mt-2.5">
                <AutomationWorkflow type={automation.type} />
              </div>
            </section>

            <section className="rounded-[10px] border border-[#edf2f8] px-3 py-3">
              <h4 className="text-[11px] font-semibold text-[#24334c]">{t("detail.details")}</h4>
              <dl className="mt-2 space-y-1.5 text-[11px]">
                <Row label={t("detail.trigger")} value={t(automation.triggerLabelKey)} />
                <Row label={t("detail.mode")} value={t(executionModeLabelKey(automation.executionMode))} />
                <Row label={t("detail.lastRun")} value={formatWhen(automation.lastRunAt, locale)} />
                <Row label={t("detail.nextRun")} value={formatWhen(automation.nextRunAt, locale)} />
              </dl>
            </section>

            <section className="rounded-[10px] border border-[#edf2f8] px-3 py-3">
              <h4 className="text-[11px] font-semibold text-[#24334c]">
                {t("detail.lastExecution")}
              </h4>
              {latestRun ? (
                <div className="mt-2 space-y-1.5 text-[11px] text-[#516078]">
                  <p>{t(latestRun.summaryKey, latestRun.summaryParams)}</p>
                  <p className="tabular-nums">
                    {t("detail.processed", {
                      processed: latestRun.processed,
                      succeeded: latestRun.succeeded,
                      skipped: latestRun.skipped,
                      review: latestRun.needsReview,
                      failed: latestRun.failed,
                    })}
                  </p>
                  <StatusBadge size="xs" tone={runStatusTone[latestRun.status]}>
                    {t(`runStatus.${latestRun.status}`)}
                  </StatusBadge>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-[#98a4b5]">{t("detail.noRuns")}</p>
              )}
            </section>
          </div>
        ) : null}

        {tab === "history" ? (
          <div style={{ animation: "compte-tab-in 160ms ease-out" }}>
            {automationRuns.length === 0 ? (
              <p className="py-6 text-center text-[11px] text-[#98a4b5]">{t("detail.noRuns")}</p>
            ) : (
              <ul className="space-y-2">
                {automationRuns.map((run) => (
                  <li
                    className="rounded-[10px] border border-[#edf2f8] px-3 py-2.5"
                    key={run.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#24334c] tabular-nums">
                          {formatWhen(run.startedAt, locale)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#7d8aa0]">{run.trigger}</p>
                        <p className="mt-1 text-[10px] text-[#516078]">
                          {t(run.summaryKey, run.summaryParams)}
                        </p>
                      </div>
                      <StatusBadge size="xs" tone={runStatusTone[run.status]}>
                        {t(`runStatus.${run.status}`)}
                      </StatusBadge>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="text-[10px] tabular-nums text-[#98a4b5]">
                        {formatDuration(run.durationMs)}
                      </p>
                      <button
                        className="action-motion soft-button h-7 rounded-[8px] px-2 text-[10px] font-semibold text-[#405069]"
                        type="button"
                        onClick={() => onViewRun(run.id)}
                      >
                        {t("detail.viewRun")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}

        {tab === "settings" ? (
          <div className="space-y-3" style={{ animation: "compte-tab-in 160ms ease-out" }}>
            <SettingsPanel
              automation={automation}
              canManage={canManage}
              onModeChange={requestModeChange}
            />
          </div>
        ) : null}

        {tab === "logs" ? (
          <div style={{ animation: "compte-tab-in 160ms ease-out" }}>
            {latestRun ? (
              <ul className="space-y-2">
                {latestRun.logLines.map((line) => (
                  <li
                    className="flex gap-2 rounded-[8px] border border-[#edf2f8] px-2.5 py-2 text-[11px]"
                    key={`${line.at}-${line.messageKey}`}
                  >
                    <span className="shrink-0 font-semibold tabular-nums text-[#98a4b5]">
                      {line.at}
                    </span>
                    <span className="text-[#405069]">{t(line.messageKey, line.params)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-[11px] text-[#98a4b5]">{t("detail.noRuns")}</p>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        body={t("confirm.modeBody")}
        cancelLabel={t("confirm.cancel")}
        confirmLabel={t("confirm.confirmMode")}
        open={confirmMode !== null}
        title={t("confirm.modeTitle")}
        onCancel={() => setConfirmMode(null)}
        onConfirm={() => {
          if (confirmMode) setAutomationExecutionMode(automation.id, confirmMode);
          setConfirmMode(null);
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#98a4b5]">{label}</dt>
      <dd className="text-right font-medium text-[#405069]">{value}</dd>
    </div>
  );
}

function SettingsPanel({
  automation,
  canManage,
  onModeChange,
}: {
  automation: AutomationDefinition;
  canManage: boolean;
  onModeChange: (mode: ExecutionMode) => void;
}) {
  const t = useTranslations("automation");
  const config = automation.configuration;

  if (automation.type === "bank_reconciliation") {
    return (
      <section className="space-y-3 rounded-[10px] border border-[#edf2f8] px-3 py-3">
        <p className="text-[10px] text-[#b96d24]">{t("settings.bankDemoNote")}</p>
        <Row label={t("settings.schedule")} value={String(config.schedule ?? "daily")} />
        <Row label={t("settings.time")} value={String(config.time ?? "08:00")} />
        <div className="space-y-1 text-[11px] text-[#516078]">
          <p className="font-semibold text-[#24334c]">{t("settings.matchUsing")}</p>
          <p>✓ {t("settings.invoiceNumber")}</p>
          <p>✓ {t("settings.amount")}</p>
          <p>✓ {t("settings.customerName")}</p>
        </div>
        <div className="space-y-1 text-[11px]">
          <p className="font-semibold text-[#24334c]">{t("settings.execution")}</p>
          <p className="text-[#516078]">{t("settings.highConfidence")}</p>
          <p className="text-[#516078]">{t("settings.uncertain")}</p>
        </div>
      </section>
    );
  }

  if (automation.type === "payment_reminders") {
    const mode = String(config.mode ?? "suggest_approve");
    return (
      <section className="space-y-3 rounded-[10px] border border-[#edf2f8] px-3 py-3">
        <div className="space-y-1.5 text-[11px] text-[#516078]">
          <p className="font-semibold text-[#24334c]">{t("settings.reminderSchedule")}</p>
          {(
            [
              ["beforeDue3", "settings.beforeDue3"],
              ["overdue7", "settings.overdue7"],
              ["overdue15", "settings.overdue15"],
              ["overdue30", "settings.overdue30"],
            ] as const
          ).map(([key, labelKey]) => (
            <label className="flex items-center gap-2" key={key}>
              <input
                checked={Boolean(config[key])}
                className="accent-[#044ce2]"
                disabled={!canManage}
                type="checkbox"
                onChange={(event) =>
                  updateAutomationConfiguration(automation.id, {
                    ...config,
                    [key]: event.target.checked,
                  })
                }
              />
              {t(labelKey)}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-2 text-[11px] text-[#516078]">
          <input
            checked={Boolean(config.stopWhenPaid)}
            className="accent-[#044ce2]"
            disabled={!canManage}
            type="checkbox"
            onChange={(event) =>
              updateAutomationConfiguration(automation.id, {
                ...config,
                stopWhenPaid: event.target.checked,
              })
            }
          />
          {t("settings.stopWhenPaid")}
        </label>
        <SoftSelect
          disabled={!canManage}
          label={t("settings.mode")}
          options={[
            { value: "suggest_approve", label: t("mode.suggestApprove") },
            { value: "automatic", label: t("mode.automatic") },
          ]}
          value={mode}
          onChange={(value) => onModeChange(value as ExecutionMode)}
        />
      </section>
    );
  }

  const mode = String(config.mode ?? "suggest_approve");
  return (
    <section className="space-y-3 rounded-[10px] border border-[#edf2f8] px-3 py-3">
      <label className="block text-[11px]">
        <span className="font-semibold text-[#24334c]">{t("settings.noResponseDays")}</span>
        <input
          className="mt-1 h-9 w-full rounded-[9px] border border-[#e1e7f1] bg-white px-2.5 tabular-nums outline-none focus:border-[#044ce2]"
          disabled={!canManage}
          min={1}
          type="number"
          value={Number(config.noResponseDays ?? 5)}
          onChange={(event) =>
            updateAutomationConfiguration(automation.id, {
              ...config,
              noResponseDays: Number(event.target.value) || 1,
            })
          }
        />
      </label>
      <label className="block text-[11px]">
        <span className="font-semibold text-[#24334c]">{t("settings.beforeExpirationDays")}</span>
        <input
          className="mt-1 h-9 w-full rounded-[9px] border border-[#e1e7f1] bg-white px-2.5 tabular-nums outline-none focus:border-[#044ce2]"
          disabled={!canManage}
          min={1}
          type="number"
          value={Number(config.beforeExpirationDays ?? 3)}
          onChange={(event) =>
            updateAutomationConfiguration(automation.id, {
              ...config,
              beforeExpirationDays: Number(event.target.value) || 1,
            })
          }
        />
      </label>
      <SoftSelect
        disabled={!canManage}
        label={t("settings.mode")}
        options={[
          { value: "suggest_approve", label: t("mode.suggestApprove") },
          { value: "automatic", label: t("mode.automatic") },
        ]}
        value={mode}
        onChange={(value) => onModeChange(value as ExecutionMode)}
      />
    </section>
  );
}
