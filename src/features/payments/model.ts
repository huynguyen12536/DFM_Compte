import {
  derivePaymentStatus,
  remainingCentsFor,
  type InvoicePayment,
  type InvoicePaymentMethod,
  type InvoiceRecord,
  type PaymentReconciliationStatus,
} from "@/features/invoices/model";
import { ledgerToday } from "@/features/quotes/model";

export type PaymentListStatus = "paid" | "partial" | "to_match" | "failed";

export type PaymentNextAction = "none" | "view" | "match" | "review";

export type PaymentSortPreset = "newest" | "oldest" | "highest" | "lowest";

export type PaymentFilters = {
  query: string;
  status: PaymentListStatus | "all";
  method: InvoicePaymentMethod | "all";
  customerId: string | null;
  invoiceId: string | null;
  datePreset: "any" | "month" | "quarter";
  reconciliation: PaymentReconciliationStatus | "all";
};

export const emptyPaymentFilters: PaymentFilters = {
  query: "",
  status: "all",
  method: "all",
  customerId: null,
  invoiceId: null,
  datePreset: "any",
  reconciliation: "all",
};

export const PAYMENT_STATUS_FILTERS: Array<PaymentListStatus | "all"> = [
  "all",
  "paid",
  "partial",
  "to_match",
  "failed",
];

export const PAYMENT_METHOD_ORDER: InvoicePaymentMethod[] = [
  "transfer",
  "card",
  "direct_debit",
  "cash",
  "check",
];

export function paymentListStatus(
  payment: InvoicePayment,
  invoice: InvoiceRecord | undefined,
  payments: InvoicePayment[],
): PaymentListStatus {
  if (payment.status === "failed") return "failed";
  if (payment.reconciliationStatus === "to_match" || payment.status === "pending") {
    return "to_match";
  }
  if (!invoice) return "paid";
  const invoiceStatus = derivePaymentStatus(invoice, payments, ledgerToday);
  if (invoiceStatus === "partial") return "partial";
  return "paid";
}

export function paymentNextAction(
  payment: InvoicePayment,
  invoice: InvoiceRecord | undefined,
  payments: InvoicePayment[],
): PaymentNextAction {
  const status = paymentListStatus(payment, invoice, payments);
  if (status === "failed") return "review";
  if (status === "to_match") return "match";
  if (status === "partial") return "view";
  return "none";
}

export function invoiceRemaining(invoice: InvoiceRecord, payments: InvoicePayment[]) {
  return remainingCentsFor(invoice, payments);
}
