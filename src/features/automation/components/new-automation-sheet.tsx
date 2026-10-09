"use client";

import { ArrowRight, Bell, FileText, Landmark } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SoftSelect } from "@/components/compte/soft-select";
import { IconTile } from "@/components/dashboard/tone";
import { FormSheet } from "@/components/forms/form-sheet";
import { cn } from "@/lib/utils";

import type { AutomationType, ExecutionMode } from "../model";
import { activateAutomationFromTemplate } from "../store";

type Step = "template" | "configure" | "review";

const templates: {
  type: AutomationType;
  icon: typeof Landmark;
  tone: "blue" | "orange" | "purple";
}[] = [
  { type: "bank_reconciliation", icon: Landmark, tone: "blue" },
  { type: "payment_reminders", icon: Bell, tone: "orange" },
  { type: "quote_follow_up", icon: FileText, tone: "purple" },
];

export function NewAutomationSheet({
  open,
  onClose,
  onActivated,
}: {
  open: boolean;
  onClose: () => void;
  onActivated: (id: string) => void;
}) {
  const t = useTranslations("automation");
  const [step, setStep] = useState<Step>("template");
  const [type, setType] = useState<AutomationType | null>(null);
  const [mode, setMode] = useState<ExecutionMode>("suggest_approve");
  const [noResponseDays, setNoResponseDays] = useState(5);
  const [beforeExpirationDays, setBeforeExpirationDays] = useState(3);
  const [error, setError] = useState("");

  function reset() {
    setStep("template");
    setType(null);
    setMode("suggest_approve");
    setNoResponseDays(5);
    setBeforeExpirationDays(3);
    setError("");
  }

  function close() {
    reset();
    onClose();
  }

  const config = useMemo(() => {
    if (type === "bank_reconciliation") {
      return {
        schedule: "daily",
        time: "08:00",
        matchInvoiceNumber: true,
        matchAmount: true,
        matchCustomerName: true,
        highConfidence: "automatic",
        uncertain: "review",
        openBankingConnected: false,
      };
    }
    if (type === "payment_reminders") {
      return {
        beforeDue3: true,
        overdue7: true,
        overdue15: true,
        overdue30: true,
        stopWhenPaid: true,
        mode: mode === "automatic" ? "automatic" : "suggest_approve",
      };
    }
    return {
      noResponseDays,
      beforeExpirationDays,
      mode: mode === "automatic" ? "automatic" : "suggest_approve",
      action: "prepare_follow_up",
    };
  }, [beforeExpirationDays, mode, noResponseDays, type]);

  function activate() {
    if (!type) {
      setError(t("wizard.errors.template"));
      return;
    }
    if (type === "quote_follow_up" && (!noResponseDays || !beforeExpirationDays)) {
      setError(t("wizard.errors.trigger"));
      return;
    }
    const executionMode: ExecutionMode =
      type === "bank_reconciliation" ? "auto_with_review" : mode;
    const id = activateAutomationFromTemplate({
      type,
      executionMode,
      configuration: config,
    });
    reset();
    onActivated(id);
  }

  return (
    <FormSheet
      open={open}
      title={t("wizard.title")}
      description={t("wizard.subtitle")}
      onClose={close}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <ol className="flex gap-1.5 text-[10px] font-semibold text-[#98a4b5]">
          {(["template", "configure", "review"] as const).map((item, index) => (
            <li
              className={cn(
                "rounded-full px-2 py-1",
                step === item && "bg-[#e8efff] text-[#044ce2]",
              )}
              key={item}
            >
              {index + 1}. {t(`wizard.steps.${item}`)}
            </li>
          ))}
        </ol>

        {step === "template" ? (
          <div className="space-y-2">
            {templates.map((item) => {
              const selected = type === item.type;
              return (
                <button
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-[12px] border px-3 py-3 text-left",
                    selected
                      ? "border-[#c9d9ff] bg-[#f3f7ff]"
                      : "border-[#edf2f8] bg-[#fbfcfe]",
                  )}
                  key={item.type}
                  type="button"
                  onClick={() => {
                    setType(item.type);
                    setMode(
                      item.type === "bank_reconciliation"
                        ? "auto_with_review"
                        : "suggest_approve",
                    );
                    setError("");
                  }}
                >
                  <IconTile icon={item.icon} size="sm" tone={item.tone} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12px] font-semibold text-[#24334c]">
                      {t(`wizard.templates.${item.type}.title`)}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-4 text-[#7d8aa0]">
                      {t(`wizard.templates.${item.type}.body`)}
                    </span>
                    <span className="mt-1.5 block text-[10px] text-[#516078]">
                      {t(`wizard.templates.${item.type}.flow`)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {step === "configure" && type ? (
          <div className="space-y-3">
            {type === "bank_reconciliation" ? (
              <p className="rounded-[10px] border border-[#edf2f8] bg-[#fbfcfe] px-3 py-2.5 text-[11px] leading-5 text-[#516078]">
                {t("wizard.bankConfigNote")}
              </p>
            ) : null}
            {type === "payment_reminders" ? (
              <SoftSelect
                label={t("settings.mode")}
                options={[
                  { value: "suggest_approve", label: t("mode.suggestApprove") },
                  { value: "automatic", label: t("mode.automatic") },
                ]}
                value={mode === "automatic" ? "automatic" : "suggest_approve"}
                onChange={(value) => setMode(value as ExecutionMode)}
              />
            ) : null}
            {type === "quote_follow_up" ? (
              <>
                <label className="block text-[11px]">
                  <span className="font-semibold text-[#24334c]">
                    {t("settings.noResponseDays")}
                  </span>
                  <input
                    className="mt-1 h-9 w-full rounded-[9px] border border-[#e1e7f1] px-2.5 tabular-nums outline-none focus:border-[#044ce2]"
                    min={1}
                    type="number"
                    value={noResponseDays}
                    onChange={(event) => setNoResponseDays(Number(event.target.value) || 1)}
                  />
                </label>
                <label className="block text-[11px]">
                  <span className="font-semibold text-[#24334c]">
                    {t("settings.beforeExpirationDays")}
                  </span>
                  <input
                    className="mt-1 h-9 w-full rounded-[9px] border border-[#e1e7f1] px-2.5 tabular-nums outline-none focus:border-[#044ce2]"
                    min={1}
                    type="number"
                    value={beforeExpirationDays}
                    onChange={(event) =>
                      setBeforeExpirationDays(Number(event.target.value) || 1)
                    }
                  />
                </label>
                <SoftSelect
                  label={t("settings.mode")}
                  options={[
                    { value: "suggest_approve", label: t("mode.suggestApprove") },
                    { value: "automatic", label: t("mode.automatic") },
                  ]}
                  value={mode === "automatic" ? "automatic" : "suggest_approve"}
                  onChange={(value) => setMode(value as ExecutionMode)}
                />
              </>
            ) : null}
          </div>
        ) : null}

        {step === "review" && type ? (
          <div className="space-y-2 rounded-[12px] border border-[#edf2f8] bg-[#fbfcfe] px-3 py-3 text-[11px]">
            <p>
              <span className="text-[#98a4b5]">{t("wizard.summary.name")}: </span>
              {t(`wizard.templates.${type}.title`)}
            </p>
            <p>
              <span className="text-[#98a4b5]">{t("wizard.summary.mode")}: </span>
              {t(
                type === "bank_reconciliation"
                  ? "mode.autoWithReview"
                  : mode === "automatic"
                    ? "mode.automatic"
                    : "mode.suggestApprove",
              )}
            </p>
            <p>
              <span className="text-[#98a4b5]">{t("wizard.summary.company")}: </span>
              DFM-Europe
            </p>
          </div>
        ) : null}

        {error ? <p className="text-[11px] font-semibold text-[#c9564f]">{error}</p> : null}

        <div className="mt-auto flex flex-wrap gap-2 border-t border-[#edf2f8] pt-3">
          {step !== "template" ? (
            <button
              className="action-motion soft-button h-9 rounded-[9px] px-3 text-xs font-semibold text-[#405069]"
              type="button"
              onClick={() =>
                setStep(step === "review" ? "configure" : "template")
              }
            >
              {t("wizard.back")}
            </button>
          ) : null}
          {step !== "review" ? (
            <button
              className="action-motion soft-primary ml-auto inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-xs font-semibold text-white"
              type="button"
              onClick={() => {
                if (step === "template" && !type) {
                  setError(t("wizard.errors.template"));
                  return;
                }
                setError("");
                setStep(step === "template" ? "configure" : "review");
              }}
            >
              {t("wizard.continue")}
              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              className="action-motion soft-primary ml-auto h-9 rounded-[9px] px-3 text-xs font-semibold text-white"
              type="button"
              onClick={activate}
            >
              {t("wizard.activate")}
            </button>
          )}
        </div>
      </div>
    </FormSheet>
  );
}
