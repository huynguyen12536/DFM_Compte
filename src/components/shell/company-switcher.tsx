"use client";

import { Building2, Check, ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { IconTile } from "@/components/dashboard/tone";
import { useCurrentCompany } from "@/features/settings/company-store";
import { getActiveCompanies } from "@/features/settings/mocks/companies";
import { cn } from "@/lib/utils";

export function CompanySwitcher() {
  const t = useTranslations("sidebar");
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { company, setCompanyId } = useCurrentCompany();
  const companies = getActiveCompanies();

  const active = company ?? companies[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className={cn(
        "company-switcher sidebar-surface relative shrink-0 rounded-[14px] p-3",
        open && "company-switcher--open",
      )}
      ref={rootRef}
    >
      <div className="flex items-center gap-3">
        <IconTile tone="blue" icon={Building2} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#253550]">{active.name}</p>
          <p className="truncate text-xs text-[#708098]">
            {active.subtitle ?? active.currency ?? t("companyFallback")}
          </p>
        </div>
      </div>

      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="action-motion soft-button mt-3 flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-xs font-medium text-[#516078]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {t("switchCompany")}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          aria-label={t("companyList")}
          className="company-switcher-menu absolute top-full right-2 left-2 z-[1] mt-1.5 max-h-52 space-y-0.5 overflow-y-auto rounded-[12px] border border-[#dce5f0] bg-[rgb(255_255_255/0.98)] p-1.5 shadow-[0_14px_32px_rgb(29_43_68/0.18),0_2px_6px_rgb(29_43_68/0.08)] backdrop-blur-md"
          id={listId}
          role="listbox"
        >
          {companies.map((company) => {
            const selected = company.id === active.id;
            return (
              <button
                aria-selected={selected}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-[8px] px-2 py-2 text-left transition-colors duration-150",
                  selected
                    ? "bg-white/90 text-[#044ce2] shadow-[2px_3px_8px_rgba(78,108,145,0.08)]"
                    : "text-[#405069] hover:bg-white/70 hover:text-[#24334c]",
                )}
                key={company.id}
                onClick={() => {
                  setCompanyId(company.id);
                  setOpen(false);
                }}
                role="option"
                type="button"
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-[8px]",
                    selected ? "bg-[#e7efff] text-[#044ce2]" : "bg-[#eef3fa]/90 text-[#66758d]",
                  )}
                >
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{company.name}</span>
                  <span className="block truncate text-[10px] text-[#7d8aa0]">
                    {company.subtitle ?? company.currency}
                  </span>
                </span>
                {selected ? <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
