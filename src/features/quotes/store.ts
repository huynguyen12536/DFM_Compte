"use client";

import { useSyncExternalStore } from "react";

import { owners, seedCustomers, seedQuotes } from "./seed";
import type { CustomerRecord, QuoteRecord, SavedView } from "./model";

const storageKey = "compte.quote-ledger";

type LedgerState = {
  quotes: QuoteRecord[];
  customers: CustomerRecord[];
  customViews: SavedView[];
};

const serverState: LedgerState = {
  quotes: seedQuotes,
  customers: seedCustomers,
  customViews: [],
};

let state = serverState;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(storageKey, JSON.stringify(state));
  }
}

export function hydrateLedger() {
  if (typeof window === "undefined" || hydrated) return;
  hydrated = true;
  const raw = window.sessionStorage.getItem(storageKey);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as LedgerState;
      if (Array.isArray(parsed.quotes) && Array.isArray(parsed.customers)) {
        state = {
          quotes: parsed.quotes,
          customers: parsed.customers,
          customViews: Array.isArray(parsed.customViews) ? parsed.customViews : [],
        };
      }
    } catch {
      window.sessionStorage.removeItem(storageKey);
    }
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return serverState;
}

export function useLedger() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useHydrated() {
  return useSyncExternalStore(subscribe, () => hydrated, () => false);
}

export function addCustomer(name: string) {
  const id = `customer-${Date.now()}`;
  const customer = { id, name: name.trim() };
  state = { ...state, customers: [customer, ...state.customers] };
  emit();
  return customer;
}

export function addQuote(input: {
  customerId: string;
  ownerId: string;
  validUntil: string;
}) {
  const numeric = state.quotes.reduce((max, quote) => {
    const value = Number(quote.id.replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 20260100);
  const id = `DEV${numeric + 1}`;
  const quote: QuoteRecord = {
    id,
    customerId: input.customerId,
    workKey: "work.consulting",
    ownerId: input.ownerId,
    status: "draft",
    validUntil: input.validUntil,
    vatRate: 20,
    lines: [],
    createdAt: "2026-10-02",
    activity: [
      {
        id: `${id}-created`,
        at: "2026-10-02",
        messageKey: "activity.quoteCreated",
        values: {
          name: owners.find((owner) => owner.id === input.ownerId)?.name ?? "",
          id,
        },
      },
    ],
  };
  state = { ...state, quotes: [quote, ...state.quotes] };
  emit();
  return quote;
}

export function updateQuote(id: string, patch: Partial<QuoteRecord>) {
  state = {
    ...state,
    quotes: state.quotes.map((quote) => (quote.id === id ? { ...quote, ...patch } : quote)),
  };
  emit();
}

export function saveCustomView(view: SavedView) {
  state = { ...state, customViews: [view, ...state.customViews.filter((item) => item.id !== view.id)] };
  emit();
}

export function restoreSeed() {
  state = {
    quotes: seedQuotes,
    customers: seedCustomers,
    customViews: [],
  };
  emit();
}
