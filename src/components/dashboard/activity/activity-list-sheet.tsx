"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PageSizeSelect } from "@/components/compte/page-size-select";
import { SoftSelect } from "@/components/compte/soft-select";
import { StatusBadge } from "@/components/dashboard/tone";
import { FormSheet } from "@/components/forms/form-sheet";
import {
  filterActivity,
  type ActivityFilter,
  type ActivityItem,
} from "@/features/activity/model";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 25, 50] as const;
const FILTERS: ActivityFilter[] = ["all", "quotes", "invoices", "payments", "system"];
const cell = "min-w-0 overflow-hidden";

export function ActivityListSheet({
  open,
  events,
  onClose,
  onOpenItem,
}: {
  open: boolean;
  events: ActivityItem[];
  onClose: () => void;
  onOpenItem: (item: ActivityItem) => void;
}) {
  const t = useTranslations("activity.listFull");
  const feedT = useTranslations("activity.feed");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setQuery("");
      setFilter("all");
      setPage(0);
      setPageSize(10);
    }
    wasOpen.current = open;
  }, [open]);

  const filtered = useMemo(() => {
    const byKind = filterActivity(events, filter);
    const needle = query.trim().toLowerCase();
    if (!needle) return byKind;
    return byKind.filter((item) => {
      return (
        item.title.toLowerCase().includes(needle) ||
        item.entityId.toLowerCase().includes(needle) ||
        item.metadata.toLowerCase().includes(needle) ||
        (item.amount?.toLowerCase().includes(needle) ?? false) ||
        (item.actor?.name.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [events, filter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const rangeTo = Math.min(filtered.length, (safePage + 1) * pageSize);
  const filtersActive = Boolean(query.trim()) || filter !== "all";

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
            label={feedT("filtersLabel")}
            options={FILTERS.map((value) => ({
              value,
              label: feedT(`filters.${value}`),
            }))}
            triggerClassName="h-10"
            value={filter}
            onChange={(value) => {
              setPage(0);
              setFilter(value as ActivityFilter);
            }}
          />
          {filtersActive ? (
            <button
              className="action-motion soft-button h-10 shrink-0 rounded-[8px] px-2.5 text-[11px] font-semibold text-[#516078]"
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
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
        <>
          <div className="hidden min-h-0 flex-1 overflow-auto lg:block">
            <table className="w-full min-w-[820px] table-fixed border-separate border-spacing-0 text-left">
              <colgroup>
                <col style={{ width: 90 }} />
                <col />
                <col style={{ width: 120 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 88 }} />
              </colgroup>
              <thead className="dashboard-list__head sticky top-0 z-[1] bg-white">
                <tr>
                  <th className={cell}>{t("columns.time")}</th>
                  <th className={cell}>{t("columns.event")}</th>
                  <th className={cell}>{t("columns.reference")}</th>
                  <th className={`${cell} text-right`}>{t("columns.amount")}</th>
                  <th className={cell}>{t("columns.status")}</th>
                  <th className={cell}>{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr
                    className="dashboard-list__row cursor-pointer"
                    key={item.id}
                    onClick={() => onOpenItem(item)}
                  >
                    <td className={cell}>
                      <span className="dashboard-list__secondary tabular-nums">{item.timeLabel}</span>
                    </td>
                    <td className={cell}>
                      <span className="dashboard-list__primary" title={item.title}>
                        {item.title}
                      </span>
                      <span className="dashboard-list__secondary" title={item.metadata}>
                        {item.metadata}
                      </span>
                    </td>
                    <td className={cell}>
                      <span className="dashboard-list__primary tabular-nums">{item.entityId}</span>
                    </td>
                    <td className={cell}>
                      <span className="dashboard-list__amount block truncate">
                        {item.amount ?? "—"}
                      </span>
                    </td>
                    <td className={cell}>
                      <StatusBadge size="xs" tone="slate">
                        {item.statusLabel}
                      </StatusBadge>
                    </td>
                    <td className={cell}>
                      <button
                        className="action-motion soft-button h-8 rounded-[8px] px-2.5 text-xs font-semibold text-[#044ce2]"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenItem(item);
                        }}
                      >
                        {t("actions.view")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="dashboard-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-3 lg:hidden sm:px-5">
            {visible.map((item) => (
              <li key={item.id}>
                <button
                  className={cn(
                    "action-motion soft-button flex w-full flex-col gap-2 rounded-[12px] border border-[#e8eef6] bg-white p-3 text-left",
                  )}
                  type="button"
                  onClick={() => onOpenItem(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="dashboard-list__primary truncate">{item.title}</p>
                      <p className="dashboard-list__secondary truncate">{item.metadata}</p>
                    </div>
                    <span className="shrink-0 text-[11px] tabular-nums text-[#7d8aa0]">
                      {item.timeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge size="xs" tone="slate">
                      {item.statusLabel}
                    </StatusBadge>
                    <span className="dashboard-list__amount tabular-nums">
                      {item.amount ?? item.entityId}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </>
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
