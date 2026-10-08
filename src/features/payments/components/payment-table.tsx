"use client";

import { useLocale, useTranslations } from "next-intl";

import { DashboardScroll } from "@/components/dashboard/dashboard-scroll";
import { StatusBadge } from "@/components/dashboard/tone";
import {
  invoiceDisplayNumber,
  type InvoicePayment,
  type InvoiceRecord,
} from "@/features/invoices/model";
import { formatMoneyFromCents } from "@/lib/money";
import { cn } from "@/lib/utils";

import { paymentListStatus, paymentNextAction } from "../model";
import { paymentListStatusTone, reconciliationDot } from "../status";
import { PaymentMethodIcon } from "./payment-method-icon";
import { PaymentRowMenu, type PaymentMenuAction } from "./payment-row-menu";

const cell = "min-w-0 overflow-hidden";

export function PaymentTable({
  payments,
  ledgerPayments,
  invoicesById,
  selectedId,
  selectedIds,
  canReconcile,
  onToggleCheck,
  onToggleAll,
  onOpen,
  onOpenInvoice,
  onNextAction,
  onMenuAction,
}: {
  payments: InvoicePayment[];
  ledgerPayments: InvoicePayment[];
  invoicesById: Map<string, InvoiceRecord>;
  selectedId: string | null;
  selectedIds: string[];
  canReconcile: boolean;
  onToggleCheck: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (id: string) => void;
  onOpenInvoice: (invoiceId: string) => void;
  onNextAction: (id: string) => void;
  onMenuAction: (id: string, action: PaymentMenuAction) => void;
}) {
  const t = useTranslations("payments");
  const workT = useTranslations();
  const locale = useLocale();
  const allChecked = payments.length > 0 && selectedIds.length === payments.length;
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  return (
    <DashboardScroll scrollClassName="overflow-x-auto overflow-y-auto">
      <table className="w-full min-w-[1080px] table-fixed border-separate border-spacing-0 text-left xl:min-w-0">
        <colgroup>
          <col style={{ width: 36 }} />
          <col style={{ width: 128 }} />
          <col />
          <col style={{ width: 120 }} />
          <col style={{ width: 140 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 110 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 100 }} />
          <col style={{ width: 44 }} />
        </colgroup>
        <thead className="dashboard-list__head">
          <tr>
            <th className={cell}>
              <input
                aria-label={t("table.selectAll")}
                checked={allChecked}
                className="h-3.5 w-3.5 accent-[#044ce2]"
                onChange={onToggleAll}
                type="checkbox"
              />
            </th>
            <th className={cell}>{t("columns.reference")}</th>
            <th className={cell}>{t("columns.customer")}</th>
            <th className={cell}>{t("columns.invoice")}</th>
            <th className={cell}>{t("columns.method")}</th>
            <th className={cell}>{t("columns.date")}</th>
            <th className={`${cell} text-right`}>{t("columns.amount")}</th>
            <th className={cell}>{t("columns.reconciliation")}</th>
            <th className={cell}>{t("columns.status")}</th>
            <th className={cell}>{t("columns.next")}</th>
            <th className={cell} />
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const invoice = invoicesById.get(payment.invoiceId);
            const listStatus = paymentListStatus(payment, invoice, ledgerPayments);
            const next = paymentNextAction(payment, invoice, ledgerPayments);
            const checked = selectedIds.includes(payment.id);
            const active = selectedId === payment.id;
            const work = invoice ? workT(invoice.workKey) : "";
            const amount = formatMoneyFromCents(payment.amountCents);

            return (
              <tr
                className={cn("dashboard-list__row", active && "bg-[#eef4ff]")}
                key={payment.id}
              >
                <td className={cn(cell, "relative")}>
                  {active ? (
                    <span className="absolute inset-y-1 left-0 w-0.5 rounded-r-full bg-[#044ce2]" />
                  ) : null}
                  <input
                    aria-label={t("table.selectRow", { id: payment.reference })}
                    checked={checked}
                    className="h-3.5 w-3.5 accent-[#044ce2]"
                    onChange={() => onToggleCheck(payment.id)}
                    type="checkbox"
                  />
                </td>
                <td className={cell}>
                  <button
                    className="dashboard-list__primary dashboard-list__link tabular-nums"
                    onClick={() => onOpen(payment.id)}
                    type="button"
                  >
                    {payment.reference}
                  </button>
                </td>
                <td className={cell}>
                  <span className="dashboard-list__primary" title={invoice?.customerName}>
                    {invoice?.customerName ?? "—"}
                  </span>
                  <span className="dashboard-list__secondary" title={work}>
                    {work}
                  </span>
                </td>
                <td className={cell}>
                  {invoice ? (
                    <button
                      className="dashboard-list__primary dashboard-list__link tabular-nums"
                      onClick={() => onOpenInvoice(invoice.id)}
                      type="button"
                    >
                      {invoiceDisplayNumber(invoice)}
                    </button>
                  ) : (
                    <span className="dashboard-list__secondary">—</span>
                  )}
                </td>
                <td className={cell}>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <PaymentMethodIcon method={payment.method} />
                    <span className="dashboard-list__primary truncate">
                      {t(`methods.${payment.method}`)}
                    </span>
                  </span>
                </td>
                <td className={cell}>
                  <span className="dashboard-list__secondary tabular-nums">
                    {dateFmt.format(new Date(`${payment.date}T00:00:00`))}
                  </span>
                </td>
                <td className={`${cell} text-right`}>
                  <span className="dashboard-list__amount block truncate" title={amount}>
                    {amount}
                  </span>
                </td>
                <td className={cell}>
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: reconciliationDot[payment.reconciliationStatus],
                      }}
                    />
                    <span className="dashboard-list__secondary truncate">
                      {t(`reconciliation.${payment.reconciliationStatus}`)}
                    </span>
                  </span>
                </td>
                <td className={cell}>
                  <StatusBadge
                    className="dashboard-list__badge max-w-full"
                    size="xs"
                    tone={paymentListStatusTone[listStatus]}
                  >
                    {t(`listStatus.${listStatus}`)}
                  </StatusBadge>
                </td>
                <td className={cell}>
                  {next === "none" ? (
                    <span className="dashboard-list__secondary">—</span>
                  ) : (
                    <button
                      className="action-motion soft-button h-7 rounded-[8px] px-2 text-[11px] font-semibold text-[#044ce2]"
                      onClick={() => onNextAction(payment.id)}
                      type="button"
                    >
                      {t(`actions.${next}`)}
                    </button>
                  )}
                </td>
                <td className={cell}>
                  <PaymentRowMenu
                    canReconcile={canReconcile}
                    nextAction={next}
                    onAction={(action) => onMenuAction(payment.id, action)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </DashboardScroll>
  );
}
