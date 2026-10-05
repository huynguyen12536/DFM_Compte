"use client";

import { CalendarDays } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
  TOP_TABS_ACTIVE_LAYOUT_ID,
} from "@/components/compte/animated-selection";
import { cn } from "@/lib/utils";

const sections = [
  { key: "overview", href: "#dashboard-top" },
  { key: "quotes", href: "#dashboard-quotes" },
  { key: "invoices", href: "#dashboard-invoices" },
  { key: "payments", href: "#dashboard-payments" },
  { key: "collections", href: "#dashboard-receivables" },
] as const;

export function DashboardControls() {
  const t = useTranslations("overview");
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["key"]>("overview");

  return (
    <div className="dashboard-enter enter-0 flex flex-wrap items-center justify-between gap-2">
      <nav aria-label={t("sections.label")} className="min-w-0 max-w-full">
        <AnimatedSelectionGroup id="compte-top-tabs">
          <ul className="flex flex-wrap gap-1.5">
            {sections.map((section) => {
              const active = activeSection === section.key;
              return (
                <li key={section.key}>
                  <a
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "dashboard-pill relative",
                      active && "dashboard-pill--indicator-active",
                    )}
                    href={section.href}
                    onClick={() => setActiveSection(section.key)}
                  >
                    {active ? (
                      <AnimatedActiveIndicator
                        layoutId={TOP_TABS_ACTIVE_LAYOUT_ID}
                        variant="soft-pill"
                      />
                    ) : null}
                    <span className="relative z-[1]">{t(`sections.${section.key}`)}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </AnimatedSelectionGroup>
      </nav>

      <span className="inline-flex h-[26px] items-center gap-1.5 rounded-full border border-[#d9e3ef] bg-white px-2.5 text-[10px] font-semibold text-[#13284a]">
        <CalendarDays aria-hidden="true" className="h-3 w-3 text-[#2f66e8]" />
        {t("period.current")}
      </span>
    </div>
  );
}
