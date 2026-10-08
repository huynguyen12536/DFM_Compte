"use client";

import { MoreHorizontal, ReceiptText, Users, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
  TOP_TABS_ACTIVE_LAYOUT_ID,
} from "@/components/compte/animated-selection";
import { IconTile, StatusBadge } from "@/components/dashboard/tone";
import {
  invoiceDisplayNumber,
  paidCentsFor,
  remainingCentsFor,
  type BankTransaction,
  type InvoicePayment,
  type InvoiceRecord,
  type PaymentActivity,
} from "@/features/invoices/model";
import { formatMoneyFromCents } from "@/lib/money";
import { cn } from "@/lib/utils";

import { paymentListStatus } from "../model";
import { paymentListStatusTone, reconciliationDot } from "../status";
import { PaymentMethodIcon } from "./payment-method-icon";

const tabs = ["details", "invoice", "reconciliation", "activity"] as const;
type PanelTab = (typeof tabs)[number];

export function PaymentDetailsPanel({
  payment,
  invoice,
  ledgerPayments,
  bankTransaction,
  activities,
  onClose,
  onOpenInvoice,
  onOpenCustomer,
}: {
  payment: InvoicePayment;
  invoice: InvoiceRecord | undefined;
  ledgerPayments: InvoicePayment[];
  bankTransaction: BankTransaction | undefined;
  activities: PaymentActivity[];
  onClose: () => void;
  onOpenInvoice: () => void;
  onOpenCustomer: () => void;
}) {
  const t = useTranslations("payments");
  const locale = useLocale();
  const [tab, setTab] = useState<PanelTab>("details");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const listStatus = paymentListStatus(payment, invoice, ledgerPayments);

  useEffect(() => {
    if (!moreOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dateTime = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const paidBefore = invoice
    ? Math.max(0, paidCentsFor(invoice.id, ledgerPayments) - payment.amountCents)
    : 0;
  const remaining = invoice ? remainingCentsFor(invoice, ledgerPayments) : 0;

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="sticky top-0 z-10 shrink-0 bg-white/95 backdrop-blur-sm">
        <header className="border-b border-[#edf2f8] px-3.5 py-3">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 pt-0.5">
              <StatusBadge size="xs" tone={paymentListStatusTone[listStatus]}>
                {t(`listStatus.${listStatus}`)}
              </StatusBadge>
              <h3 className="mt-1.5 truncate text-[15px] font-semibold text-[#063586]">
                {t("panel.title", { reference: payment.reference })}
              </h3>
              <p className="mt-0.5 truncate text-sm font-medium text-[#24334c]">
                {invoice?.customerName ?? "—"}
              </p>
              <p className="truncate text-[11px] font-semibold tabular-nums text-[#7d8aa0]">
                {formatMoneyFromCents(payment.amountCents)}
              </p>
            </div>
            <div className="relative flex shrink-0 items-center gap-1" ref={moreRef}>
              <button
                aria-expanded={moreOpen}
                aria-haspopup="menu"
                aria-label={t("menu.trigger")}
                className="action-motion soft-button grid h-8 w-8 place-items-center rounded-[8px] text-[#66758d]"
                onClick={() => setMoreOpen((value) => !value)}
                type="button"
              >
                <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                aria-label={t("close")}
                className="action-motion soft-button grid h-8 w-8 place-items-center rounded-[8px] text-[#66758d]"
                onClick={onClose}
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              {moreOpen ? (
                <div
                  className="absolute top-[calc(100%+4px)] right-0 z-20 w-44 rounded-[10px] border border-white/80 bg-white/95 p-1 shadow-[6px_10px_24px_rgba(78,108,145,0.12)]"
                  role="menu"
                >
                  <button
                    className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-xs font-semibold text-[#405069] hover:bg-[#f5f8fd]"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenInvoice();
                    }}
                  >
                    <ReceiptText aria-hidden="true" className="h-3.5 w-3.5 text-[#044ce2]" />
                    {t("menu.invoice")}
                  </button>
                  <button
                    className="flex w-full items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-xs font-semibold text-[#405069] hover:bg-[#f5f8fd]"
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      onOpenCustomer();
                    }}
                  >
                    <Users aria-hidden="true" className="h-3.5 w-3.5 text-[#044ce2]" />
                    {t("menu.customer")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <AnimatedSelectionGroup className="min-w-0 border-b border-[#edf2f8] px-1.5" id="payment-detail-tabs">
          <div
            aria-label={t("panel.tabsLabel")}
            className="flex min-w-0 gap-0.5 overflow-x-auto py-1.5"
            role="tablist"
          >
            {tabs.map((item) => {
              const active = tab === item;
              return (
                <button
                  aria-selected={active}
                  className={cn(
                    "relative min-w-0 flex-1 truncate rounded-full px-1.5 py-2 text-[11px] font-semibold transition-colors duration-150",
                    active ? "text-[#2458d6]" : "text-[#7d8aa0] hover:text-[#405069]",
                  )}
                  key={item}
                  onClick={() => {
                    setMoreOpen(false);
                    setTab(item);
                  }}
                  role="tab"
                  type="button"
                >
                  {active ? (
                    <AnimatedActiveIndicator
                      className="rounded-full"
                      layoutId={`${TOP_TABS_ACTIVE_LAYOUT_ID}-payment-details`}
                      variant="soft-pill"
                    />
                  ) : null}
                  <span className="relative z-[1] truncate">{t(`tabs.${item}`)}</span>
                </button>
              );
            })}
          </div>
        </AnimatedSelectionGroup>
      </div>

      <div className="dashboard-scroll min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
        {tab === "details" ? (
          <div className="space-y-3" style={{ animation: "compte-tab-in 160ms ease-out" }}>
            <section className="rounded-[10px] border border-[#edf2f8] px-3 py-3">
              <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
                {t("sections.information")}
              </p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <Row label={t("columns.reference")} value={payment.reference} />
                <Row label={t("customer")} value={invoice?.customerName ?? "—"} />
                <Row label={t("columns.amount")} value={formatMoneyFromCents(payment.amountCents)} />
                <Row
                  label={t("methodLabel")}
                  value={
                    <span className="inline-flex items-center gap-1.5">
                      <PaymentMethodIcon method={payment.method} />
                      {t(`methods.${payment.method}`)}
                    </span>
                  }
                />
                <Row
                  label={t("columns.date")}
                  value={dateFmt.format(new Date(`${payment.date}T00:00:00`))}
                />
                <Row label={t("record.bankReference")} value={payment.bankReference ?? "—"} />
                <Row label={t("record.notes")} value={payment.notes ?? "—"} />
              </dl>
            </section>
          </div>
        ) : null}

        {tab === "invoice" ? (
          <div className="space-y-3" style={{ animation: "compte-tab-in 160ms ease-out" }}>
            {invoice ? (
              <section className="rounded-[10px] border border-[#edf2f8] px-3 py-3">
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
                  {t("tabs.invoice")}
                </p>
                <dl className="mt-2 space-y-1.5 text-sm">
                  <Row label={t("invoice")} value={invoiceDisplayNumber(invoice)} />
                  <Row
                    label={t("invoiceTab.total")}
                    value={formatMoneyFromCents(
                      paidBefore + payment.amountCents + remaining,
                    )}
                  />
                  <Row label={t("invoiceTab.paidBefore")} value={formatMoneyFromCents(paidBefore)} />
                  <Row
                    label={t("invoiceTab.thisPayment")}
                    value={formatMoneyFromCents(payment.amountCents)}
                  />
                  <Row label={t("invoiceTab.remaining")} value={formatMoneyFromCents(remaining)} />
                </dl>
                <button
                  className="action-motion soft-button mt-3 h-9 rounded-[9px] px-3 text-xs font-semibold text-[#044ce2]"
                  onClick={onOpenInvoice}
                  type="button"
                >
                  {t("invoiceTab.open")}
                </button>
              </section>
            ) : (
              <p className="py-6 text-center text-xs text-[#7d8aa0]">{t("invoiceTab.missing")}</p>
            )}
          </div>
        ) : null}

        {tab === "reconciliation" ? (
          <div className="space-y-3" style={{ animation: "compte-tab-in 160ms ease-out" }}>
            <section className="rounded-[10px] border border-[#edf2f8] px-3 py-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#24334c]">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: reconciliationDot[payment.reconciliationStatus] }}
                />
                {t(`reconciliation.${payment.reconciliationStatus}`)}
              </p>
              <dl className="mt-2 space-y-1.5 text-sm">
                <Row
                  label={t("recon.invoice")}
                  value={invoice ? invoiceDisplayNumber(invoice) : "—"}
                />
                <Row
                  label={t("recon.bank")}
                  value={bankTransaction?.label ?? payment.bankReference ?? "—"}
                />
                <Row
                  label={t("recon.matchedOn")}
                  value={
                    bankTransaction
                      ? dateFmt.format(new Date(`${bankTransaction.date}T00:00:00`))
                      : dateFmt.format(new Date(`${payment.date}T00:00:00`))
                  }
                />
                <Row label={t("recon.source")} value={t("recon.manual")} />
              </dl>
            </section>
          </div>
        ) : null}

        {tab === "activity" ? (
          <ol className="space-y-0 py-1" style={{ animation: "compte-tab-in 160ms ease-out" }}>
            {activities.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#7d8aa0]">{t("activity.empty")}</p>
            ) : (
              activities.map((item, index) => {
                const isLatest = index === 0;
                return (
                  <li
                    className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-2 sm:grid-cols-[5.5rem_minmax(0,1fr)]"
                    key={item.id}
                  >
                    <div className="pt-1 text-right">
                      <p className="text-[12px] font-semibold text-[#24334c]">
                        {dateTime.format(new Date(item.at)).split(",")[0]}
                      </p>
                      <p className="text-[11px] text-[#98a4b5]">
                        {new Intl.DateTimeFormat(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }).format(new Date(item.at))}
                      </p>
                    </div>
                    <article
                      className={cn(
                        "rounded-[10px] border border-[#edf2f8] px-3 py-2.5",
                        isLatest && "invoice-activity-card--live border-[#c6ebd9]",
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-2">
                        <IconTile className="mt-0.5" icon={ReceiptText} size="sm" tone="green" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#24334c]">
                            {t(`activity.${item.kind}`, {
                              amount: item.amountCents
                                ? formatMoneyFromCents(item.amountCents)
                                : "",
                              invoice: item.invoiceNumber ?? "",
                            })}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#7d8aa0]">{item.actorName}</p>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })
            )}
          </ol>
        ) : null}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <dt className="shrink-0 text-[11px] text-[#7d8aa0]">{label}</dt>
      <dd className="min-w-0 text-right text-xs font-medium text-[#24334c]">{value}</dd>
    </div>
  );
}
