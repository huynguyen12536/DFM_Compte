"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { PageSizeSelect } from "@/components/compte/page-size-select";
import { SoftSelect } from "@/components/compte/soft-select";
import { StatusBadge } from "@/components/dashboard/tone";
import { FormSheet } from "@/components/forms/form-sheet";
import type { Invoice, InvoiceStatusKey } from "@/mocks/dashboard/types";

const pageSizeOptions = [10, 25, 50] as const;
const STATUS_FILTERS = [
  "all",
  "status.overdue",
  "status.dueSoon",
  "status.partial",
  "status.open",
  "status.paid",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const cell = "min-w-0 overflow-hidden";

export function InvoicesListSheet({
  open,
  invoices,
  onClose,
}: {
  open: boolean;
  invoices: Invoice[];
  onClose: () => void;
}) {
  const t = useTranslations("invoices.listFull");
  const invoicesT = useTranslations("invoices");
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
    return invoices.filter((invoice) => {
      if (status !== "all" && invoice.statusKey !== status) return false;
      if (!needle) return true;
      return (
        invoice.id.toLowerCase().includes(needle) ||
        invoice.customer.toLowerCase().includes(needle) ||
        invoice.balance.toLowerCase().includes(needle) ||
        invoice.due.toLowerCase().includes(needle)
      );
    });
  }, [invoices, query, status]);

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
                  : statusT(value as InvoiceStatusKey),
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
                <col style={{ width: 130 }} />
                <col />
                <col style={{ width: 120 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 120 }} />
              </colgroup>
              <thead className="dashboard-list__head sticky top-0 z-[1] bg-white">
                <tr>
                  <th className={cell}>{t("columns.number")}</th>
                  <th className={cell}>{t("columns.customer")}</th>
                  <th className={cell}>{t("columns.due")}</th>
                  <th className={`${cell} text-right`}>{t("columns.balance")}</th>
                  <th className={cell}>{t("columns.status")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((invoice) => (
                  <tr className="dashboard-list__row" key={invoice.id}>
                    <td className={cell}>
                      <span className="dashboard-list__primary tabular-nums">{invoice.id}</span>
                    </td>
                    <td className={cell}>
                      <span className="dashboard-list__primary" title={invoice.customer}>
                        {invoice.customer}
                      </span>
                    </td>
                    <td className={cell}>
                      <span className="dashboard-list__secondary">
                        {invoicesT("due", { date: invoice.due })}
                      </span>
                    </td>
                    <td className={cell}>
                      <span className="dashboard-list__amount block truncate" title={invoice.balance}>
                        {invoice.balance}
                      </span>
                    </td>
                    <td className={cell}>
                      <StatusBadge size="xs" tone={invoice.tone}>
                        {statusT(invoice.statusKey)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="dashboard-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-3.5 py-3 lg:hidden sm:px-5">
            {visible.map((invoice) => (
              <li
                className="rounded-[12px] border border-[#e8eef6] bg-white p-3"
                key={invoice.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="dashboard-list__primary truncate tabular-nums">{invoice.id}</p>
                    <p className="dashboard-list__secondary truncate">{invoice.customer}</p>
                  </div>
                  <StatusBadge size="xs" tone={invoice.tone}>
                    {statusT(invoice.statusKey)}
                  </StatusBadge>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-[#7d8aa0]">
                  <span>{invoicesT("due", { date: invoice.due })}</span>
                  <span className="dashboard-list__amount tabular-nums">{invoice.balance}</span>
                </div>
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
