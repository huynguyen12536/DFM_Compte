"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { SoftToast } from "@/components/compte/soft-toast";
import { can } from "@/features/settings/can";
import { systemRoles } from "@/features/settings/mocks/roles";
import { useMediaQuery } from "@/lib/use-media-query";

import { hydrateLedger } from "@/features/quotes/store";

import {
  exportAgingCsv,
  exportBreakdownCsv,
  exportPipelineCsv,
  exportProductCsv,
  exportRevenueTrendCsv,
  exportSalesCsv,
} from "./export";
import { ExportsAccountingSection } from "./components/exports-accounting-section";
import { ProductPerformanceReport } from "./components/product-performance-report";
import { QuotePipelineReport } from "./components/quote-pipeline-report";
import { ReceivableAgingReport } from "./components/receivable-aging-report";
import { ReportExportMenu } from "./components/report-export-menu";
import { ReportsFilterBar } from "./components/reports-filter-bar";
import { ReportsKpiGrid } from "./components/reports-kpi-grid";
import { RevenueBreakdownReport } from "./components/revenue-breakdown-report";
import { RevenueTrendReport } from "./components/revenue-trend-report";
import { SalesPerformanceReport } from "./components/sales-performance-report";
import type {
  AgingBucketId,
  PipelineMetric,
  ReportFilters,
  ReportGranularity,
  ReportTrendMetric,
  RevenueBreakdownDimension,
} from "./model";
import { emptyReportFilters } from "./model";
import { useDerivedReports } from "./use-reports-data";

const activePermissions =
  systemRoles.find((role) => role.id === "tenant-admin")?.permissions ?? [];

export function ReportsWorkspace() {
  const t = useTranslations("reports");
  const [filters, setFilters] = useState<ReportFilters>(emptyReportFilters);
  const [granularity, setGranularity] = useState<ReportGranularity>("monthly");
  const [trendMetric, setTrendMetric] = useState<ReportTrendMetric>("revenue");
  const [breakdownDimension, setBreakdownDimension] =
    useState<RevenueBreakdownDimension>("customer");
  const [pipelineMetric, setPipelineMetric] = useState<PipelineMetric>("count");
  const [drillBucket, setDrillBucket] = useState<AgingBucketId | null>(null);
  const [notice, setNotice] = useState("");
  const [noticeTone, setNoticeTone] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    hydrateLedger();
  }, []);

  const canRead = can(activePermissions, "report.read");
  const canExport = can(activePermissions, "report.export");
  const isXl = useMediaQuery("(min-width: 1280px)");

  const derived = useDerivedReports(filters, {
    granularity,
    breakdownDimension,
    pipelineMetric,
  });

  const currencies = useMemo(() => {
    const set = new Set(derived.raw.companies.map((company) => company.currency));
    set.add("EUR");
    return [...set];
  }, [derived.raw.companies]);

  const filterSummary = useMemo(() => {
    const periodLabel = t(`period.${filters.period}`);
    const companyLabel =
      filters.companyId === "all"
        ? t("filters.allCompanies")
        : derived.raw.companies.find(
            (company) => company.id === (filters.companyId ?? derived.raw.activeCompanyId),
          )?.name ?? t("filters.company");
    const salespersonLabel = filters.salespersonId
      ? (derived.raw.owners.find((owner) => owner.id === filters.salespersonId)?.name ??
        t("filters.salesperson"))
      : t("filters.anySalesperson");
    const customerLabel = filters.customerId
      ? (derived.raw.customers.find((customer) => customer.id === filters.customerId)?.name ??
        t("filters.customer"))
      : t("filters.anyCustomer");
    const productLabel = filters.productId
      ? (derived.raw.products.find((product) => product.id === filters.productId)?.name ??
        t("filters.product"))
      : t("filters.anyProduct");
    return `${periodLabel} · ${companyLabel} · ${filters.currency} · ${salespersonLabel} · ${customerLabel} · ${productLabel}`;
  }, [derived.raw, filters, t]);

  function onEmptyExport() {
    setNoticeTone("info");
    setNotice(t("export.empty"));
  }

  function runExport(fn: () => { ok: boolean }) {
    if (!canExport) {
      setNoticeTone("error");
      setNotice(t("export.forbidden"));
      return;
    }
    const result = fn();
    if (!result.ok) onEmptyExport();
    else {
      setNoticeTone("success");
      setNotice(t("preview.success"));
    }
  }

  if (!canRead) {
    return (
      <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
        <p className="text-sm text-[#7d8aa0]">{t("forbidden")}</p>
      </main>
    );
  }

  const agingTotal = derived.aging.reduce((sum, bucket) => sum + bucket.amountCents, 0);

  return (
    <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="app-scroll dashboard-page dashboard-stack flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-3">
        {canExport ? (
          <header className="dashboard-enter enter-0 relative z-20 flex shrink-0 justify-end overflow-visible">
            <ReportExportMenu
              items={[
                {
                  key: "revenue",
                  onSelect: () =>
                    runExport(() =>
                      exportRevenueTrendCsv(derived.trend, derived.range, filters.currency),
                    ),
                },
                {
                  key: "breakdown",
                  onSelect: () =>
                    runExport(() =>
                      exportBreakdownCsv(
                        derived.breakdown.rows,
                        breakdownDimension,
                        derived.range,
                        filters.currency,
                      ),
                    ),
                },
                {
                  key: "aging",
                  onSelect: () =>
                    runExport(() =>
                      exportAgingCsv(
                        derived.agingDetails,
                        new Date().toISOString().slice(0, 10),
                      ),
                    ),
                },
                {
                  key: "pipeline",
                  onSelect: () =>
                    runExport(() =>
                      exportPipelineCsv(derived.pipelineQuotes, derived.range),
                    ),
                },
                {
                  key: "sales",
                  onSelect: () =>
                    runExport(() =>
                      exportSalesCsv(derived.sales, derived.range, filters.currency),
                    ),
                },
                {
                  key: "products",
                  onSelect: () =>
                    runExport(() =>
                      exportProductCsv(derived.products, derived.range, filters.currency),
                    ),
                },
              ]}
            />
          </header>
        ) : null}

        <div className="dashboard-enter enter-1 relative z-30 shrink-0">
          <ReportsFilterBar
            activeCompanyId={derived.raw.activeCompanyId}
            companies={derived.raw.companies}
            currencies={currencies}
            customers={derived.raw.customers}
            filters={filters}
            owners={derived.raw.owners}
            products={derived.raw.products.map((product) => ({
              id: product.id,
              name: product.name,
            }))}
            onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
            onClear={() => setFilters(emptyReportFilters)}
          />
        </div>

        <div className="dashboard-enter enter-2 shrink-0">
          <ReportsKpiGrid kpis={derived.kpis} />
        </div>

        {/* Revenue + Breakdown: shared row stretch so chart fills matched height */}
        <div className="dashboard-enter enter-3 grid min-w-0 grid-cols-1 items-stretch gap-[var(--dashboard-gap)] xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)] [&>*]:min-w-0">
          <RevenueTrendReport
            currency={filters.currency}
            granularity={granularity}
            metric={trendMetric}
            points={derived.trend}
            range={derived.range}
            onEmptyExport={onEmptyExport}
            onGranularityChange={setGranularity}
            onMetricChange={setTrendMetric}
          />
          <RevenueBreakdownReport
            currency={filters.currency}
            dimension={breakdownDimension}
            range={derived.range}
            rows={derived.breakdown.rows}
            totalCents={derived.breakdown.totalCents}
            onDimensionChange={setBreakdownDimension}
            onEmptyExport={onEmptyExport}
          />
        </div>

        {/*
          Columns share one bottom edge. Aging and pipeline stay content-sized;
          the last card in the shorter column grows so the page background
          does not show under Sales. Stacked below xl: Aging → Pipeline → Sales → Products.
        */}
        {isXl ? (
          <div className="dashboard-enter enter-4 grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)] items-stretch gap-[var(--dashboard-gap)]">
            {/*
              Sales is taken out of flow so its long table does not inflate the
              row. The right column (pipeline + products) sets height; Sales
              fills leftover space and its scroll reaches the card foot.
            */}
            <div className="flex min-h-0 min-w-0 flex-col gap-[var(--dashboard-gap)]">
              <ReceivableAgingReport
                buckets={derived.aging}
                details={derived.agingDetails}
                drillBucket={drillBucket}
                totalCents={agingTotal}
                onCloseDrill={() => setDrillBucket(null)}
                onDrill={setDrillBucket}
                onEmptyExport={onEmptyExport}
              />
              <div className="relative min-h-0 min-w-0 flex-1">
                <div className="absolute inset-0 flex min-h-0 flex-col">
                  <SalesPerformanceReport
                    className="h-full min-h-0"
                    currency={filters.currency}
                    range={derived.range}
                    rows={derived.sales}
                    onEmptyExport={onEmptyExport}
                  />
                </div>
              </div>
            </div>
            <div className="flex min-h-0 min-w-0 flex-col gap-[var(--dashboard-gap)]">
              <QuotePipelineReport
                metric={pipelineMetric}
                pipelineQuotes={derived.pipelineQuotes}
                range={derived.range}
                rows={derived.pipeline}
                onEmptyExport={onEmptyExport}
                onMetricChange={setPipelineMetric}
              />
              <ProductPerformanceReport
                currency={filters.currency}
                range={derived.range}
                rows={derived.products}
                onEmptyExport={onEmptyExport}
              />
            </div>
          </div>
        ) : (
          <div className="dashboard-enter enter-4 flex min-w-0 flex-col gap-[var(--dashboard-gap)]">
            <ReceivableAgingReport
              buckets={derived.aging}
              details={derived.agingDetails}
              drillBucket={drillBucket}
              totalCents={agingTotal}
              onCloseDrill={() => setDrillBucket(null)}
              onDrill={setDrillBucket}
              onEmptyExport={onEmptyExport}
            />
            <QuotePipelineReport
              metric={pipelineMetric}
              pipelineQuotes={derived.pipelineQuotes}
              range={derived.range}
              rows={derived.pipeline}
              onEmptyExport={onEmptyExport}
              onMetricChange={setPipelineMetric}
            />
            <SalesPerformanceReport
              currency={filters.currency}
              range={derived.range}
              rows={derived.sales}
              onEmptyExport={onEmptyExport}
            />
            <ProductPerformanceReport
              currency={filters.currency}
              range={derived.range}
              rows={derived.products}
              onEmptyExport={onEmptyExport}
            />
          </div>
        )}

        <div className="dashboard-enter enter-6 shrink-0">
          <ExportsAccountingSection
            agingDetails={derived.agingDetails}
            canExport={canExport}
            currency={filters.currency}
            filterSummary={filterSummary}
            pipelineQuotes={derived.pipelineQuotes}
            products={derived.products}
            range={derived.range}
            sales={derived.sales}
            trend={derived.trend}
            onEmptyExport={onEmptyExport}
            onExported={() => {
              setNoticeTone("success");
              setNotice(t("preview.success"));
            }}
          />
        </div>
      </div>

      <SoftToast message={notice} tone={noticeTone} onDismiss={() => setNotice("")} />
    </main>
  );
}
