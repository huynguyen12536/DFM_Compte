"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SoftSelect } from "@/components/compte/soft-select";
import { FormSheet } from "@/components/forms/form-sheet";
import {
  invoiceDisplayNumber,
  remainingCentsFor,
  type BankTransaction,
  type InvoicePayment,
  type InvoiceRecord,
} from "@/features/invoices/model";
import { formatMoneyFromCents } from "@/lib/money";

export function ReviewMatchSheet({
  open,
  transaction,
  invoices,
  payments,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  transaction: BankTransaction | null;
  invoices: InvoiceRecord[];
  payments: InvoicePayment[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (invoiceId: string) => void;
}) {
  const t = useTranslations("payments.review");
  const [invoiceId, setInvoiceId] = useState(invoices[0]?.id ?? "");

  const options = useMemo(
    () =>
      invoices.map((item) => ({
        value: item.id,
        label: `${invoiceDisplayNumber(item)} · ${item.customerName} · ${formatMoneyFromCents(remainingCentsFor(item, payments))}`,
      })),
    [invoices, payments],
  );

  return (
    <FormSheet
      closeLabel={t("cancel")}
      footer={
        invoices.length === 0 ? null : (
          <div className="flex justify-end gap-2">
            <button
              className="action-motion soft-button min-h-10 rounded-[10px] px-3 text-sm font-semibold text-[#516078]"
              onClick={onClose}
              type="button"
            >
              {t("cancel")}
            </button>
            <button
              aria-busy={saving}
              className="action-motion soft-primary min-h-10 rounded-[10px] px-3 text-sm font-semibold text-white disabled:opacity-40"
              disabled={saving || !invoiceId}
              onClick={() => onConfirm(invoiceId)}
              type="button"
            >
              {saving ? t("saving") : t("confirm")}
            </button>
          </div>
        )
      }
      open={open}
      title={t("title")}
      widthClassName="sm:max-w-[520px]"
      zIndexClassName="z-[70]"
      onClose={onClose}
    >
      {!transaction ? null : invoices.length === 0 ? (
        <p className="py-6 text-center text-xs text-[#7d8aa0]">{t("noInvoices")}</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[#24334c]">
            {t("bank", { amount: formatMoneyFromCents(transaction.amountCents) })}
          </p>
          <p className="text-[11px] text-[#7d8aa0]">{transaction.label}</p>
          <SoftSelect
            label={t("invoice")}
            options={options}
            value={invoiceId}
            onChange={setInvoiceId}
          />
          {error ? <p className="text-xs font-medium text-[#c9564f]">{error}</p> : null}
        </div>
      )}
    </FormSheet>
  );
}
