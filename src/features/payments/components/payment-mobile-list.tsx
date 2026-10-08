"use client";

import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/dashboard/tone";
import {
  invoiceDisplayNumber,
  type InvoicePayment,
  type InvoiceRecord,
} from "@/features/invoices/model";
import { formatMoneyFromCents } from "@/lib/money";

import { paymentListStatus, paymentNextAction } from "../model";
import { paymentListStatusTone, reconciliationDot } from "../status";
import { PaymentMethodIcon } from "./payment-method-icon";
import { PaymentRowMenu, type PaymentMenuAction } from "./payment-row-menu";

export function PaymentMobileList({
  payments,
  ledgerPayments,
  invoicesById,
  canReconcile,
  onOpen,
  onNextAction,
  onMenuAction,
}: {
  payments: InvoicePayment[];
  ledgerPayments: InvoicePayment[];
  invoicesById: Map<string, InvoiceRecord>;
  canReconcile: boolean;
  onOpen: (id: string) => void;
  onNextAction: (id: string) => void;
  onMenuAction: (id: string, action: PaymentMenuAction) => void;
}) {
  const t = useTranslations("payments");
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 lg:hidden">
      {payments.map((payment) => {
        const invoice = invoicesById.get(payment.invoiceId);
        const listStatus = paymentListStatus(payment, invoice, ledgerPayments);
        const next = paymentNextAction(payment, invoice, ledgerPayments);
        const amount = formatMoneyFromCents(payment.amountCents);

        return (
          <li className="dashboard-card px-3 py-3" key={payment.id}>
            <div className="flex items-start justify-between gap-2">
              <button
                className="dashboard-list__primary dashboard-list__link text-left tabular-nums"
                onClick={() => onOpen(payment.id)}
                type="button"
              >
                {payment.reference}
              </button>
              <StatusBadge size="xs" tone={paymentListStatusTone[listStatus]}>
                {t(`listStatus.${listStatus}`)}
              </StatusBadge>
            </div>
            <p className="dashboard-list__primary mt-1.5 truncate">
              {invoice?.customerName ?? "—"}
            </p>
            <p className="dashboard-list__secondary mt-0.5 tabular-nums">
              {invoice ? invoiceDisplayNumber(invoice) : "—"}
            </p>
            <strong className="dashboard-list__amount mt-1 block">{amount}</strong>
            <p className="dashboard-list__secondary mt-1 inline-flex items-center gap-1.5">
              <PaymentMethodIcon method={payment.method} />
              {t(`methods.${payment.method}`)}
            </p>
            <p className="dashboard-list__secondary mt-1">
              {dateFmt.format(new Date(`${payment.date}T00:00:00`))}
              <span className="mx-1.5 text-[#c5ceda]">·</span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: reconciliationDot[payment.reconciliationStatus] }}
                />
                {t(`reconciliation.${payment.reconciliationStatus}`)}
              </span>
            </p>
            <div className="mt-2 flex items-center justify-end gap-1.5">
              {next !== "none" ? (
                <button
                  className="action-motion soft-button h-8 rounded-[8px] px-2.5 text-xs font-semibold text-[#044ce2]"
                  onClick={() => onNextAction(payment.id)}
                  type="button"
                >
                  {t(`actions.${next}`)}
                </button>
              ) : (
                <button
                  className="action-motion soft-button h-8 rounded-[8px] px-2.5 text-xs font-semibold text-[#044ce2]"
                  onClick={() => onOpen(payment.id)}
                  type="button"
                >
                  {t("actions.view")}
                </button>
              )}
              <PaymentRowMenu
                canReconcile={canReconcile}
                nextAction={next}
                onAction={(action) => onMenuAction(payment.id, action)}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
