"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PageSizeSelect } from "@/components/compte/page-size-select";
import { SoftSelect } from "@/components/compte/soft-select";
import { FormSheet } from "@/components/forms/form-sheet";
import type { ActionItem, Tone } from "@/mocks/dashboard/types";

import { actionIcons } from "./action-list";
import { IconTile } from "./tone";

const pageSizeOptions = [10, 25, 50] as const;
const TONE_FILTERS = ["all", "red", "orange", "blue", "purple", "green", "slate"] as const;
type ToneFilter = (typeof TONE_FILTERS)[number];

export function AttentionListSheet({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: ActionItem[];
  onClose: () => void;
}) {
  const t = useTranslations("attention.listFull");
  const allT = useTranslations();
  const [query, setQuery] = useState("");
  const [tone, setTone] = useState<ToneFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setQuery("");
      setTone("all");
      setPage(0);
      setPageSize(10);
    }
    wasOpen.current = open;
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (tone !== "all" && item.tone !== tone) return false;
      if (!needle) return true;
      const title = allT(item.titleKey, item.titleValues).toLowerCase();
      const meta = allT(item.metaKey, item.metaValues).toLowerCase();
      const action = allT(item.actionKey).toLowerCase();
      return title.includes(needle) || meta.includes(needle) || action.includes(needle);
    });
  }, [allT, items, query, tone]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const rangeTo = Math.min(filtered.length, (safePage + 1) * pageSize);
  const filtersActive = Boolean(query.trim()) || tone !== "all";

  return (
    <FormSheet
      closeLabel={t("close")}
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      description={t("subtitle")}
      fillBesideSidebar
      open={open}
      title={t("title")}
      zIndexClassName="z-[65]"
      onClose={onClose}
    >
      <div className="flex shrink-0 flex-col gap-2 border-b border-[#edf2f8] px-3.5 py-3 sm:px-5">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t("search")}</span>
            <input
              className="compte-search-input soft-input h-10 w-full rounded-[9px] px-3 text-sm text-[#24334c] outline-none"
              onChange={(event) => {
                setPage(0);
                setQuery(event.target.value);
              }}
              placeholder={t("searchPlaceholder")}
              type="search"
              value={query}
            />
          </label>
          <SoftSelect
            hideLabel
            className="w-full sm:w-[180px]"
            label={t("filters.tone")}
            options={TONE_FILTERS.map((value) => ({
              value,
              label: value === "all" ? t("tone.all") : t(`tone.${value}`),
            }))}
            triggerClassName="h-10"
            value={tone}
            onChange={(value) => {
              setPage(0);
              setTone(value as ToneFilter);
            }}
          />
          {filtersActive ? (
            <button
              className="action-motion soft-button h-10 shrink-0 rounded-[8px] px-2.5 text-[11px] font-semibold text-[#516078]"
              type="button"
              onClick={() => {
                setQuery("");
                setTone("all");
                setPage(0);
              }}
            >
              {t("clearFilters")}
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-[#24334c]">{t("emptyTitle")}</p>
          <p className="max-w-[42ch] text-xs leading-5 text-[#7d8aa0]">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="dashboard-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-3 sm:px-5">
          {visible.map((item) => {
            const Icon = actionIcons[item.icon];
            return (
              <li key={item.id}>
                <button
                  className="action-motion soft-button flex min-h-[56px] w-full items-center gap-3 rounded-[12px] border border-[#e8eef6] bg-white px-3 py-2.5 text-left"
                  type="button"
                >
                  <IconTile size="sm" tone={item.tone as Tone} icon={Icon} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[#24334c]">
                      {allT(item.titleKey, item.titleValues)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#7a899e]">
                      {allT(item.metaKey, item.metaValues)}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#044ce2]">
                    {allT(item.actionKey)}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#edf2f8] px-3.5 py-2 sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="text-[11px] text-[#7d8aa0]">
            {t("pagination.summary", {
              from: rangeFrom,
              to: rangeTo,
              total: filtered.length,
            })}
          </p>
          <PageSizeSelect
            formatOption={(count) => t("pagination.rowsPerPage", { count })}
            label={t("pagination.pageSize")}
            options={pageSizeOptions}
            value={pageSize}
            onChange={(size) => {
              setPage(0);
              setPageSize(size);
            }}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            className="action-motion soft-button h-8 rounded-[8px] px-2.5 text-[11px] font-semibold text-[#516078] disabled:opacity-40"
            disabled={safePage === 0}
            type="button"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            {t("pagination.prev")}
          </button>
          <span className="min-w-[3.5rem] text-center text-[11px] font-semibold tabular-nums text-[#516078]">
            {safePage + 1}/{pageCount}
          </span>
          <button
            className="action-motion soft-button h-8 rounded-[8px] px-2.5 text-[11px] font-semibold text-[#516078] disabled:opacity-40"
            disabled={safePage >= pageCount - 1}
            type="button"
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
          >
            {t("pagination.next")}
          </button>
        </div>
      </footer>
    </FormSheet>
  );
}
