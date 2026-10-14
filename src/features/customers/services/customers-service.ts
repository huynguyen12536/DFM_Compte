import { mockCustomers } from "../mocks/customers";
import { customerOwners } from "../mocks/owners";
import {
  deriveCustomerKpis,
  filterCustomers,
  findDuplicateCandidates,
} from "../query";
import type { CustomerFilters, CustomerRecord, CsvImportRow } from "../types";

const LEGACY_SESSION_KEY = "compte.customers-store.v1";

/** Clear any leftover session persistence from earlier demos (no ongoing persist). */
export function clearLegacyCustomerPersistence() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LEGACY_SESSION_KEY);
    window.localStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    // ignore storage access errors
  }
}

/** Immutable seed for FE demo state — always clone before use. */
export function getInitialCustomers(): CustomerRecord[] {
  return structuredClone(mockCustomers);
}

export function listCustomerOwners() {
  return customerOwners;
}

export function listCustomersFrom(
  customers: CustomerRecord[],
  filters: CustomerFilters,
) {
  return filterCustomers(customers, filters);
}

export function getCustomerByIdFrom(customers: CustomerRecord[], id: string) {
  return customers.find((customer) => customer.id === id) ?? null;
}

export function getCustomerKpisFrom(
  customers: CustomerRecord[],
  filters: CustomerFilters,
) {
  return deriveCustomerKpis(filterCustomers(customers, filters));
}

export function createCustomerIn(
  customers: CustomerRecord[],
  input: CustomerRecord,
): CustomerRecord[] {
  return [input, ...customers.filter((customer) => customer.id !== input.id)];
}

export function updateCustomerIn(
  customers: CustomerRecord[],
  id: string,
  patch: Partial<CustomerRecord>,
): CustomerRecord[] {
  const now = new Date().toISOString();
  return customers.map((customer) =>
    customer.id === id
      ? {
          ...customer,
          ...patch,
          id,
          updatedAt: now,
          lastActivityAt: patch.lastActivityAt ?? now,
        }
      : customer,
  );
}

export function detectDuplicatesIn(
  customers: CustomerRecord[],
  draft: Parameters<typeof findDuplicateCandidates>[1],
  excludeId?: string,
) {
  return findDuplicateCandidates(customers, draft, excludeId);
}

export function previewCsvImport(): CsvImportRow[] {
  return [
    {
      id: "csv-1",
      name: "Horizon Digital",
      email: "hello@horizon-digital.fr",
      type: "company",
      status: "valid",
    },
    {
      id: "csv-2",
      name: "TechVision SARL",
      email: "contact@techvision.fr",
      type: "company",
      status: "duplicate",
      message: "Matches existing SIRET / email",
    },
    {
      id: "csv-3",
      name: "Missing Email Co",
      email: "",
      type: "company",
      status: "error",
      message: "Email is required",
    },
    {
      id: "csv-4",
      name: "Soft Labels",
      email: "team@softlabels.io",
      type: "company",
      status: "valid",
      message: "VAT format looks unusual",
    },
  ];
}
