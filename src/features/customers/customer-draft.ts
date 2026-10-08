import { composePhone, parsePhoneValue } from "./countries";
import type {
  CustomerRecord,
  CustomerType,
  PaymentMethod,
  PaymentTerms,
} from "./types";

function normalizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const parsed = parsePhoneValue(trimmed);
  return composePhone(parsed.code, parsed.national);
}

export type CustomerDraft = {
  type: CustomerType;
  displayName: string;
  legalName: string;
  siret: string;
  vatNumber: string;
  email: string;
  phone: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingLine1: string;
  billingLine2: string;
  billingCity: string;
  billingPostalCode: string;
  billingCountry: string;
  billingCountryCode: string;
  deliveryLine1: string;
  deliveryLine2: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
  deliveryCountryCode: string;
  useBillingForDelivery: boolean;
  paymentTerms: PaymentTerms;
  paymentMethod: PaymentMethod;
  defaultQuoteTemplate: string;
  ownerId: string;
  tags: string[];
  siretFilled: boolean;
  contacts: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    primary: boolean;
  }>;
};

export function initialCustomerDraft(ownerId: string): CustomerDraft {
  return {
    type: "company",
    displayName: "",
    legalName: "",
    siret: "",
    vatNumber: "",
    email: "",
    phone: "",
    website: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    billingLine1: "",
    billingLine2: "",
    billingCity: "",
    billingPostalCode: "",
    billingCountry: "France",
    billingCountryCode: "FR",
    deliveryLine1: "",
    deliveryLine2: "",
    deliveryCity: "",
    deliveryPostalCode: "",
    deliveryCountry: "France",
    deliveryCountryCode: "FR",
    useBillingForDelivery: true,
    paymentTerms: "net_30",
    paymentMethod: "transfer",
    defaultQuoteTemplate: "standard",
    ownerId,
    tags: [],
    siretFilled: false,
    contacts: [],
  };
}

export function recordToDraft(customer: CustomerRecord): CustomerDraft {
  const contact = customer.contacts.find((item) => item.primary) ?? customer.contacts[0];
  const billing =
    customer.addresses.find((item) => item.type === "billing" && item.primary) ??
    customer.addresses.find((item) => item.type === "billing") ??
    customer.addresses[0];
  const delivery = customer.addresses.find((item) => item.type === "delivery");
  const sameDelivery =
    !delivery ||
    (delivery.line1 === billing?.line1 &&
      delivery.city === billing?.city &&
      delivery.postalCode === billing?.postalCode);

  return {
    type: customer.type,
    displayName: customer.displayName,
    legalName: customer.legalName ?? "",
    siret: customer.siret ?? "",
    vatNumber: customer.vatNumber ?? "",
    email: customer.email,
    phone: customer.phone ?? "",
    website: customer.website ?? "",
    contactName: contact?.name ?? "",
    contactEmail: contact?.email ?? "",
    contactPhone: contact?.phone ?? "",
    billingLine1: billing?.line1 ?? "",
    billingLine2: billing?.line2 ?? "",
    billingCity: billing?.city ?? "",
    billingPostalCode: billing?.postalCode ?? "",
    billingCountry: billing?.country ?? "France",
    billingCountryCode: billing?.countryCode ?? "FR",
    deliveryLine1: delivery?.line1 ?? "",
    deliveryLine2: delivery?.line2 ?? "",
    deliveryCity: delivery?.city ?? "",
    deliveryPostalCode: delivery?.postalCode ?? "",
    deliveryCountry: delivery?.country ?? "France",
    deliveryCountryCode: delivery?.countryCode ?? "FR",
    useBillingForDelivery: sameDelivery,
    paymentTerms: customer.paymentTerms,
    paymentMethod: customer.paymentMethod,
    defaultQuoteTemplate: customer.defaultQuoteTemplate,
    ownerId: customer.ownerId,
    tags: [...customer.tags],
    siretFilled: Boolean(customer.siret),
    contacts: customer.contacts.map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      primary: item.primary,
    })),
  };
}

export type CustomerDraftSaveField = "displayName" | "legalName" | "email" | "website";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getCustomerDraftSaveIssues(draft: CustomerDraft): CustomerDraftSaveField[] {
  const issues: CustomerDraftSaveField[] = [];
  if (!draft.displayName.trim()) issues.push("displayName");
  if (draft.type === "company" && !draft.legalName.trim()) issues.push("legalName");
  if (!draft.email.trim() || !EMAIL_RE.test(draft.email.trim())) issues.push("email");
  if (draft.website.trim()) {
    try {
      // Accept bare domains by prefixing for validation only.
      const candidate = /^https?:\/\//i.test(draft.website.trim())
        ? draft.website.trim()
        : `https://${draft.website.trim()}`;
      new URL(candidate);
    } catch {
      issues.push("website");
    }
  }
  return issues;
}

export function canSaveCustomerDraft(draft: CustomerDraft) {
  return getCustomerDraftSaveIssues(draft).length === 0;
}

export function buildCustomerRecord(
  draft: CustomerDraft,
  customer?: CustomerRecord | null,
): CustomerRecord {
  const now = new Date().toISOString();
  const id = customer?.id ?? `cust-${Date.now()}`;
  const billing = {
    id: customer?.addresses.find((item) => item.type === "billing")?.id ?? `${id}-bill`,
    type: "billing" as const,
    line1: draft.billingLine1 || "—",
    line2: draft.billingLine2 || undefined,
    city: draft.billingCity || "—",
    postalCode: draft.billingPostalCode || "—",
    country: draft.billingCountry,
    countryCode: draft.billingCountryCode,
    primary: true,
  };
  const deliveryId =
    customer?.addresses.find((item) => item.type === "delivery")?.id ?? `${id}-del`;
  const delivery = draft.useBillingForDelivery
    ? { ...billing, id: deliveryId, type: "delivery" as const }
    : {
        id: deliveryId,
        type: "delivery" as const,
        line1: draft.deliveryLine1 || "—",
        line2: draft.deliveryLine2 || undefined,
        city: draft.deliveryCity || "—",
        postalCode: draft.deliveryPostalCode || "—",
        country: draft.deliveryCountry,
        countryCode: draft.deliveryCountryCode,
        primary: true,
      };

  const contacts =
    draft.contacts.length > 0
      ? draft.contacts.map((item, index) => ({
          ...item,
          name: item.name.trim() || draft.displayName.trim(),
          email: item.email.trim() || draft.email.trim(),
          phone: normalizePhone(item.phone) || normalizePhone(draft.phone) || "—",
          primary: item.primary || (index === 0 && !draft.contacts.some((c) => c.primary)),
        }))
      : [
          {
            id: customer?.contacts[0]?.id ?? `${id}-ct`,
            name: draft.contactName.trim() || draft.displayName.trim(),
            email: draft.contactEmail.trim() || draft.email.trim(),
            phone: normalizePhone(draft.contactPhone) || normalizePhone(draft.phone) || "—",
            primary: true,
          },
        ];

  return {
    id,
    type: draft.type,
    status: customer?.status ?? "active",
    displayName: draft.displayName.trim(),
    legalName: draft.type === "company" ? draft.legalName.trim() : undefined,
    siret: draft.type === "company" ? draft.siret.trim() || undefined : undefined,
    vatNumber: draft.type === "company" ? draft.vatNumber.trim() || undefined : undefined,
    email: draft.email.trim(),
    phone: normalizePhone(draft.phone) || undefined,
    website: draft.website.trim() || undefined,
    ownerId: draft.ownerId,
    paymentTerms: draft.paymentTerms,
    paymentMethod: draft.paymentMethod,
    defaultQuoteTemplate: draft.defaultQuoteTemplate,
    tags: draft.tags,
    contacts,
    addresses: [billing, delivery],
    notes: customer?.notes ?? [],
    activity: customer
      ? [
          {
            id: `${id}-ac-${Date.now()}`,
            kind: "customer_updated" as const,
            at: now,
            title: "Customer information updated",
            summary: "Customer information updated",
            description: "Identity, contacts or commercial settings were saved.",
            actorName: "You",
          },
          ...customer.activity,
        ]
      : [
          {
            id: `${id}-ac`,
            kind: "customer_created" as const,
            at: now,
            title: "Customer created",
            summary: "Customer created",
            description: "Customer record added to the workspace.",
            actorName: "You",
          },
        ],
    quotes: customer?.quotes ?? [],
    invoices: customer?.invoices ?? [],
    payments: customer?.payments ?? [],
    sharedWithOwnerIds: customer?.sharedWithOwnerIds ?? [],
    revenueCents: customer?.revenueCents ?? 0,
    lastActivityAt: now,
    createdAt: customer?.createdAt ?? now,
    updatedAt: now,
    possibleDuplicate: customer?.possibleDuplicate,
  };
}

export function draftsEqual(a: CustomerDraft, b: CustomerDraft) {
  return JSON.stringify(a) === JSON.stringify(b);
}
