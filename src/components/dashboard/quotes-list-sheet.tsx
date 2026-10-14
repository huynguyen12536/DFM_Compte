"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PageSizeSelect } from "@/components/compte/page-size-select";
import { SoftSelect } from "@/components/compte/soft-select";
import { StatusBadge } from "@/components/dashboard/tone";
import { FormSheet } from "@/components/forms/form-sheet";
import type { Quote, QuoteStatusKey } from "@/mocks/dashboard/types";
import { cn } from "@/lib/utils";

const pageSizeOptions = [10, 25, 50] as const;

const STATUS_FILTERS = [
  "all",
  "status.draft",
  "status.sent",
  "status.review",
  "status.accepted",
  "status.rejected",
  "status.expired",
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

const cell = "min-w-0 overflow-hidden";

export function QuotesListSheet({
  open,
  quotes,
  onClose,
  onOpenQuote,
}: {
  open: boolean;
  quotes: Quote[];
  onClose: () => void;
  onOpenQuote: (id: string) => void;
}) {
  const t = useTranslations("quotes.listFull");
  const quotesT = useTranslations("quotes");
  const statusT = useTranslations();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      setQuery("");
      setStatus("all");
      setPage(0);
      setPageSize(10);
    }
    wasOpen.current = open;
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (status !== "all" && quote.statusKey !== status) return false;
      if (!needle) return true;
      const work = statusT(quote.workKey).toLowerCase();
      return (
        quote.id.toLowerCase().includes(needle) ||
        quote.customer.toLowerCase().includes(needle) ||
        quote.owner.toLowerCase().includes(needle) ||
        quote.amount.toLowerCase().includes(needle) ||
        work.includes(needle)
      );
    });
  }, [quotes, query, status, statusT]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const rangeFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const rangeTo = Math.min(filtered.length, (safePage + 1) * pageSize);
  const filtersActive = Boolean(query.trim()) || status !== "all";

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
            label={t("filters.status")}
            options={STATUS_FILTERS.map((value) => ({
              value,
              label:
                value === "all"
                  ? t("status.all")
                  : statusT(value as QuoteStatusKey),
            }))}
            triggerClassName="h-10"
            value={status}
            onChange={(value) => {
              setPage(0);
              setStatus(value as StatusFilter);
            }}
          />
          {filtersActive ? (
            <button
              className="action-motion soft-button h-10 shrink-0 rounded-[8px] px-2.5 text-[11px] font-semibold text-[#516078]"
              type="button"
              onClick={() => {
                setQuery("");
                setStatus("all");
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
            <table className="w-full min-w-[720px] table-fixed border-separate border-spacing-0 text-left">
              <colgroup>
                <col style={{ width: 120 }} />
                <col />
                <col style={{ width: 72 }} />
                <col style={{ width: 130 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 88 }} />
              </colgroup>
              <thead className="dashboard-list__head sticky top-0 z-[1] bg-white">
                <tr>
                  <th className={cell}>{quotesT("number")}</th>
                  <th className={cell}>{quotesT("customer")}</th>
                  <th className={cell}>{quotesT("owner")}</th>
                  <th className={`${cell} text-right`}>{quotesT("total")}</th>
                  <th className={cell}>{quotesT("status")}</th>
                  <th className={cell}>{t("columns.action")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((quote) => {
                  const work = statusT(quote.workKey);
                  return (
                    <tr
                      className="dashboard-list__row cursor-pointer"
                      key={quote.id}
                      onClick={() => onOpenQuote(quote.id)}
                    >
                      <td className={cell}>
                        <button
                          className="dashboard-list__primary dashboard-list__link max-w-full text-left tabular-nums"
                          title={quote.id}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenQuote(quote.id);
                          }}
                        >
                          {quote.id}
                        </button>
                      </td>
                      <td className={cell}>
                        <span className="dashboard-list__primary" title={quote.customer}>
                          {quote.customer}
                        </span>
                        <span className="dashboard-list__secondary" title={work}>
                          {work}
                        </span>
                      </td>
                      <td className={cell}>
                        <span className="dashboard-list__avatar" title={quote.owner}>
                          {quote.owner}
                        </span>
                      </td>
                      <td className={cell}>
                        <span className="dashboard-list__amount block truncate" title={quote.amount}>
                          {quote.amount}
                        </span>
                      </td>
                      <td className={cell}>
                        <StatusBadge
                          className="dashboard-list__badge max-w-full"
                          size="xs"
                          tone={quote.tone}
                        >
                          {statusT(quote.statusKey)}
                        </StatusBadge>
                      </td>
                      <td className={cell}>
                        <button
                          className="action-motion soft-button h-8 rounded-[8px] px-2.5 text-xs font-semibold text-[#044ce2]"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenQuote(quote.id);
                          }}
                        >
                          {t("actions.view")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="dashboard-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-3 lg:hidden sm:px-5">
            {visible.map((quote) => {
              const work = statusT(quote.workKey);
              return (
                <li key={quote.id}>
                  <button
                    className={cn(
                      "action-motion soft-button flex w-full flex-col gap-2 rounded-[12px] border border-[#e8eef6] bg-white p-3 text-left",
                    )}
                    type="button"
                    onClick={() => onOpenQuote(quote.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="dashboard-list__primary truncate tabular-nums">{quote.id}</p>
                        <p className="dashboard-list__secondary truncate">{quote.customer}</p>
                      </div>
                      <StatusBadge size="xs" tone={quote.tone}>
                        {statusT(quote.statusKey)}
                      </StatusBadge>
                    </div>
                    <p className="truncate text-[11px] text-[#7d8aa0]">{work}</p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="dashboard-list__avatar" title={quote.owner}>
                        {quote.owner}
                      </span>
                      <span className="dashboard-list__amount tabular-nums">{quote.amount}</span>
                    </div>
                  </button>
                </li>
              );
            })}
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
