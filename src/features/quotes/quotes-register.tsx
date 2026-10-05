"use client";

import { DocumentStatus } from "@/components/status/document-status";
import { formatMoneyFromCents } from "@/lib/money";
import { useRouter } from "@/i18n/navigation";
import { builtInViews, owners } from "@/features/quotes/seed";
import {
  customerName,
  matchesFilters,
  ownerById,
  sameFilters,
  sortQuotes,
} from "@/features/quotes/query";
import {
  emptyFilters,
  nextActionFor,
  quoteTotals,
  type ColumnId,
  type DatePreset,
  type Density,
  type QuoteFilters,
  type QuoteRecord,
  type QuoteSort,
  type QuoteStatus,
  type SavedView,
} from "@/features/quotes/model";
import {
  hydrateLedger,
  restoreSeed,
  saveCustomView,
  updateQuote,
  useLedger,
} from "@/features/quotes/store";
import { QuoteCreateDialog } from "@/features/quotes/quote-create-dialog";
import { QuotePreview } from "@/features/quotes/quote-preview";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const pageSize = 10;
const statuses: QuoteStatus[] = ["draft", "sent", "review", "accepted", "rejected", "expired"];

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function cloneFilters(filters: QuoteFilters): QuoteFilters {
  return { ...filters, statuses: [...filters.statuses] };
}

export function QuotesRegister() {
  const t = useTranslations("register");
  const statusText = useTranslations("status");
  const workText = useTranslations();
  const router = useRouter();
  const params = useSearchParams();
  const ledger = useLedger();
  const [filters, setFilters] = useState<QuoteFilters>(() => {
    const customerId = params.get("customer");
    if (customerId && customerId !== "new") return { ...emptyFilters, customerId };
    return emptyFilters;
  });
  const [sort, setSort] = useState<QuoteSort>({ key: "id", direction: "desc" });
  const [hiddenColumns, setHiddenColumns] = useState<ColumnId[]>([]);
  const [density, setDensity] = useState<Density>("comfortable");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(params.get("quote"));
  const [previewWidth, setPreviewWidth] = useState(400);
  const [menu, setMenu] = useState<"filters" | "views" | "more" | null>(null);
  const [createOpen, setCreateOpen] = useState(params.get("create") === "1");
  const [viewName, setViewName] = useState("");
  const [notice, setNotice] = useState("");
  const [draftFilters, setDraftFilters] = useState<QuoteFilters>(emptyFilters);
  const requestKey = `${params.get("create") ?? ""}|${params.get("quote") ?? ""}|${params.get("customer") ?? ""}`;
  const [appliedRequest, setAppliedRequest] = useState(requestKey);

  if (requestKey !== appliedRequest) {
    setAppliedRequest(requestKey);
    if (params.get("create") === "1") setCreateOpen(true);
    const quoteId = params.get("quote");
    if (quoteId) setPreviewId(quoteId);
    const customerId = params.get("customer");
    if (customerId && customerId !== "new") {
      setFilters((current) => ({ ...current, customerId }));
    }
  }

  useEffect(() => {
    hydrateLedger();
  }, []);

  const filtered = useMemo(() => {
    const matched = ledger.quotes.filter((quote) => matchesFilters(quote, filters, ledger.customers));
    return sortQuotes(matched, sort, ledger.customers);
  }, [filters, ledger.customers, ledger.quotes, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const preview = ledger.quotes.find((quote) => quote.id === previewId) ?? null;
  const selectedQuotes = ledger.quotes.filter((quote) => selected.includes(quote.id));
  const selectedTotal = selectedQuotes.reduce((sum, quote) => sum + quoteTotals(quote).ttcCents, 0);
  const filteredTotal = filtered.reduce((sum, quote) => sum + quoteTotals(quote).ttcCents, 0);

  const views = [...builtInViews, ...ledger.customViews];
  const activeView = views.find(
    (view) =>
      sameFilters(view.filters, filters) &&
      view.sort.key === sort.key &&
      view.sort.direction === sort.direction,
  );

  function applyView(view: SavedView) {
    setFilters(cloneFilters(view.filters));
    setSort(view.sort);
    setHiddenColumns(view.hiddenColumns);
    setDensity(view.density);
    setPage(0);
    setMenu(null);
  }

  function toggleSort(key: QuoteSort["key"]) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
  }

  function runAction(quote: QuoteRecord) {
    const action = nextActionFor(quote);
    if (action.kind === "send") updateQuote(quote.id, { status: "sent" });
    if (action.kind === "approve") updateQuote(quote.id, { status: "accepted" });
    if (action.kind === "followUp") {
      setNotice(t("prepared"));
    }
    if (action.kind === "convert") router.push(`/devis/${quote.id}`);
  }

  function exportRows(rows: QuoteRecord[]) {
    const header = ["id", "customer", "total", "status", "validUntil"];
    const body = rows.map((quote) =>
      [
        quote.id,
        customerName(ledger.customers, quote.customerId),
        formatMoneyFromCents(quoteTotals(quote).ttcCents),
        quote.status,
        quote.validUntil,
      ].join(";"),
    );
    const blob = new Blob([[header.join(";"), ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "devis.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (!preview) return;
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      const index = filtered.findIndex((quote) => quote.id === preview.id);
      const next = event.key === "ArrowDown" ? filtered[index + 1] : filtered[index - 1];
      if (next) setPreviewId(next.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, preview]);

  const chips = [
    ...filters.statuses.map((status) => ({
      id: `status-${status}`,
      label: t("chips.status", { status: statusText(status) }),
      clear: () => setFilters((current) => ({ ...current, statuses: current.statuses.filter((item) => item !== status) })),
    })),
    filters.ownerId
      ? {
          id: "owner",
          label: t("chips.owner", { name: ownerById(filters.ownerId)?.name ?? "" }),
          clear: () => setFilters((current) => ({ ...current, ownerId: null })),
        }
      : null,
    filters.customerId
      ? {
          id: "customer",
          label: t("chips.customer", { name: customerName(ledger.customers, filters.customerId) }),
          clear: () => setFilters((current) => ({ ...current, customerId: null })),
        }
      : null,
    filters.datePreset !== "any"
      ? {
          id: "date",
          label: t("chips.date", { label: t(`dates.${filters.datePreset}`) }),
          clear: () => setFilters((current) => ({ ...current, datePreset: "any" })),
        }
      : null,
    filters.amountMinCents != null || filters.amountMaxCents != null
      ? {
          id: "amount",
          label: t("chips.amount", {
            range: `${filters.amountMinCents != null ? formatMoneyFromCents(filters.amountMinCents) : "–"} – ${
              filters.amountMaxCents != null ? formatMoneyFromCents(filters.amountMaxCents) : "–"
            }`,
          }),
          clear: () => setFilters((current) => ({ ...current, amountMinCents: null, amountMaxCents: null })),
        }
      : null,
  ].filter((chip) => chip !== null);

  const showOwner = !hiddenColumns.includes("owner");
  const showValidity = !hiddenColumns.includes("validity");
  const bulk = selected.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative z-20 border-b border-[#e1e7f1] bg-white px-4 py-3 sm:px-6">
        <div className="grid">
          <div aria-hidden={bulk} className={`ledger-swap col-start-1 row-start-1 flex flex-wrap items-center gap-2 ${bulk ? "pointer-events-none opacity-0" : ""}`} inert={bulk}>
            <input
              className="h-10 min-w-[180px] flex-1 rounded-[12px] border border-[#dfe6f1] bg-[#f7f9fd] px-3 text-sm text-[#063586] outline-none placeholder:text-[#7b8798] focus:bg-white focus:ring-[3px] focus:ring-[#044ce2]/35"
              placeholder={t("search")}
              value={filters.query}
              onChange={(event) => {
                setFilters((current) => ({ ...current, query: event.target.value }));
                setPage(0);
              }}
            />
            <MenuButton label={t("filters")} open={menu === "filters"} onClick={() => {
              setDraftFilters(cloneFilters(filters));
              setMenu(menu === "filters" ? null : "filters");
            }} />
            <MenuButton
              label={activeView ? (activeView.builtIn ? t(`views.${activeView.name as "all"}`) : activeView.name) : t("modified")}
              open={menu === "views"}
              onClick={() => setMenu(menu === "views" ? null : "views")}
            />
            <span className="hidden sm:contents">
              <MenuButton label="•••" ariaLabel={t("more")} open={menu === "more"} onClick={() => setMenu(menu === "more" ? null : "more")} />
            </span>
            <button
              className="ml-auto min-h-10 rounded-[10px] bg-[#044ce2] px-3 text-sm font-semibold text-white hover:bg-[#063586]"
              type="button"
              onClick={() => setCreateOpen(true)}
            >
              {t("newQuote")}
            </button>
          </div>
          <div aria-hidden={!bulk} className={`ledger-swap col-start-1 row-start-1 flex min-h-10 flex-wrap items-center gap-3 ${bulk ? "" : "pointer-events-none opacity-0"}`} inert={!bulk}>
            <p className="text-sm font-medium text-[#063586]">
              {t("selected", { count: selected.length })}
              <span className="mx-2 text-[#c5ceda]">·</span>
              <span className="font-semibold tabular-nums">{t("selectedSum", { amount: formatMoneyFromCents(selectedTotal) })}</span>
            </p>
            <button className="text-sm font-medium text-[#405069] hover:text-[#044ce2]" type="button" onClick={() => setNotice(t("prepared"))}>
              {t("followUp")}
            </button>
            <button className="text-sm font-medium text-[#405069] hover:text-[#044ce2]" type="button" onClick={() => exportRows(selectedQuotes)}>
              {t("export")}
            </button>
            <button className="text-sm font-medium text-[#728097]" type="button" aria-label={t("more")} onClick={() => setMenu(menu === "more" ? null : "more")}>
              •••
            </button>
            {notice ? <span className="text-xs text-[#0d6848]">{notice}</span> : null}
            <button className="ml-auto text-sm font-semibold text-[#044ce2]" type="button" onClick={() => { setSelected([]); setNotice(""); }}>
              {t("cancel")}
            </button>
          </div>
        </div>
        {menu === "filters" ? (
          <FilterPanel
            draft={draftFilters}
            customers={ledger.customers}
            onChange={setDraftFilters}
            onApply={() => {
              setFilters(draftFilters);
              setPage(0);
              setMenu(null);
            }}
            onClose={() => setMenu(null)}
          />
        ) : null}
        {menu === "views" ? (
          <div className="absolute top-full left-4 z-30 mt-1 w-72 rounded-[14px] bg-white p-2 shadow-[0_14px_45px_rgb(29_43_68/0.08)] ring-1 ring-[#e1e7f1] sm:left-6">
            {views.map((view) => (
              <button key={view.id} className="flex min-h-10 w-full items-center rounded-[10px] px-2 text-left text-sm text-[#24334c] hover:bg-[#f4f8ff]" type="button" onClick={() => applyView(view)}>
                {view.builtIn ? t(`views.${view.name as "all"}`) : view.name}
              </button>
            ))}
            <div className="mt-2 flex gap-2 border-t border-[#edf1f6] pt-2">
              <input
                className="h-9 min-w-0 flex-1 rounded-[10px] border border-[#dfe6f1] px-2 text-sm"
                placeholder={t("viewName")}
                value={viewName}
                onChange={(event) => setViewName(event.target.value)}
              />
              <button
                className="rounded-[10px] px-2 text-xs font-semibold text-[#044ce2]"
                type="button"
                onClick={() => {
                  if (!viewName.trim()) return;
                  saveCustomView({
                    id: `view-${Date.now()}`,
                    name: viewName.trim(),
                    builtIn: false,
                    filters: cloneFilters(filters),
                    sort,
                    hiddenColumns,
                    density,
                  });
                  setViewName("");
                  setMenu(null);
                }}
              >
                {t("saveView")}
              </button>
            </div>
          </div>
        ) : null}
        {menu === "more" ? (
          <div className="absolute top-full right-4 z-30 mt-1 w-64 rounded-[14px] bg-white p-3 shadow-[0_14px_45px_rgb(29_43_68/0.08)] ring-1 ring-[#e1e7f1] sm:right-6">
            <p className="text-xs font-semibold text-[#8b97a8]">{t("columns")}</p>
            {(["owner", "validity"] as ColumnId[]).map((column) => (
              <label key={column} className="mt-2 flex items-center gap-2 text-sm text-[#24334c]">
                <input
                  type="checkbox"
                  checked={!hiddenColumns.includes(column)}
                  onChange={() =>
                    setHiddenColumns((current) =>
                      current.includes(column) ? current.filter((item) => item !== column) : [...current, column],
                    )
                  }
                />
                {t(`columnsLabel.${column}`)}
              </label>
            ))}
            <p className="mt-3 text-xs font-semibold text-[#8b97a8]">{t("density")}</p>
            {(["comfortable", "compact"] as Density[]).map((item) => (
              <label key={item} className="mt-2 flex items-center gap-2 text-sm text-[#24334c]">
                <input type="radio" name="density" checked={density === item} onChange={() => setDensity(item)} />
                {t(item)}
              </label>
            ))}
            <button className="mt-3 text-sm font-semibold text-[#044ce2]" type="button" onClick={() => exportRows(filtered)}>
              {t("export")}
            </button>
          </div>
        ) : null}
        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button key={chip.id} className="inline-flex min-h-7 items-center gap-1 rounded-[7px] bg-[#e7efff] px-2 text-xs font-medium text-[#044ce2]" type="button" onClick={chip.clear}>
                <span className="max-w-[220px] truncate">{chip.label}</span>
                <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {ledger.quotes.length === 0 ? (
            <EmptyState
              title={t("empty.title")}
              body={t("empty.body")}
              primary={t("empty.create")}
              secondary={t("empty.import")}
              onPrimary={() => setCreateOpen(true)}
              onSecondary={restoreSeed}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={t("empty.filteredTitle")}
              body={t("empty.filteredBody")}
              primary={t("empty.clear")}
              onPrimary={() => {
                setFilters(emptyFilters);
                setPage(0);
              }}
            />
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto">
                <table className="hidden w-full table-fixed border-separate border-spacing-0 text-left md:table">
                  <colgroup>
                    <col className="w-10" />
                    <col className="w-[8.5rem]" />
                    <col />
                    {showOwner ? <col className="ledger-optional w-16" /> : null}
                    <col className="w-[8.75rem]" />
                    <col className="w-[8.5rem]" />
                    {showValidity ? <col className="ledger-optional w-[6.5rem]" /> : null}
                    <col className="w-[6.5rem]" />
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr className="text-[11px] font-semibold text-[#8b97a8]">
                      <th className="w-10 bg-[#fafbfe] px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={t("selected", { count: visible.length })}
                          checked={visible.length > 0 && visible.every((quote) => selected.includes(quote.id))}
                          onChange={() => {
                            const ids = visible.map((quote) => quote.id);
                            const allOn = ids.every((id) => selected.includes(id));
                            setSelected(allOn ? selected.filter((id) => !ids.includes(id)) : [...new Set([...selected, ...ids])]);
                          }}
                        />
                      </th>
                      <SortHeader label={t("number")} onClick={() => toggleSort("id")} />
                      <SortHeader label={t("customer")} onClick={() => toggleSort("customer")} />
                      {showOwner ? <th className="ledger-optional border-b border-[#e6ebf3] bg-[#fafbfe] px-3 py-2">{t("owner")}</th> : null}
                      <SortHeader label={t("total")} align="right" onClick={() => toggleSort("total")} />
                      <SortHeader label={t("status")} onClick={() => toggleSort("status")} />
                      {showValidity ? <SortHeader className="ledger-optional" label={t("validity")} onClick={() => toggleSort("validUntil")} /> : null}
                      <th className="border-b border-[#e6ebf3] bg-[#fafbfe] px-3 py-2">{t("next")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((quote) => {
                      const action = nextActionFor(quote);
                      const totals = quoteTotals(quote);
                      const rowSelected = selected.includes(quote.id);
                      return (
                        <tr
                          key={quote.id}
                          data-selected={rowSelected ? "true" : "false"}
                          data-active={previewId === quote.id ? "true" : "false"}
                          className={`ledger-row cursor-pointer ${density === "compact" ? "[&_td]:py-1" : "[&_td]:py-3"}`}
                          onClick={() => setPreviewId(quote.id)}
                        >
                          <td className="border-b border-[#edf1f6] px-3 py-2" onClick={(event) => event.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={rowSelected}
                              aria-label={quote.id}
                              onChange={() =>
                                setSelected((current) =>
                                  current.includes(quote.id) ? current.filter((id) => id !== quote.id) : [...current, quote.id],
                                )
                              }
                            />
                          </td>
                          <td className="border-b border-[#edf1f6] px-3 py-2">
                            <span className="block truncate text-sm font-medium text-[#044ce2]">{quote.id}</span>
                          </td>
                          <td className="overflow-hidden border-b border-[#edf1f6] px-3 py-2">
                            <p className="truncate text-sm font-semibold text-[#24334c]">{customerName(ledger.customers, quote.customerId)}</p>
                            <p className="truncate text-xs font-normal text-[#7b8798]">{workText(quote.workKey)}</p>
                          </td>
                          {showOwner ? (
                            <td className="ledger-optional border-b border-[#edf1f6] px-3 py-2 text-sm text-[#405069]">
                              {ownerById(quote.ownerId)?.initials}
                            </td>
                          ) : null}
                          <td className="border-b border-[#edf1f6] px-3 py-2 text-right text-sm font-semibold tabular-nums tracking-[-0.02em] text-[#063586]">
                            {formatMoneyFromCents(totals.ttcCents)}
                          </td>
                          <td className="border-b border-[#edf1f6] px-3 py-2">
                            <DocumentStatus status={quote.status} />
                          </td>
                          {showValidity ? (
                            <td className="ledger-optional border-b border-[#edf1f6] px-3 py-2 text-xs text-[#728097]">
                              {formatDate(quote.validUntil)}
                            </td>
                          ) : null}
                          <td className="border-b border-[#edf1f6] px-3 py-2" onClick={(event) => event.stopPropagation()}>
                            {action.kind === "none" ? (
                              <span className="text-xs text-[#98a4b5]">—</span>
                            ) : (
                              <button
                                className={`text-sm hover:underline ${action.urgent ? "font-semibold text-[#044ce2]" : "font-medium text-[#405069]"}`}
                                type="button"
                                onClick={() => runAction(quote)}
                              >
                                {t(`actions.${action.kind}`)}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <ul className="space-y-2 p-4 md:hidden">
                  {visible.map((quote) => {
                    const action = nextActionFor(quote);
                    return (
                      <li key={quote.id} className="rounded-[14px] border border-[#e1e7f1] bg-white p-3">
                        <button className="w-full text-left" type="button" onClick={() => setPreviewId(quote.id)}>
                          <span className="flex items-start justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-[#044ce2]">{quote.id}</span>
                              <span className="block truncate text-sm font-semibold text-[#24334c]">{customerName(ledger.customers, quote.customerId)}</span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-[#063586]">
                              {formatMoneyFromCents(quoteTotals(quote).ttcCents)}
                            </span>
                          </span>
                        </button>
                        <span className="mt-2 flex items-center justify-between gap-3">
                          <DocumentStatus status={quote.status} />
                          {action.kind !== "none" ? (
                            <button
                              className={`text-sm ${action.urgent ? "font-semibold text-[#044ce2]" : "font-medium text-[#405069]"}`}
                              type="button"
                              onClick={() => runAction(quote)}
                            >
                              {t(`actions.${action.kind}`)}
                            </button>
                          ) : null}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t border-[#edf1f6] px-4 py-2 text-xs text-[#728097] sm:px-6">
                <p className="whitespace-nowrap tabular-nums">{t("footer", { count: filtered.length, amount: formatMoneyFromCents(filteredTotal) })}</p>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">{t("page", { from: safePage * pageSize + 1, to: Math.min(filtered.length, (safePage + 1) * pageSize), total: filtered.length })}</span>
                  <button className="min-h-8 rounded-[8px] px-2 font-semibold text-[#044ce2] disabled:text-[#b7c3d6]" type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                    {t("previous")}
                  </button>
                  <button className="min-h-8 rounded-[8px] px-2 font-semibold text-[#044ce2] disabled:text-[#b7c3d6]" type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
                    {t("nextPage")}
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
        {preview ? (
          <div className="fixed inset-0 z-30 bg-[#063586]/20 xl:static xl:bg-transparent">
            <div className="ml-auto h-full max-w-full xl:max-w-none">
              <QuotePreview
                quote={preview}
                customers={ledger.customers}
                width={previewWidth}
                onWidth={setPreviewWidth}
                onClose={() => setPreviewId(null)}
                onAction={runAction}
              />
            </div>
          </div>
        ) : null}
      </div>
      {createOpen ? (
        <QuoteCreateDialog
          customers={ledger.customers}
          forceNewCustomer={params.get("customer") === "new"}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}
    </div>
  );
}

function MenuButton({ label, ariaLabel, open, onClick }: { label: string; ariaLabel?: string; open: boolean; onClick: () => void }) {
  return (
    <button
      className={`min-h-10 rounded-[10px] border px-3 text-sm font-medium ${
        open ? "border-[#b9d0fb] bg-[#e7efff] text-[#044ce2]" : "border-[#dfe6f1] bg-white text-[#405069]"
      }`}
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function SortHeader({
  label,
  onClick,
  align = "left",
  className = "",
}: {
  label: string;
  onClick: () => void;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th className={`border-b border-[#e6ebf3] bg-[#fafbfe] px-3 py-2 ${align === "right" ? "text-right" : "text-left"} ${className}`}>
      <button className="font-semibold text-[#8b97a8]" type="button" onClick={onClick}>
        {label}
      </button>
    </th>
  );
}

function FilterPanel({
  draft,
  customers,
  onChange,
  onApply,
  onClose,
}: {
  draft: QuoteFilters;
  customers: { id: string; name: string }[];
  onChange: (filters: QuoteFilters) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("register");
  const statusText = useTranslations("status");
  return (
    <div className="fixed inset-0 z-40 md:absolute md:inset-auto md:top-full md:left-4 md:z-30 md:mt-1 md:w-[min(100%-2rem,420px)] md:left-6">
      <button className="absolute inset-0 bg-[#063586]/25 md:hidden" type="button" aria-label={t("cancel")} onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[18px] bg-white p-4 shadow-[0_-12px_40px_rgb(29_43_68/0.12)] md:static md:max-h-none md:rounded-[14px] md:shadow-[0_14px_45px_rgb(29_43_68/0.08)] md:ring-1 md:ring-[#e1e7f1]">
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => {
          const on = draft.statuses.includes(status);
          return (
            <button
              key={status}
              className={`rounded-[7px] px-2 py-1 text-xs font-medium ${on ? "bg-[#e7efff] text-[#044ce2]" : "bg-[#f6f8fc] text-[#69778e]"}`}
              type="button"
              onClick={() =>
                onChange({
                  ...draft,
                  statuses: on ? draft.statuses.filter((item) => item !== status) : [...draft.statuses, status],
                })
              }
            >
              {statusText(status)}
            </button>
          );
        })}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select className="h-10 rounded-[12px] border border-[#dfe6f1] px-2 text-sm" value={draft.ownerId ?? ""} onChange={(event) => onChange({ ...draft, ownerId: event.target.value || null })}>
          <option value="">{t("anyOwner")}</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>{owner.name}</option>
          ))}
        </select>
        <select className="h-10 rounded-[12px] border border-[#dfe6f1] px-2 text-sm" value={draft.customerId ?? ""} onChange={(event) => onChange({ ...draft, customerId: event.target.value || null })}>
          <option value="">{t("anyCustomer")}</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>{customer.name}</option>
          ))}
        </select>
        <label className="block text-xs font-medium text-[#405069]">
          {t("amountMin")}
          <input
            className="mt-1 h-10 w-full rounded-[12px] border border-[#dfe6f1] px-2 text-sm tabular-nums"
            inputMode="decimal"
            value={draft.amountMinCents == null ? "" : String(draft.amountMinCents / 100)}
            onChange={(event) =>
              onChange({
                ...draft,
                amountMinCents: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100),
              })
            }
          />
        </label>
        <label className="block text-xs font-medium text-[#405069]">
          {t("amountMax")}
          <input
            className="mt-1 h-10 w-full rounded-[12px] border border-[#dfe6f1] px-2 text-sm tabular-nums"
            inputMode="decimal"
            value={draft.amountMaxCents == null ? "" : String(draft.amountMaxCents / 100)}
            onChange={(event) =>
              onChange({
                ...draft,
                amountMaxCents: event.target.value === "" ? null : Math.round(Number(event.target.value) * 100),
              })
            }
          />
        </label>
        <select className="h-10 rounded-[12px] border border-[#dfe6f1] px-2 text-sm sm:col-span-2" value={draft.datePreset} onChange={(event) => onChange({ ...draft, datePreset: event.target.value as DatePreset })}>
          {(["any", "month", "quarter", "next7", "overdue"] as DatePreset[]).map((preset) => (
            <option key={preset} value={preset}>{t(`dates.${preset}`)}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button className="text-sm font-medium text-[#728097]" type="button" onClick={onClose}>{t("cancel")}</button>
        <button className="min-h-9 rounded-[10px] bg-[#044ce2] px-3 text-sm font-semibold text-white" type="button" onClick={onApply}>{t("apply")}</button>
      </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  primary,
  secondary,
  onPrimary,
  onSecondary,
}: {
  title: string;
  body: string;
  primary: string;
  secondary?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
}) {
  return (
    <div className="grid flex-1 place-items-center px-6 py-16 text-center">
      <div className="max-w-md">
        <h2 className="text-lg font-semibold text-[#063586]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#728097]">{body}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button className="min-h-10 rounded-[10px] bg-[#044ce2] px-3 text-sm font-semibold text-white" type="button" onClick={onPrimary}>
            {primary}
          </button>
          {secondary && onSecondary ? (
            <button className="min-h-10 rounded-[10px] border border-[#dfe6f1] px-3 text-sm font-semibold text-[#405069]" type="button" onClick={onSecondary}>
              {secondary}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

