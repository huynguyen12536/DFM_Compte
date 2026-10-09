"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { AUTOMATION_WORKFLOWS, type AutomationType } from "../model";

export function AutomationWorkflow({ type }: { type: AutomationType }) {
  const t = useTranslations("automation");
  const steps = AUTOMATION_WORKFLOWS[type];

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li className="relative flex gap-3" key={step.id}>
          <div className="flex w-5 shrink-0 flex-col items-center">
            <span
              className={cn(
                "mt-1 grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold tabular-nums",
                step.tone === "decision" && "bg-[#fff4e6] text-[#b96d24]",
                step.tone === "stop" && "bg-[#fff0ed] text-[#c9564f]",
                step.tone === "action" && "bg-[#e8f7f0] text-[#238567]",
                (!step.tone || step.tone === "default") && "bg-[#e7efff] text-[#044ce2]",
              )}
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span aria-hidden="true" className="my-1 w-px flex-1 bg-[#e1e7f1]" />
            ) : null}
          </div>
          <div className={cn("min-w-0 flex-1 pb-3", index === steps.length - 1 && "pb-0")}>
            <p className="text-[11px] font-semibold text-[#24334c]">{t(step.titleKey)}</p>
            <p className="mt-0.5 text-[10px] leading-4 text-[#7d8aa0]">{t(step.bodyKey)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
