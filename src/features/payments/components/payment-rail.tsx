"use client";

import { useLocale, useTranslations } from "next-intl";

import { CardHeader, LegendDot } from "@/components/dashboard/overview/dashboard-card";
import { StatusDonut } from "@/components/dashboard/overview/status-donut";
import { useRevealOnce } from "@/components/dashboard/overview/use-reveal-once";
import {
  invoiceDisplayNumber,
  remainingCentsFor,
  type BankTransaction,
  type InvoicePayment,
  type InvoiceRecord,
} from "@/features/invoices/model";
import { formatMoneyFromCents, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { collectionHealth, paymentMethodBreakdown } from "../kpis";
import { PAYMENT_METHOD_ORDER } from "../model";
import { paymentMethodColor } from "../status";

export function PaymentRail({
  invoices,
  payments,
  queue,
  canReconcile,
  onMatch,
  onReview,
}: {
  invoices: InvoiceRecord[];
  payments: InvoicePayment[];
  queue: BankTransaction[];
  canReconcile: boolean;
  onMatch: (id: string) => void;
  onReview: (id: string) => void;
}) {
  return (
    <aside className="flex min-h-0 min-w-0 flex-col gap-3 lg:grid lg:grid-cols-2 xl:flex xl:w-[min(100%,320px)] 2xl:w-[300px]">
      <div className="order-1 lg:col-span-2 xl:contents">
        <ReconciliationQueue
          canReconcile={canReconcile}
          invoices={invoices}
          payments={payments}
          queue={queue}
          onMatch={onMatch}
          onReview={onReview}
        />
      </div>
      <div className="order-3 xl:order-2">
        <PaymentMethodsCard payments={payments} />
      </div>
      <div className="order-2 xl:order-3">
        <CollectionHealthCard invoices={invoices} payments={payments} />
      </div>
    </aside>
  );
}

function ReconciliationQueue({
  queue,
  invoices,
  payments,
  canReconcile,
  onMatch,
  onReview,
}: {
  queue: BankTransaction[];
  invoices: InvoiceRecord[];
  payments: InvoicePayment[];
  canReconcile: boolean;
  onMatch: (id: string) => void;
  onReview: (id: string) => void;
}) {
  const t = useTranslations("payments.queue");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const invoicesById = new Map(invoices.map((invoice) => [invoice.id, invoice]));

  return (
    <section
      aria-labelledby="payment-queue-title"
      className="dashboard-card dashboard-list flex min-h-0 flex-col overflow-hidden lg:col-span-2 xl:col-span-1"
    >
      <div className="dashboard-list__header">
        <CardHeader title={t("title")} titleId="payment-queue-title" />
      </div>
      {queue.length === 0 ? (
        <div className="px-3.5 py-3">
          <p className="text-xs font-semibold text-[#238567]">{t("emptyTitle")}</p>
          <p className="mt-0.5 text-[11px] leading-5 text-[#7d8aa0]">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="border-t border-[rgb(217_227_238/0.72)]">
          {queue.map((item) => {
            const suggested = item.suggestedInvoiceId
              ? invoicesById.get(item.suggestedInvoiceId)
              : undefined;
            const needsReview = item.status === "needs_review" || !suggested;
            return (
              <li
                className="dashboard-list__row flex flex-col items-stretch gap-1.5 py-2.5"
                key={item.id}
              >
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="dashboard-list__amount">
                      {formatMoneyFromCents(item.amountCents)}
                    </p>
                    <p className="dashboard-list__secondary">
                      {dateFmt.format(new Date(`${item.date}T00:00:00`))}
                    </p>
                    <p className="dashboard-list__secondary truncate" title={item.label}>
                      {item.label}
                    </p>
                    {suggested ? (
                      <p className="mt-0.5 text-[11px] text-[#516078]">
                        {t("possible", {
                          invoice: invoiceDisplayNumber(suggested),
                          remaining: formatMoneyFromCents(
                            remainingCentsFor(suggested, payments),
                          ),
                        })}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11px] text-[#516078]">{t("noSuggestion")}</p>
                    )}
                  </div>
                  {canReconcile ? (
                    <button
                      className="action-motion soft-button h-7 shrink-0 rounded-[8px] px-2 text-[11px] font-semibold text-[#044ce2]"
                      onClick={() => (needsReview ? onReview(item.id) : onMatch(item.id))}
                      type="button"
                    >
                      {needsReview ? t("review") : t("match")}
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function PaymentMethodsCard({ payments }: { payments: InvoicePayment[] }) {
  const t = useTranslations("payments");
  const rows = paymentMethodBreakdown(payments)
    .slice()
    .sort(
      (left, right) =>
        PAYMENT_METHOD_ORDER.indexOf(left.method) - PAYMENT_METHOD_ORDER.indexOf(right.method),
    );
  const totalCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  const segments = rows.map((row) => ({
    key: row.method,
    label: t(`methods.${row.method}`),
    amount: row.amountCents,
    color: paymentMethodColor[row.method] ?? "#7f93b0",
  }));

  return (
    <StatusDonut
      centerLabel={t("methodsCard.center")}
      centerValue={formatMoneyFromCents(totalCents)}
      formatSegmentValue={(amount) => formatMoneyFromCents(Math.round(amount))}
      id="payment-methods-donut"
      segments={segments}
      title={t("methodsCard.title")}
    />
  );
}

function CollectionHealthCard({
  invoices,
  payments,
}: {
  invoices: InvoiceRecord[];
  payments: InvoicePayment[];
}) {
  const t = useTranslations("payments.health");
  const [barsRef, barsRevealed] = useRevealOnce<HTMLUListElement>(0.15);
  const health = collectionHealth(invoices, payments);
  const rows = [
    {
      key: "onTime",
      label: t("onTime"),
      ratio: health.onTimeRatio,
      color: "var(--dashboard-success, #1fb36e)",
    },
    {
      key: "partial",
      label: t("partial"),
      ratio: health.partialRatio,
      color: "var(--dashboard-warning, #f59b2d)",
    },
    {
      key: "overdue",
      label: t("overdue"),
      ratio: health.overdueRatio,
      color: "var(--dashboard-danger, #e24b45)",
    },
  ];

  return (
    <section
      aria-labelledby="collection-health-title"
      className="dashboard-card dashboard-list flex min-h-0 flex-col overflow-hidden"
    >
      <div className="dashboard-list__header">
        <CardHeader title={t("title")} titleId="collection-health-title" />
      </div>
      <ul
        className="border-t border-[rgb(217_227_238/0.72)] px-1 py-1"
        data-revealed={barsRevealed}
        ref={barsRef}
      >
        {rows.map((row, index) => {
          const width = formatPercent(row.ratio).replace(",", ".");
          return (
            <li className="dashboard-list__row gap-2" key={row.key}>
              <LegendDot color={row.color} />
              <span className="min-w-0 flex-1">
                <span className="dashboard-list__primary">{row.label}</span>
                <span
                  aria-hidden="true"
                  className="mt-1 block h-[5px] overflow-hidden rounded-full bg-[rgb(222_230_240/0.75)]"
                >
                  <span
                    className={cn("block h-full rounded-full origin-left", barsRevealed && "grow-x")}
                    key={barsRevealed ? `${row.key}-grow` : row.key}
                    style={{
                      width: barsRevealed ? width : "0%",
                      backgroundColor: row.color,
                      animationDelay: `${80 + index * 60}ms`,
                    }}
                  />
                </span>
              </span>
              <strong className="dashboard-list__amount shrink-0">{formatPercent(row.ratio)}</strong>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
