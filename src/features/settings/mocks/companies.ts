import type { Company } from "../types";

export const mockCompanies: Company[] = [
  {
    id: "co-dfm-europe",
    name: "DFM-Europe",
    currency: "EUR",
    subtitle: "Tenant DFM - EUR",
  },
  {
    id: "co-dfm-romania",
    name: "DFM Romania",
    currency: "RON",
    subtitle: "Tenant DFM - RON",
  },
  {
    id: "co-dfm-belgium",
    name: "DFM Belgium",
    currency: "EUR",
    subtitle: "Tenant DFM - EUR",
  },
  {
    id: "co-dfm-usa",
    name: "DFM USA",
    currency: "USD",
    subtitle: "Tenant DFM - USD",
  },
  {
    id: "co-dfm-demo",
    name: "DFM Demo",
    currency: "EUR",
    subtitle: "Sandbox tenant",
  },
];

export const DEFAULT_COMPANY_ID = "co-dfm-europe";
