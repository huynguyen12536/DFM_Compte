import { seedCustomers, seedQuotes } from "@/features/quotes/seed";

import {
  calculateDueDate,
  type BankTransaction,
  type InvoiceActivity,
  type InvoicePayment,
  type InvoiceRecord,
  type PaymentActivity,
} from "./model";

const COMPANY_ID = "co-dfm-europe";

function quoteById(id: string) {
  const quote = seedQuotes.find((item) => item.id === id);
  if (!quote) {
    throw new Error(`Invoice seed missing quote ${id}`);
  }
  return quote;
}

function customerName(customerId: string) {
  return seedCustomers.find((item) => item.id === customerId)?.name ?? customerId;
}

function activity(
  id: string,
  at: string,
  kind: InvoiceActivity["kind"],
  actorName: string,
  quoteId?: string,
): InvoiceActivity {
  return { id, at, kind, actorName, quoteId };
}

function fromQuote(
  quoteId: string,
  extras: Omit<
    InvoiceRecord,
    | "quoteId"
    | "customerId"
    | "customerName"
    | "ownerId"
    | "workKey"
    | "currency"
    | "vatRate"
    | "lines"
    | "companyId"
    | "dueDate"
  > & { dueDate?: string },
): InvoiceRecord {
  const quote = quoteById(quoteId);
  const issueDate = extras.issueDate;
  const paymentTerms = extras.paymentTerms;
  return {
    ...extras,
    quoteId,
    customerId: quote.customerId,
    customerName: customerName(quote.customerId),
    ownerId: quote.ownerId,
    workKey: quote.workKey,
    companyId: COMPANY_ID,
    currency: "EUR",
    vatRate: quote.vatRate,
    lines: quote.lines.map((line) => ({ ...line })),
    dueDate: extras.dueDate ?? calculateDueDate(issueDate, paymentTerms),
  };
}

export const seedInvoices: InvoiceRecord[] = [
  fromQuote("DEV20260145", {
    id: "inv-DEV20260145",
    temporaryNumber: "DRAFT-2026-001",
    status: "draft",
    paymentStatus: "unpaid",
    issueDate: "2026-10-01",
    paymentTerms: "net_30",
    poNumber: "PO-4501",
    reference: "Mission conseil — phase 1",
    createdAt: "2026-10-01T09:10:00.000Z",
    updatedAt: "2026-10-01T09:10:00.000Z",
    activity: [
      activity("ia-d1", "2026-10-01T09:10:00.000Z", "created", "Léa Bernard", "DEV20260145"),
    ],
  }),
  fromQuote("DEV20260134", {
    id: "inv-DEV20260134",
    temporaryNumber: "DRAFT-2026-002",
    status: "draft",
    paymentStatus: "unpaid",
    issueDate: "2026-10-02",
    paymentTerms: "net_30",
    reference: "Ventilation — préparation",
    createdAt: "2026-10-02T08:20:00.000Z",
    updatedAt: "2026-10-02T08:20:00.000Z",
    activity: [
      activity("ia-d2", "2026-10-02T08:20:00.000Z", "created", "France Morel", "DEV20260134"),
    ],
  }),
  fromQuote("DEV20260144", {
    id: "inv-DEV20260144",
    temporaryNumber: "DRAFT-2026-003",
    status: "to_validate",
    paymentStatus: "unpaid",
    issueDate: "2026-09-28",
    paymentTerms: "net_45",
    poNumber: "PO-4410",
    reference: "Façade pierre",
    createdAt: "2026-09-28T11:00:00.000Z",
    updatedAt: "2026-10-01T16:40:00.000Z",
    activity: [
      activity("ia-tv1", "2026-09-28T11:00:00.000Z", "created", "Marie Dupont", "DEV20260144"),
      activity("ia-tv2", "2026-10-01T16:40:00.000Z", "updated", "Marie Dupont"),
    ],
  }),
  fromQuote("DEV20260146", {
    id: "inv-DEV20260146",
    number: "FAC20260020",
    temporaryNumber: "DRAFT-2026-004",
    status: "sent",
    paymentStatus: "partial",
    issueDate: "2026-09-22",
    paymentTerms: "net_30",
    poNumber: "PO-4602",
    reference: "Éclairage bureaux",
    lockedAt: "2026-09-23T10:15:00.000Z",
    createdAt: "2026-09-22T09:00:00.000Z",
    updatedAt: "2026-09-23T10:18:00.000Z",
    activity: [
      activity("ia-s1", "2026-09-22T09:00:00.000Z", "created", "France Morel", "DEV20260146"),
      activity("ia-s2", "2026-09-23T10:15:00.000Z", "validated", "Léa Bernard"),
      activity("ia-s3", "2026-09-23T10:18:00.000Z", "sent", "Léa Bernard"),
      activity("ia-s3p", "2026-10-01T10:05:00.000Z", "payment", "France Morel"),
    ],
  }),
  fromQuote("DEV20260139", {
    id: "inv-DEV20260139",
    number: "FAC20260021",
    temporaryNumber: "DRAFT-2026-005",
    status: "sent",
    paymentStatus: "unpaid",
    issueDate: "2026-09-26",
    paymentTerms: "net_15",
    reference: "Audit d'espace",
    lockedAt: "2026-09-26T14:00:00.000Z",
    createdAt: "2026-09-26T13:40:00.000Z",
    updatedAt: "2026-09-26T14:05:00.000Z",
    activity: [
      activity("ia-s4", "2026-09-26T13:40:00.000Z", "created", "France Morel", "DEV20260139"),
      activity("ia-s5", "2026-09-26T14:00:00.000Z", "validated", "Léa Bernard"),
      activity("ia-s6", "2026-09-26T14:05:00.000Z", "sent", "System"),
    ],
  }),
  fromQuote("DEV20260138", {
    id: "inv-DEV20260138",
    number: "FAC20260022",
    temporaryNumber: "DRAFT-2026-006",
    status: "sent",
    paymentStatus: "partial",
    issueDate: "2026-09-08",
    paymentTerms: "net_60",
    poNumber: "PO-3808",
    reference: "Façade vitrée — acompte",
    lockedAt: "2026-09-09T09:30:00.000Z",
    createdAt: "2026-09-08T16:00:00.000Z",
    updatedAt: "2026-09-20T11:10:00.000Z",
    activity: [
      activity("ia-p1", "2026-09-08T16:00:00.000Z", "created", "Jean Martin", "DEV20260138"),
      activity("ia-p2", "2026-09-09T09:30:00.000Z", "validated", "Léa Bernard"),
      activity("ia-p3", "2026-09-20T11:10:00.000Z", "payment", "Léa Bernard"),
      activity("ia-p4", "2026-09-28T09:20:00.000Z", "payment", "Léa Bernard"),
    ],
  }),
  fromQuote("DEV20260130", {
    id: "inv-DEV20260130",
    number: "FAC20260023",
    temporaryNumber: "DRAFT-2026-007",
    status: "sent",
    paymentStatus: "paid",
    issueDate: "2026-09-14",
    paymentTerms: "net_30",
    reference: "Luminaires",
    lockedAt: "2026-09-15T08:45:00.000Z",
    createdAt: "2026-09-14T10:00:00.000Z",
    updatedAt: "2026-10-01T15:00:00.000Z",
    activity: [
      activity("ia-pd1", "2026-09-14T10:00:00.000Z", "created", "Léa Bernard", "DEV20260130"),
      activity("ia-pd2", "2026-09-15T08:45:00.000Z", "validated", "Léa Bernard"),
      activity("ia-pd3", "2026-10-01T15:00:00.000Z", "payment", "Léa Bernard"),
    ],
  }),
  fromQuote("DEV20260147", {
    id: "inv-DEV20260147",
    number: "FAC20260027",
    temporaryNumber: "DRAFT-2026-008",
    status: "sent",
    paymentStatus: "paid",
    issueDate: "2026-09-30",
    dueDate: "2026-10-30",
    paymentTerms: "net_30",
    poNumber: "PO-7783",
    reference: "Exhibition space renovation",
    lockedAt: "2026-10-02T09:42:00.000Z",
    createdAt: "2026-10-02T09:15:00.000Z",
    updatedAt: "2026-10-02T14:20:00.000Z",
    activity: [
      activity("ia-ml1", "2026-10-02T09:15:00.000Z", "created", "Jean Martin", "DEV20260147"),
      activity("ia-ml2", "2026-10-02T09:42:00.000Z", "validated", "Léa Bernard"),
      activity("ia-ml3", "2026-10-02T09:45:00.000Z", "sent", "Léa Bernard"),
      activity("ia-ml4", "2026-10-02T14:20:00.000Z", "payment", "Léa Bernard"),
    ],
  }),
  fromQuote("DEV20260132", {
    id: "inv-DEV20260132",
    number: "FAC20260018",
    temporaryNumber: "DRAFT-2026-009",
    status: "sent",
    paymentStatus: "overdue",
    issueDate: "2026-07-22",
    paymentTerms: "net_30",
    reference: "Étude de faisabilité",
    lockedAt: "2026-07-23T09:00:00.000Z",
    createdAt: "2026-07-22T11:20:00.000Z",
    updatedAt: "2026-07-23T09:00:00.000Z",
    activity: [
      activity("ia-o1", "2026-07-22T11:20:00.000Z", "created", "Marie Dupont", "DEV20260132"),
      activity("ia-o2", "2026-07-23T09:00:00.000Z", "validated", "Léa Bernard"),
    ],
  }),
  fromQuote("DEV20260140", {
    id: "inv-DEV20260140",
    number: "FAC20260019",
    temporaryNumber: "DRAFT-2026-010",
    status: "sent",
    paymentStatus: "overdue",
    issueDate: "2026-08-02",
    paymentTerms: "net_30",
    poNumber: "PO-4011",
    reference: "Aménagement open space",
    lockedAt: "2026-08-03T10:00:00.000Z",
    createdAt: "2026-08-02T09:40:00.000Z",
    updatedAt: "2026-08-03T10:00:00.000Z",
    activity: [
      activity("ia-o3", "2026-08-02T09:40:00.000Z", "created", "Marie Dupont", "DEV20260140"),
      activity("ia-o4", "2026-08-03T10:00:00.000Z", "validated", "Léa Bernard"),
    ],
  }),
];

export const seedPayments: InvoicePayment[] = [
  {
    id: "pay-2026-014",
    invoiceId: "inv-DEV20260138",
    reference: "PAY-2026-014",
    date: "2026-09-20",
    amountCents: 1_200_000,
    method: "transfer",
    status: "completed",
    reconciliationStatus: "matched",
    bankTransactionId: "btx-matched-014",
    bankReference: "VIR RIVAGE 2026-09-20",
  },
  {
    id: "pay-2026-018",
    invoiceId: "inv-DEV20260130",
    reference: "PAY-2026-018",
    date: "2026-10-01",
    amountCents: 1_422_000,
    method: "transfer",
    status: "completed",
    reconciliationStatus: "matched",
    bankTransactionId: "btx-matched-018",
    bankReference: "VIR ATELIER BLEU 2026-10-01",
  },
  {
    id: "pay-2026-019",
    invoiceId: "inv-DEV20260147",
    reference: "PAY-2026-019",
    date: "2026-10-02",
    amountCents: 860_000,
    method: "transfer",
    status: "completed",
    reconciliationStatus: "matched",
    bankTransactionId: "btx-matched-019",
    bankReference: "VIR MAISON LUMIERE 2026-10-02",
  },
  {
    id: "pay-2026-040",
    invoiceId: "inv-DEV20260146",
    reference: "PAY-2026-040",
    date: "2026-10-01",
    amountCents: 500_000,
    method: "card",
    status: "completed",
    reconciliationStatus: "matched",
    notes: "First instalment on lighting works.",
  },
  {
    id: "pay-2026-041",
    invoiceId: "inv-DEV20260138",
    reference: "PAY-2026-041",
    date: "2026-09-28",
    amountCents: 400_000,
    method: "direct_debit",
    status: "completed",
    reconciliationStatus: "matched",
  },
];

/**
 * Demo bank import only. Not Open Banking sync, Stripe settlement, or AI matching.
 */
export const seedBankTransactions: BankTransaction[] = [
  {
    id: "btx-matched-014",
    amountCents: 1_200_000,
    date: "2026-09-20",
    label: "VIR RIVAGE FAC20260022",
    companyId: COMPANY_ID,
    status: "matched",
    matchedInvoiceId: "inv-DEV20260138",
    matchedPaymentId: "pay-2026-014",
  },
  {
    id: "btx-matched-018",
    amountCents: 1_422_000,
    date: "2026-10-01",
    label: "VIR ATELIER BLEU FAC20260023",
    companyId: COMPANY_ID,
    status: "matched",
    matchedInvoiceId: "inv-DEV20260130",
    matchedPaymentId: "pay-2026-018",
  },
  {
    id: "btx-matched-019",
    amountCents: 860_000,
    date: "2026-10-02",
    label: "VIR MAISON LUMIERE FAC20260027",
    companyId: COMPANY_ID,
    status: "matched",
    matchedInvoiceId: "inv-DEV20260147",
    matchedPaymentId: "pay-2026-019",
  },
  {
    id: "btx-unmatched-021",
    amountCents: 325_000,
    date: "2026-10-01",
    label: "VIR DELTA SERVICES AUDIT",
    companyId: COMPANY_ID,
    status: "unmatched",
    suggestedInvoiceId: "inv-DEV20260139",
  },
  {
    id: "btx-review-nord",
    amountCents: 186_000,
    date: "2026-09-29",
    label: "VIR SAS NORD — REF 8841",
    companyId: COMPANY_ID,
    status: "needs_review",
  },
  {
    id: "btx-unmatched-018",
    amountCents: 412_000,
    date: "2026-10-02",
    label: "VIR INCONNU — FAC possible",
    companyId: COMPANY_ID,
    status: "unmatched",
    suggestedInvoiceId: "inv-DEV20260132",
  },
];

export const seedPaymentActivities: PaymentActivity[] = [
  {
    id: "pa-014",
    at: "2026-09-20T11:10:00.000Z",
    kind: "recorded",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-014",
    invoiceId: "inv-DEV20260138",
    invoiceNumber: "FAC20260022",
    amountCents: 1_200_000,
    customerName: "Rivage",
  },
  {
    id: "pa-014-match",
    at: "2026-09-20T11:14:00.000Z",
    kind: "matched",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-014",
    invoiceId: "inv-DEV20260138",
    invoiceNumber: "FAC20260022",
    bankTransactionId: "btx-matched-014",
    amountCents: 1_200_000,
    customerName: "Rivage",
  },
  {
    id: "pa-041",
    at: "2026-09-28T09:20:00.000Z",
    kind: "recorded",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-041",
    invoiceId: "inv-DEV20260138",
    invoiceNumber: "FAC20260022",
    amountCents: 400_000,
    customerName: "Rivage",
  },
  {
    id: "pa-040",
    at: "2026-10-01T10:05:00.000Z",
    kind: "recorded",
    actorName: "France Morel",
    paymentId: "pay-2026-040",
    invoiceId: "inv-DEV20260146",
    invoiceNumber: "FAC20260020",
    amountCents: 500_000,
    customerName: "Groupe Horizon",
  },
  {
    id: "pa-018",
    at: "2026-10-01T15:00:00.000Z",
    kind: "recorded",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-018",
    invoiceId: "inv-DEV20260130",
    invoiceNumber: "FAC20260023",
    amountCents: 1_422_000,
    customerName: "Atelier Bleu",
  },
  {
    id: "pa-018-paid",
    at: "2026-10-01T15:01:00.000Z",
    kind: "invoice_paid",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-018",
    invoiceId: "inv-DEV20260130",
    invoiceNumber: "FAC20260023",
    amountCents: 1_422_000,
    customerName: "Atelier Bleu",
  },
  {
    id: "pa-019",
    at: "2026-10-02T14:20:00.000Z",
    kind: "recorded",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-019",
    invoiceId: "inv-DEV20260147",
    invoiceNumber: "FAC20260027",
    amountCents: 860_000,
    customerName: "Maison Lumière",
  },
  {
    id: "pa-019-paid",
    at: "2026-10-02T14:21:00.000Z",
    kind: "invoice_paid",
    actorName: "Léa Bernard",
    paymentId: "pay-2026-019",
    invoiceId: "inv-DEV20260147",
    invoiceNumber: "FAC20260027",
    amountCents: 860_000,
    customerName: "Maison Lumière",
  },
];
