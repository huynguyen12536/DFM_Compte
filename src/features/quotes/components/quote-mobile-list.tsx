"use client";

import { useLocale, useTranslations } from "next-intl";

import { StatusBadge } from "@/components/dashboard/tone";
import { formatMoneyFromCents } from "@/lib/money";
import { cn } from "@/lib/utils";

import { nextActionFor, quoteTotals, type QuoteRecord } from "../model";
import { customerName, ownerById } from "../query";
import { quoteStatusTone } from "../status";
import { QuoteRowMenu, type QuoteMenuAction } from "./quote-row-menu";

export function QuoteMobileList({
  quotes,
  customers,
  canSend,
  canApprove,
  canUpdate,
  onOpen,
  onNextAction,
  onMenuAction,
}: {
  quotes: QuoteRecord[];
  customers: Array<{ id: string; name: string }>;
  canSend: boolean;
  canApprove: boolean;
  canUpdate: boolean;
  onOpen: (id: string) => void;
  onNextAction: (id: string) => void;
  onMenuAction: (id: string, action: QuoteMenuAction) => void;
}) {
  const t = useTranslations("register");
  const statusT = useTranslations("status");
  const workT = useTranslations();
  const locale = useLocale();
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 lg:hidden">
      {quotes.map((quote) => {
        const owner = ownerById(quote.ownerId);
        const name = customerName(customers, quote.customerId);
        const work = workT(quote.workKey);
        const amount = formatMoneyFromCents(quoteTotals(quote).ttcCents);
        const next = nextActionFor(quote);
        const validLabel = dateFmt.format(new Date(`${quote.validUntil}T00:00:00`));

        return (
          <li className="dashboard-card px-3 py-3" key={quote.id}>
            <div className="flex items-start justify-between gap-2">
              <button
                className="dashboard-list__primary dashboard-list__link text-left tabular-nums"
                onClick={() => onOpen(quote.id)}
                type="button"
              >
                {quote.id}
              </button>
              <StatusBadge size="xs" tone={quoteStatusTone[quote.status]}>
                {statusT(quote.status)}
              </StatusBadge>
            </div>
            <p className="dashboard-list__primary mt-1.5 truncate">{name}</p>
            <p className="dashboard-list__secondary truncate">{work}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <strong className="dashboard-list__amount">{amount}</strong>
              <span className="dashboard-list__secondary">
                {t("validity")} {validLabel}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#516078]">
                <span className="dashboard-list__avatar">{owner?.initials ?? "—"}</span>
                {owner?.name ?? "—"}
              </span>
              <div className="flex items-center gap-1.5">
                {next.kind !== "none" ? (
                  <button
                    className={cn(
                      "action-motion soft-button h-8 rounded-[8px] px-2.5 text-xs font-semibold text-[#044ce2]",
                      (next.kind === "approve" && !canApprove) ||
                        (next.kind === "send" && !canSend)
                        ? "pointer-events-none opacity-40"
                        : "",
                    )}
                    disabled={
                      (next.kind === "approve" && !canApprove) ||
                      (next.kind === "send" && !canSend)
                    }
                    onClick={() => onNextAction(quote.id)}
                    type="button"
                  >
                    {t(`actions.${next.kind}`)}
                  </button>
                ) : null}
                <QuoteRowMenu
                  canApprove={canApprove}
                  canSend={canSend}
                  canUpdate={canUpdate}
                  onAction={(action) => onMenuAction(quote.id, action)}
                  quote={quote}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
