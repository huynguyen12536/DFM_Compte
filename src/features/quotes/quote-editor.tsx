"use client";

import { DocumentStatus } from "@/components/status/document-status";
import { formatMoneyFromCents } from "@/lib/money";
import { Link } from "@/i18n/navigation";
import { customerName, ownerById } from "@/features/quotes/query";
import { quoteTotals } from "@/features/quotes/model";
import { hydrateLedger, updateQuote, useHydrated, useLedger } from "@/features/quotes/store";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

export function QuoteEditor({ id }: { id: string }) {
  const t = useTranslations("register");
  const work = useTranslations();
  const ledger = useLedger();
  const ready = useHydrated();

  const lineSeq = useRef(0);

  useEffect(() => {
    hydrateLedger();
  }, []);

  const quote = ledger.quotes.find((item) => item.id === id);
  if (!ready) return <p className="p-8 text-sm text-[#728097]">{t("loading")}</p>;
  if (!quote) return <p className="p-8 text-sm text-[#728097]">{t("editor.missing")}</p>;

  const totals = quoteTotals(quote);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <Link className="text-sm font-semibold text-[#044ce2]" href="/devis">
        {t("editor.back")}
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#044ce2]">{quote.id}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#063586]">
            {customerName(ledger.customers, quote.customerId)}
          </h2>
          <p className="mt-1 text-sm text-[#728097]">{work(quote.workKey)}</p>
        </div>
        <DocumentStatus status={quote.status} />
      </div>
      <p className="mt-4 text-sm text-[#405069]">
        {t("preview.valid", { date: quote.validUntil.split("-").reverse().join("/") })} · {ownerById(quote.ownerId)?.name}
      </p>
      <section className="mt-6 overflow-hidden rounded-[18px] bg-white ring-1 ring-[#e1e7f1]">
        <div className="flex items-center justify-between border-b border-[#edf1f6] px-5 py-4">
          <h3 className="text-sm font-semibold text-[#063586]">{t("editor.lines")}</h3>
          <button
            className="text-sm font-semibold text-[#044ce2]"
            type="button"
            onClick={() => {
              lineSeq.current += 1;
              updateQuote(quote.id, {
                lines: [
                  ...quote.lines,
                  { id: `line-${lineSeq.current}`, label: "", qty: 1, unitHtCents: 0 },
                ],
              });
            }}
          >
            {t("editor.add")}
          </button>
        </div>
        {quote.lines.length === 0 ? (
          <p className="px-5 py-8 text-sm text-[#728097]">{t("editor.emptyLines")}</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-[#8b97a8]">
              <tr>
                <th className="px-5 py-2 font-medium">{t("editor.description")}</th>
                <th className="px-3 py-2 font-medium">{t("editor.qty")}</th>
                <th className="px-5 py-2 text-right font-medium">{t("editor.unit")}</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((line) => (
                <tr key={line.id} className="border-t border-[#edf1f6]">
                  <td className="px-5 py-2">
                    <input
                      className="h-9 w-full rounded-[8px] border border-[#dfe6f1] px-2"
                      value={line.label}
                      onChange={(event) =>
                        updateQuote(quote.id, {
                          lines: quote.lines.map((item) =>
                            item.id === line.id ? { ...item, label: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="h-9 w-16 rounded-[8px] border border-[#dfe6f1] px-2 tabular-nums"
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(event) =>
                        updateQuote(quote.id, {
                          lines: quote.lines.map((item) =>
                            item.id === line.id ? { ...item, qty: Number(event.target.value) || 1 } : item,
                          ),
                        })
                      }
                    />
                  </td>
                  <td className="px-5 py-2 text-right tabular-nums text-[#063586]">
                    {formatMoneyFromCents(line.unitHtCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <dl className="space-y-2 border-t border-[#edf1f6] px-5 py-4 text-sm">
          <div className="flex justify-between"><dt className="text-[#728097]">{t("preview.ht")}</dt><dd className="tabular-nums">{formatMoneyFromCents(totals.htCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-[#728097]">{t("preview.vat", { rate: quote.vatRate })}</dt><dd className="tabular-nums">{formatMoneyFromCents(totals.vatCents)}</dd></div>
          <div className="flex justify-between text-base font-semibold text-[#063586]"><dt>{t("preview.ttc")}</dt><dd className="tabular-nums">{formatMoneyFromCents(totals.ttcCents)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
