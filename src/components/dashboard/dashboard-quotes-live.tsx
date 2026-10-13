"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { RecentQuotesTable } from "@/components/dashboard/recent-quotes-table";
import { CardHeader } from "@/components/dashboard/overview/dashboard-card";
import { QuoteStatusFilters } from "@/components/dashboard/overview/quote-status-filters";
import {
  buildRecentQuotes,
  filterRecentQuotes,
} from "@/features/quotes/dashboard-source";
import { useLedger } from "@/features/quotes/store";

export function DashboardQuotesLive() {
  const t = useTranslations();
  const ledger = useLedger();
  const [statusIndex, setStatusIndex] = useState(0);
  const quotes = useMemo(
    () => buildRecentQuotes(ledger.quotes, ledger.customers),
    [ledger.customers, ledger.quotes],
  );
  const visible = useMemo(
    () => filterRecentQuotes(quotes, statusIndex),
    [quotes, statusIndex],
  );

  return (
    <>
      <div className="dashboard-list__header">
        <CardHeader action={t("quotes.openList")} title={t("quotes.title")} titleId="recent-quotes-title" />
        <QuoteStatusFilters
          labels={[
            t("quotes.all"),
            t("status.draft"),
            t("status.sent"),
            t("status.review"),
            t("status.accepted"),
          ]}
          onChange={setStatusIndex}
          value={statusIndex}
        />
      </div>
      <RecentQuotesTable quotes={visible} />
    </>
  );
}
