"use client";

import { Plus, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
} from "@/components/compte/animated-selection";
import { SoftSelect } from "@/components/compte/soft-select";
import { SoftToast } from "@/components/compte/soft-toast";
import { FormSheet } from "@/components/forms/form-sheet";
import { can } from "@/features/settings/can";
import { systemRoles } from "@/features/settings/mocks/roles";
import { useRouter } from "@/i18n/navigation";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

import { AutomationActivityFeed } from "./components/automation-activity";
import { AutomationDetail } from "./components/automation-detail";
import { AutomationKpisStrip } from "./components/automation-kpis";
import { AutomationList } from "./components/automation-list";
import { AutomationRecentRuns } from "./components/automation-runs";
import { NeedsAttentionPanel } from "./components/needs-attention";
import { NewAutomationSheet } from "./components/new-automation-sheet";
import { RunDetailSheet } from "./components/run-detail-sheet";
import { getAutomationKpis } from "./kpis";
import type { AutomationReviewItem } from "./model";
import { resolveReviewItem, useAutomationState } from "./store";

const activePermissions =
  systemRoles.find((role) => role.id === "tenant-admin")?.permissions ?? [];

type MainTab = "overview" | "automations" | "activity";
type StatusFilter = "all" | "active" | "paused" | "error";
type TypeFilter = "all" | "finance" | "sales";

export function AutomationWorkspace() {
  const t = useTranslations("automation");
  const locale = useLocale();
  const router = useRouter();
  const { automations, runs, reviewItems, activities } = useAutomationState();
  const isXl = useMediaQuery("(min-width: 1280px)");
  const useSheetDetail = useMediaQuery("(max-width: 1279px)");

  const canRead = can(activePermissions, "automation.read");
  const canManage = can(activePermissions, "automation.manage");
  const canApprove = can(activePermissions, "automation.approve");

  const [mainTab, setMainTab] = useState<MainTab>("automations");
  const [selectedId, setSelectedId] = useState<string | null>(
    automations[0]?.id ?? null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [newOpen, setNewOpen] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const kpis = useMemo(
    () => getAutomationKpis(automations, runs, reviewItems),
    [automations, reviewItems, runs],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return automations.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (typeFilter !== "all" && item.category !== typeFilter) return false;
      if (!query) return true;
      const haystack = [
        t(item.nameKey),
        t(item.descriptionKey),
        t(item.triggerLabelKey),
        item.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [automations, search, statusFilter, t, typeFilter]);

  const selected = automations.find((item) => item.id === selectedId) ?? null;
  const selectedRun = runs.find((run) => run.id === runId) ?? null;
  const selectedRunAutomation =
    automations.find((item) => item.id === selectedRun?.automationId) ?? null;

  if (!canRead) {
    return (
      <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
        <p className="text-sm text-[#7d8aa0]">{t("forbidden")}</p>
      </main>
    );
  }

  function selectAutomation(id: string) {
    setSelectedId(id);
    if (useSheetDetail) setDetailOpen(true);
  }

  function handleReview(item: AutomationReviewItem) {
    if (!canApprove && !canManage) {
      setNotice(t("toast.forbiddenReview"));
      return;
    }
    if (item.type === "bank_match") {
      resolveReviewItem(item.id);
      router.push("/paiements");
      setNotice(t("toast.openReconciliation"));
      return;
    }
    if (item.type === "reminder_draft") {
      resolveReviewItem(item.id);
      router.push("/paiements");
      setNotice(t("toast.openReminder"));
      return;
    }
    resolveReviewItem(item.id);
    router.push("/devis");
    setNotice(t("toast.openQuote"));
  }

  return (
    <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="app-scroll dashboard-page dashboard-stack flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--dashboard-gap)] overflow-y-auto pb-3">
        <header className="dashboard-enter enter-0 flex shrink-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold tracking-[-0.03em] text-[#063586] sm:text-[24px]">
              {t("title")}
            </h1>
            <p className="mt-1 max-w-[54ch] text-[12px] leading-5 text-[#7d8aa0]">
              {t("subtitle")}
            </p>
          </div>
          {canManage ? (
            <button
              className="action-motion soft-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-xs font-semibold text-white"
              type="button"
              onClick={() => setNewOpen(true)}
            >
              <Plus aria-hidden="true" className="h-3.5 w-3.5" />
              {t("new")}
            </button>
          ) : null}
        </header>

        <div className="dashboard-enter enter-1 shrink-0">
          <AutomationKpisStrip
            kpis={kpis}
            onNeedsAttention={() => setMainTab("overview")}
          />
        </div>

        <AnimatedSelectionGroup
          className="dashboard-enter enter-2 shrink-0"
          id="automation-main-tabs"
        >
          <div
            aria-label={t("tabsLabel")}
            className="flex min-w-0 gap-1 overflow-x-auto"
            role="tablist"
          >
            {(["overview", "automations", "activity"] as const).map((tab) => {
              const active = mainTab === tab;
              return (
                <button
                  aria-selected={active}
                  className={cn(
                    "relative shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors",
                    active ? "text-[#2458d6]" : "text-[#7d8aa0] hover:text-[#405069]",
                  )}
                  key={tab}
                  role="tab"
                  type="button"
                  onClick={() => setMainTab(tab)}
                >
                  {active ? (
                    <AnimatedActiveIndicator
                      className="rounded-full"
                      layoutId="automation-main-tab"
                      variant="soft-pill"
                    />
                  ) : null}
                  <span className="relative z-[1]">
                    {t(`tabs.${tab}`)}
                    {tab === "automations" ? ` (${automations.length})` : null}
                    {tab === "overview" && kpis.needsAttention > 0
                      ? ` (${kpis.needsAttention})`
                      : null}
                  </span>
                </button>
              );
            })}
          </div>
        </AnimatedSelectionGroup>

        {mainTab === "overview" ? (
          <div
            className="dashboard-enter enter-3 grid min-w-0 grid-cols-1 gap-[var(--dashboard-gap)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
            style={{ animation: "compte-tab-in 160ms ease-out" }}
          >
            <NeedsAttentionPanel
              automations={automations}
              items={reviewItems}
              onReview={handleReview}
            />
            <AutomationActivityFeed
              activities={activities.slice(0, 6)}
              automations={automations}
            />
            <div className="xl:col-span-2">
              <AutomationRecentRuns
                automations={automations}
                runs={runs}
                onView={setRunId}
              />
            </div>
          </div>
        ) : null}

        {mainTab === "automations" ? (
          <div
            className="dashboard-enter enter-3 flex min-w-0 shrink-0 flex-col gap-[var(--dashboard-gap)]"
            style={{ animation: "compte-tab-in 160ms ease-out" }}
          >
            <div className="flex min-w-0 flex-nowrap items-center gap-2 max-md:flex-wrap">
              <label className="relative min-w-0 flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[#98a4b5]"
                />
                <input
                  className="h-9 w-full min-w-0 rounded-[9px] border border-[#e1e7f1] bg-white pr-3 pl-8 text-xs outline-none focus:border-[#044ce2]"
                  placeholder={t("search")}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <SoftSelect
                hideLabel
                label={t("filters.status")}
                options={[
                  { value: "all", label: t("filters.allStatuses") },
                  { value: "active", label: t("status.active") },
                  { value: "paused", label: t("status.paused") },
                  { value: "error", label: t("status.error") },
                ]}
                triggerClassName="h-9 w-[148px] shrink-0"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as StatusFilter)}
              />
              <SoftSelect
                hideLabel
                label={t("filters.type")}
                options={[
                  { value: "all", label: t("filters.allTypes") },
                  { value: "finance", label: t("category.finance") },
                  { value: "sales", label: t("category.sales") },
                ]}
                triggerClassName="h-9 w-[132px] shrink-0"
                value={typeFilter}
                onChange={(value) => setTypeFilter(value as TypeFilter)}
              />
            </div>

            {/*
              Bounded master-detail row: shared height so list + detail share
              the same top/bottom edge; overflow scrolls inside each panel.
              Recent runs stays in normal document flow BELOW this row.
            */}
            <div
              className={cn(
                "grid min-w-0 shrink-0 items-stretch gap-[var(--dashboard-gap)]",
                isXl
                  ? "h-[clamp(520px,58vh,660px)] grid-cols-[minmax(0,1.7fr)_minmax(420px,1fr)]"
                  : "grid-cols-1",
              )}
            >
              <section
                className={cn(
                  "dashboard-card dashboard-list flex min-h-0 min-w-0 flex-col overflow-hidden",
                  isXl ? "h-full" : "min-h-[320px]",
                )}
              >
                <div className="shrink-0 border-b border-[#edf2f8] px-3.5 py-2.5">
                  <h2 className="dashboard-card-title">{t("list.title")}</h2>
                  <p className="dashboard-label mt-0.5 text-[11px]">
                    {t("list.subtitle", { count: filtered.length })}
                  </p>
                </div>
                <AutomationList
                  items={filtered}
                  locale={locale}
                  selectedId={selectedId}
                  onSelect={selectAutomation}
                />
              </section>

              {isXl ? (
                <section className="dashboard-card flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                  <AutomationDetail
                    automation={selected}
                    canManage={canManage}
                    runs={runs}
                    onViewRun={setRunId}
                  />
                </section>
              ) : null}
            </div>

            <div className="min-w-0 shrink-0">
              <AutomationRecentRuns
                automations={automations}
                runs={runs}
                onView={setRunId}
              />
            </div>
          </div>
        ) : null}

        {mainTab === "activity" ? (
          <div
            className="dashboard-enter enter-3 min-h-0"
            style={{ animation: "compte-tab-in 160ms ease-out" }}
          >
            <AutomationActivityFeed
              activities={activities}
              automations={automations}
            />
          </div>
        ) : null}
      </div>

      <FormSheet
        open={detailOpen && useSheetDetail}
        title={selected ? t(selected.nameKey) : t("detail.emptyTitle")}
        widthClassName="w-[min(100vw,560px)] sm:w-[min(85vw,640px)] md:w-[min(78vw,720px)]"
        onClose={() => setDetailOpen(false)}
      >
        <div className="-mx-1 flex min-h-0 flex-1 flex-col">
          <AutomationDetail
            automation={selected}
            canManage={canManage}
            runs={runs}
            onViewRun={(id) => {
              setDetailOpen(false);
              setRunId(id);
            }}
          />
        </div>
      </FormSheet>

      <NewAutomationSheet
        open={newOpen}
        onActivated={(id) => {
          setNewOpen(false);
          setSelectedId(id);
          setMainTab("automations");
          setNotice(t("toast.activated"));
        }}
        onClose={() => setNewOpen(false)}
      />

      <RunDetailSheet
        automation={selectedRunAutomation}
        open={runId !== null}
        run={selectedRun}
        onClose={() => setRunId(null)}
      />

      <SoftToast message={notice} onDismiss={() => setNotice("")} />
    </main>
  );
}
