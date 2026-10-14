"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { RecentQuotesTable } from "@/components/dashboard/recent-quotes-table";
import { QuotesListSheet } from "@/components/dashboard/quotes-list-sheet";
import { CardHeader } from "@/components/dashboard/overview/dashboard-card";
import { QuoteStatusFilters } from "@/components/dashboard/overview/quote-status-filters";
import { QuoteDetailsSheet } from "@/features/quotes/components/quote-details-sheet";
import {
  buildRecentQuotes,
  filterRecentQuotes,
} from "@/features/quotes/dashboard-source";
import { createInvoiceFromQuote } from "@/features/invoices/store";
import { nextActionFor } from "@/features/quotes/model";
import { updateQuote, useLedger } from "@/features/quotes/store";
import { can } from "@/features/settings/can";
import { systemRoles } from "@/features/settings/mocks/roles";
import { useRouter } from "@/i18n/navigation";

const activePermissions =
  systemRoles.find((role) => role.id === "tenant-admin")?.permissions ?? [];

export function DashboardQuotesLive() {
  const t = useTranslations();
  const router = useRouter();
  const ledger = useLedger();
  const [statusIndex, setStatusIndex] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const quotes = useMemo(
    () => buildRecentQuotes(ledger.quotes, ledger.customers),
    [ledger.customers, ledger.quotes],
  );
  const visible = useMemo(
    () => filterRecentQuotes(quotes, statusIndex),
    [quotes, statusIndex],
  );
  const detailsQuote =
    detailsId ? ledger.quotes.find((quote) => quote.id === detailsId) ?? null : null;

  const canSend = can(activePermissions, "quote.send");
  const canApprove = can(activePermissions, "quote.approve");
  const canUpdate = can(activePermissions, "quote.update");

  function customerLabel(customerId: string) {
    return ledger.customers.find((item) => item.id === customerId)?.name ?? customerId;
  }

  function handleNextAction(id: string) {
    const quote = ledger.quotes.find((item) => item.id === id);
    if (!quote) return;
    const next = nextActionFor(quote);
    if (next.kind === "send" && canSend) {
      updateQuote(id, {
        status: "sent",
        activity: [
          {
            id: `${id}-sent-${Date.now()}`,
            at: "2026-10-02",
            messageKey: "activity.quoteSent",
            values: { id },
          },
          ...quote.activity,
        ],
      });
      return;
    }
    if (next.kind === "approve" && canApprove) {
      updateQuote(id, {
        status: "accepted",
        activity: [
          {
            id: `${id}-accepted-${Date.now()}`,
            at: "2026-10-02",
            messageKey: "activity.quoteAccepted",
            values: { id, customer: customerLabel(quote.customerId) },
          },
          ...quote.activity,
        ],
      });
      return;
    }
    if (next.kind === "convert" && canUpdate) {
      if (quote.status !== "accepted") return;
      const invoice = createInvoiceFromQuote(quote, customerLabel(quote.customerId));
      if (!invoice) return;
      setDetailsId(null);
      setListOpen(false);
      router.push(`/factures?invoice=${invoice.id}`);
    }
  }

  return (
    <>
      <div className="dashboard-list__header">
        <CardHeader
          action={t("quotes.openList")}
          actionAriaLabel={t("quotes.listFull.openAria")}
          title={t("quotes.title")}
          titleId="recent-quotes-title"
          onActionClick={() => setListOpen(true)}
        />
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
      <RecentQuotesTable
        quotes={visible}
        onOpenQuote={(id) => setDetailsId(id)}
      />

      <QuotesListSheet
        open={listOpen}
        quotes={quotes}
        onClose={() => setListOpen(false)}
        onOpenQuote={(id) => setDetailsId(id)}
      />

      <QuoteDetailsSheet
        canApprove={canApprove}
        canSend={canSend}
        canUpdate={canUpdate}
        customers={ledger.customers}
        open={detailsId !== null}
        quote={detailsQuote}
        onClose={() => setDetailsId(null)}
        onNextAction={handleNextAction}
      />
    </>
  );
}
