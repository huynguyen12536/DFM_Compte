"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";

import { ReportTableScroll } from "@/components/compte/report-table-scroll";
import { IconTile } from "@/components/dashboard/tone";
import { formatMoneyFromCents } from "@/lib/money";

import type { ExportResult } from "../export";
import { exportProductCsv } from "../export";
import type { DateRange, ProductPerformanceRow } from "../model";
import { ReportCard } from "./report-card";
import { ReportExportButton } from "./report-export-button";

export function ProductPerformanceReport({
  rows,
  range,
  currency,
  onEmptyExport,
  className,
}: {
  rows: ProductPerformanceRow[];
  range: DateRange;
  currency: string;
  onEmptyExport: () => void;
  className?: string;
}) {
  const t = useTranslations("reports");
  const showMargin = rows.some((row) => row.marginCents !== null);

  function handleExport(): ExportResult {
    const result = exportProductCsv(rows, range, currency);
    if (!result.ok) onEmptyExport();
    return result;
  }

  return (
    <ReportCard
      className={className}
      title={t("products.title")}
      subtitle={t("products.subtitle")}
      empty={rows.length === 0}
      emptyTitle={t("empty.reportTitle")}
      emptyBody={t("empty.reportBody")}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      action={
        <ReportExportButton
          generatingLabel={t("export.generating")}
          label={t("export.csv")}
          onExport={handleExport}
        />
      }
    >
      <ReportTableScroll
        className="h-full min-h-0 flex-1"
        maxHeightClassName="max-h-[280px] sm:max-h-[320px] xl:max-h-none"
      >
        <table className="w-full min-w-[520px] border-collapse text-left text-[11px]">
          <thead className="sticky top-0 z-[1] bg-[#f8fafc]/96 text-[10px] font-semibold tracking-wide text-[#7d8aa0] uppercase backdrop-blur-sm">
            <tr>
              <th className="px-3 py-1.5">{t("products.columns.product")}</th>
              <th className="px-3 py-1.5">{t("products.columns.type")}</th>
              <th className="px-3 py-1.5 text-right">{t("products.columns.revenue")}</th>
              <th className="px-3 py-1.5 text-right">{t("products.columns.usage")}</th>
              <th className="px-3 py-1.5 text-right">{t("products.columns.avgPrice")}</th>
              {showMargin ? (
                <th className="px-3 py-1.5 text-right">{t("products.columns.margin")}</th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="border-t border-[rgb(220_229_239/0.7)]" key={row.productId}>
                <td className="px-3 py-1.5">
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <IconTile
                      className="shrink-0"
                      icon={Package}
                      size="xs"
                      strokeWidth={2.1}
                      tone="slate"
                    />
                    <span className="min-w-0">
                      <p className="truncate font-semibold text-[#24334c]">{row.productName}</p>
                      <p className="truncate text-[10px] text-[#98a4b5]">{row.productCode}</p>
                    </span>
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <span className="inline-flex rounded-[5px] bg-[#eef2f7] px-1.5 py-0.5 text-[10px] font-medium text-[#66758d]">
                    {t(`products.types.${row.type}`)}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-right font-semibold text-[#132642] tabular-nums">
                  {formatMoneyFromCents(row.revenueCents)}
                </td>
                <td className="px-3 py-1.5 text-right text-[#516078] tabular-nums">
                  {row.quantity} {row.unit}
                </td>
                <td className="px-3 py-1.5 text-right text-[#516078] tabular-nums">
                  {formatMoneyFromCents(row.averagePriceCents)}
                </td>
                {showMargin ? (
                  <td className="px-3 py-1.5 text-right text-[#132642] tabular-nums">
                    {row.marginCents === null ? "—" : formatMoneyFromCents(row.marginCents)}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </ReportTableScroll>
    </ReportCard>
  );
}
