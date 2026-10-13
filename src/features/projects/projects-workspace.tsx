"use client";

import { MoreHorizontal, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
} from "@/components/compte/animated-selection";
import { SoftSelect } from "@/components/compte/soft-select";
import { SoftToast } from "@/components/compte/soft-toast";
import { StatusBadge } from "@/components/dashboard/tone";
import { useInvoicePayments, useInvoices } from "@/features/invoices/store";
import { useLedger } from "@/features/quotes/store";
import { can } from "@/features/settings/can";
import { DEFAULT_COMPANY_ID } from "@/features/settings/mocks/companies";
import { systemRoles } from "@/features/settings/mocks/roles";
import { useRouter } from "@/i18n/navigation";
import { formatMoneyFromCents, formatPercent } from "@/lib/money";
import { cn } from "@/lib/utils";

import { ExpenseReviewSheet } from "./components/expense-review-sheet";
import { NewExpenseSheet } from "./components/new-expense-sheet";
import { NewProjectSheet } from "./components/new-project-sheet";
import { ProjectDetailSheet } from "./components/project-detail-sheet";
import { ProjectsKpisStrip } from "./components/projects-kpis";
import { projectFinance, projectsKpis } from "./finance";
import type { ExpenseStatus, ProjectStatus } from "./model";
import { expenseStatusTone, projectStatusTone } from "./status";
import { archiveProject, useProjectsState } from "./store";

const activePermissions =
  systemRoles.find((role) => role.id === "tenant-admin")?.permissions ?? [];

const COMPANY_ID = DEFAULT_COMPANY_ID;

type MainTab = "projects" | "expenses" | "approvals";

export function ProjectsWorkspace() {
  const t = useTranslations("projects");
  const router = useRouter();
  const { projects, expenses, activities } = useProjectsState();
  const { quotes, customers } = useLedger();
  const invoices = useInvoices();
  const payments = useInvoicePayments();

  const canRead = can(activePermissions, "project.read");
  const canCreate = can(activePermissions, "project.create");
  const canUpdate = can(activePermissions, "project.update");
  const canViewFinance = can(activePermissions, "project.finance");
  const canExpenseRead = can(activePermissions, "expense.read");
  const canExpenseCreate = can(activePermissions, "expense.create");
  const canExpenseApprove = can(activePermissions, "expense.approve");

  const [mainTab, setMainTab] = useState<MainTab>("projects");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [expenseStatus, setExpenseStatus] = useState<ExpenseStatus | "all">("all");
  const [expenseProject, setExpenseProject] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectKey, setNewProjectKey] = useState(0);
  const [newExpenseOpen, setNewExpenseOpen] = useState(false);
  const [newExpenseKey, setNewExpenseKey] = useState(0);
  const [reviewExpenseId, setReviewExpenseId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);

  const scopedProjects = useMemo(
    () => projects.filter((project) => project.companyId === COMPANY_ID),
    [projects],
  );
  const scopedExpenses = useMemo(
    () => expenses.filter((expense) => expense.companyId === COMPANY_ID),
    [expenses],
  );

  const kpis = useMemo(
    () =>
      projectsKpis(scopedProjects, invoices, payments, quotes, scopedExpenses),
    [invoices, payments, quotes, scopedExpenses, scopedProjects],
  );

  const pendingApprovals = useMemo(
    () =>
      scopedExpenses.filter((expense) => expense.status === "pending_approval"),
    [scopedExpenses],
  );

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scopedProjects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      if (customerFilter !== "all" && project.customerId !== customerFilter) {
        return false;
      }
      if (!query) return true;
      const haystack = [
        project.code,
        project.name,
        project.customerName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [customerFilter, scopedProjects, search, statusFilter]);

  const projectRows = useMemo(
    () =>
      filteredProjects.map((project) => ({
        project,
        finance: projectFinance(
          project,
          invoices,
          payments,
          quotes,
          scopedExpenses,
        ),
      })),
    [filteredProjects, invoices, payments, quotes, scopedExpenses],
  );

  const filteredExpenses = useMemo(() => {
    const query = expenseSearch.trim().toLowerCase();
    return scopedExpenses.filter((expense) => {
      if (expenseStatus !== "all" && expense.status !== expenseStatus) return false;
      if (expenseProject !== "all" && expense.projectId !== expenseProject) {
        return false;
      }
      if (!query) return true;
      const projectName =
        scopedProjects.find((project) => project.id === expense.projectId)?.name ??
        "";
      return [expense.supplier, expense.description, projectName, expense.category]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [expenseProject, expenseSearch, expenseStatus, scopedExpenses, scopedProjects]);

  const expenseSummary = useMemo(() => {
    const total = scopedExpenses.length;
    const pending = scopedExpenses.filter(
      (expense) => expense.status === "pending_approval",
    ).length;
    const approved = scopedExpenses.filter(
      (expense) => expense.status === "approved",
    ).length;
    const rejected = scopedExpenses.filter(
      (expense) => expense.status === "rejected",
    ).length;
    return { total, pending, approved, rejected };
  }, [scopedExpenses]);

  const selectedProject =
    scopedProjects.find((project) => project.id === selectedProjectId) ?? null;
  const reviewExpense =
    scopedExpenses.find((expense) => expense.id === reviewExpenseId) ?? null;
  const reviewProject =
    scopedProjects.find((project) => project.id === reviewExpense?.projectId) ??
    null;

  const customerOptions = useMemo(() => {
    const ids = new Set(scopedProjects.map((project) => project.customerId));
    return customers
      .filter((customer) => ids.has(customer.id))
      .map((customer) => ({ value: customer.id, label: customer.name }));
  }, [customers, scopedProjects]);

  if (!canRead) {
    return (
      <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-6">
        <p className="text-sm text-[#7d8aa0]">{t("forbidden")}</p>
      </main>
    );
  }

  function openProject(id: string) {
    setSelectedProjectId(id);
    setDetailOpen(true);
    setMenuProjectId(null);
  }

  return (
    <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="dashboard-scroll dashboard-page dashboard-stack flex min-h-0 min-w-0 flex-1 flex-col gap-[var(--dashboard-gap)] overflow-x-hidden overflow-y-auto pb-6 lg:overflow-hidden lg:pb-3">
        <header className="dashboard-enter enter-0 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#063586]">
              {t("title")}
            </h1>
            <p className="mt-0.5 max-w-xl text-[12px] leading-5 text-[#7d8aa0]">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canExpenseCreate ? (
              <button
                className="action-motion soft-button inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-xs font-semibold text-[#405069]"
                type="button"
                onClick={() => {
                  setNewExpenseKey((value) => value + 1);
                  setNewExpenseOpen(true);
                }}
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                {t("actions.newExpense")}
              </button>
            ) : null}
            {canCreate ? (
              <button
                className="action-motion soft-primary inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-xs font-semibold text-white"
                type="button"
                onClick={() => {
                  setNewProjectKey((value) => value + 1);
                  setNewProjectOpen(true);
                }}
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                {t("actions.newProject")}
              </button>
            ) : null}
          </div>
        </header>

        <div className="dashboard-enter enter-1 shrink-0">
          <ProjectsKpisStrip kpis={kpis} />
        </div>

        <AnimatedSelectionGroup
          className="dashboard-enter enter-2 shrink-0"
          id="projects-main-tabs"
        >
          <div
            aria-label={t("tabsLabel")}
            className="flex min-w-0 gap-1 overflow-x-auto"
            role="tablist"
          >
            {(
              [
                ["projects", scopedProjects.length],
                ["expenses", scopedExpenses.length],
                ["approvals", pendingApprovals.length],
              ] as const
            ).map(([tab, count]) => {
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
                      layoutId="projects-main-tab"
                      variant="soft-pill"
                    />
                  ) : null}
                  <span className="relative z-[1]">
                    {t(`tabs.${tab}`)}
                    {tab !== "expenses" || canExpenseRead ? ` (${count})` : null}
                  </span>
                </button>
              );
            })}
          </div>
        </AnimatedSelectionGroup>

        {mainTab === "projects" ? (
          <div
            className="dashboard-enter enter-3 flex min-h-0 min-w-0 flex-1 flex-col"
            style={{ animation: "compte-tab-in 160ms ease-out" }}
          >
            <section className="dashboard-card flex min-h-[320px] min-w-0 flex-1 flex-col overflow-hidden px-3 py-3 sm:min-h-[380px] sm:px-3.5 lg:min-h-0">
              <div className="flex shrink-0 min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                <label className="soft-input relative flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[9px] px-2.5 sm:max-w-[22rem]">
                  <Search aria-hidden="true" className="h-3.5 w-3.5 text-[#98a4b5]" />
                  <input
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#98a4b5]"
                    placeholder={t("filters.searchProjects")}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <SoftSelect
                    label={t("filters.status")}
                    hideLabel
                    options={[
                      { value: "all", label: t("filters.allStatuses") },
                      ...(
                        [
                          "draft",
                          "active",
                          "completed",
                          "on_hold",
                          "archived",
                        ] as const
                      ).map((value) => ({
                        value,
                        label: t(`status.${value}`),
                      })),
                    ]}
                    value={statusFilter}
                    onChange={(value) =>
                      setStatusFilter(value as ProjectStatus | "all")
                    }
                  />
                  <SoftSelect
                    label={t("filters.customer")}
                    hideLabel
                    options={[
                      { value: "all", label: t("filters.allCustomers") },
                      ...customerOptions,
                    ]}
                    value={customerFilter}
                    onChange={setCustomerFilter}
                  />
                  <SoftSelect
                    label={t("filters.company")}
                    hideLabel
                    options={[
                      { value: COMPANY_ID, label: "DFM-Europe" },
                    ]}
                    value={COMPANY_ID}
                    onChange={() => undefined}
                  />
                </div>
              </div>

              {projectRows.length === 0 ? (
                <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-[#24334c]">
                    {t("empty.title")}
                  </p>
                  <p className="mt-1 max-w-sm text-[12px] text-[#7d8aa0]">
                    {t("empty.body")}
                  </p>
                  {canCreate ? (
                    <button
                      className="action-motion soft-primary mt-4 inline-flex h-9 items-center rounded-[9px] px-3 text-xs font-semibold text-white"
                      type="button"
                      onClick={() => {
                        setNewProjectKey((value) => value + 1);
                        setNewProjectOpen(true);
                      }}
                    >
                      {t("actions.newProject")}
                    </button>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="dashboard-scroll mt-3 hidden min-h-0 flex-1 overflow-auto md:block">
                    <table className="w-full min-w-[980px] border-collapse text-left text-[11px]">
                      <thead className="sticky top-0 z-[1] bg-[rgb(255_255_255/0.96)] text-[#7d8aa0] backdrop-blur-sm">
                        <tr className="border-b border-[#edf2f8]">
                          <th className="px-2 py-2 font-semibold">{t("columns.code")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.name")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.customer")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.status")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.quotes")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.invoices")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.revenue")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.costs")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.profit")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.margin")}</th>
                          <th className="px-2 py-2 font-semibold">{t("columns.lastActivity")}</th>
                          <th className="px-2 py-2 font-semibold" />
                        </tr>
                      </thead>
                      <tbody>
                        {projectRows.map(({ project, finance }) => (
                          <tr
                            className="cursor-pointer border-b border-[#f1f4f9] transition-colors hover:bg-[#f8fafc]"
                            key={project.id}
                            onClick={() => openProject(project.id)}
                          >
                            <td className="px-2 py-2.5 font-semibold tabular-nums text-[#24334c]">
                              {project.code}
                            </td>
                            <td className="max-w-[180px] truncate px-2 py-2.5 font-medium text-[#24334c]">
                              {project.name}
                            </td>
                            <td className="px-2 py-2.5 text-[#516078]">
                              {project.customerName}
                            </td>
                            <td className="px-2 py-2.5">
                              <StatusBadge
                                size="xs"
                                tone={projectStatusTone[project.status]}
                              >
                                {t(`status.${project.status}`)}
                              </StatusBadge>
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {finance.quoteCount}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {finance.invoiceCount}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {canViewFinance
                                ? formatMoneyFromCents(finance.revenueCents)
                                : t("finance.masked")}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {canViewFinance
                                ? formatMoneyFromCents(finance.costCents)
                                : t("finance.masked")}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {canViewFinance
                                ? formatMoneyFromCents(finance.profitCents)
                                : t("finance.masked")}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {canViewFinance
                                ? finance.marginRatio === null
                                  ? t("kpis.na")
                                  : formatPercent(finance.marginRatio)
                                : t("finance.masked")}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {project.updatedAt.slice(0, 10)}
                            </td>
                            <td className="relative px-2 py-2.5">
                              {canUpdate ? (
                                <button
                                  aria-label={t("actions.more")}
                                  className="soft-button grid h-7 w-7 place-items-center rounded-[8px] text-[#7d8aa0]"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setMenuProjectId((current) =>
                                      current === project.id ? null : project.id,
                                    );
                                  }}
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                              {menuProjectId === project.id ? (
                                <div className="absolute right-2 top-9 z-10 min-w-[120px] rounded-[10px] border border-[#e1e7f1] bg-white p-1 shadow-[0_8px_24px_rgb(20_32_51/0.1)]">
                                  <button
                                    className="block w-full rounded-[8px] px-2 py-1.5 text-left text-[11px] text-[#405069] hover:bg-[#f5f8fc]"
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      archiveProject(project.id);
                                      setMenuProjectId(null);
                                      setNotice(t("toast.archived"));
                                    }}
                                  >
                                    {t("actions.archive")}
                                  </button>
                                </div>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="dashboard-scroll mt-3 grid min-h-0 flex-1 gap-2 overflow-y-auto md:hidden">
                    {projectRows.map(({ project, finance }) => (
                      <button
                        className="soft-button rounded-[12px] border border-[#edf2f8] px-3 py-3 text-left"
                        key={project.id}
                        type="button"
                        onClick={() => openProject(project.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold tabular-nums text-[#7d8aa0]">
                              {project.code}
                            </p>
                            <p className="truncate text-[13px] font-semibold text-[#24334c]">
                              {project.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-[#7d8aa0]">
                              {project.customerName}
                            </p>
                          </div>
                          <StatusBadge
                            size="xs"
                            tone={projectStatusTone[project.status]}
                          >
                            {t(`status.${project.status}`)}
                          </StatusBadge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-[#516078]">
                          <span>
                            {t("columns.quotes")}: {finance.quoteCount}
                          </span>
                          <span>
                            {t("columns.invoices")}: {finance.invoiceCount}
                          </span>
                          <span className="tabular-nums">
                            {t("columns.revenue")}:{" "}
                            {canViewFinance
                              ? formatMoneyFromCents(finance.revenueCents)
                              : t("finance.masked")}
                          </span>
                          <span className="tabular-nums">
                            {t("columns.margin")}:{" "}
                            {canViewFinance
                              ? finance.marginRatio === null
                                ? t("kpis.na")
                                : formatPercent(finance.marginRatio)
                              : t("finance.masked")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        ) : null}

        {mainTab === "expenses" ? (
          <div
            className="dashboard-enter enter-3 min-h-0 flex-1 overflow-y-auto"
            style={{ animation: "compte-tab-in 160ms ease-out" }}
          >
            {!canExpenseRead ? (
              <p className="text-sm text-[#7d8aa0]">{t("forbiddenExpense")}</p>
            ) : (
              <section className="dashboard-card flex min-w-0 flex-col gap-3 overflow-hidden px-3 py-3 sm:px-3.5">
                <div className="flex flex-wrap gap-3 text-[11px] text-[#516078]">
                  <span>
                    {t("expense.summary.total")}: <strong>{expenseSummary.total}</strong>
                  </span>
                  <span>
                    {t("expense.summary.pending")}:{" "}
                    <strong>{expenseSummary.pending}</strong>
                  </span>
                  <span>
                    {t("expense.summary.approved")}:{" "}
                    <strong>{expenseSummary.approved}</strong>
                  </span>
                  <span>
                    {t("expense.summary.rejected")}:{" "}
                    <strong>{expenseSummary.rejected}</strong>
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center">
                  <label className="soft-input relative flex h-9 min-w-0 flex-1 items-center gap-2 rounded-[9px] px-2.5 sm:max-w-[22rem]">
                    <Search aria-hidden="true" className="h-3.5 w-3.5 text-[#98a4b5]" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#98a4b5]"
                      placeholder={t("filters.searchExpenses")}
                      value={expenseSearch}
                      onChange={(event) => setExpenseSearch(event.target.value)}
                    />
                  </label>
                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <SoftSelect
                      label={t("filters.status")}
                      hideLabel
                      options={[
                        { value: "all", label: t("filters.allStatuses") },
                        ...(
                          [
                            "draft",
                            "submitted",
                            "pending_approval",
                            "approved",
                            "rejected",
                          ] as const
                        ).map((value) => ({
                          value,
                          label: t(`expense.status.${value}`),
                        })),
                      ]}
                      value={expenseStatus}
                      onChange={(value) =>
                        setExpenseStatus(value as ExpenseStatus | "all")
                      }
                    />
                    <SoftSelect
                      label={t("filters.project")}
                      hideLabel
                      options={[
                        { value: "all", label: t("filters.allProjects") },
                        ...scopedProjects.map((project) => ({
                          value: project.id,
                          label: project.name,
                        })),
                      ]}
                      value={expenseProject}
                      onChange={setExpenseProject}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] border-collapse text-left text-[11px]">
                    <thead className="text-[#7d8aa0]">
                      <tr className="border-b border-[#edf2f8]">
                        <th className="px-2 py-2 font-semibold">{t("expense.date")}</th>
                        <th className="px-2 py-2 font-semibold">
                          {t("expense.supplier")}
                        </th>
                        <th className="px-2 py-2 font-semibold">{t("columns.name")}</th>
                        <th className="px-2 py-2 font-semibold">
                          {t("expense.category")}
                        </th>
                        <th className="px-2 py-2 font-semibold">{t("expense.amount")}</th>
                        <th className="px-2 py-2 font-semibold">{t("expense.vat")}</th>
                        <th className="px-2 py-2 font-semibold">{t("expense.receipt")}</th>
                        <th className="px-2 py-2 font-semibold">
                          {t("expense.submittedBy")}
                        </th>
                        <th className="px-2 py-2 font-semibold">{t("columns.status")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => {
                        const projectName =
                          scopedProjects.find(
                            (project) => project.id === expense.projectId,
                          )?.name ?? t("expense.noProject");
                        return (
                          <tr
                            className="border-b border-[#f1f4f9]"
                            key={expense.id}
                          >
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {expense.date}
                            </td>
                            <td className="px-2 py-2.5 font-medium text-[#24334c]">
                              {expense.supplier}
                            </td>
                            <td className="px-2 py-2.5 text-[#516078]">{projectName}</td>
                            <td className="px-2 py-2.5 text-[#516078]">
                              {t(`expense.categories.${expense.category}`)}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {canViewFinance
                                ? formatMoneyFromCents(expense.amountCents)
                                : t("finance.masked")}
                            </td>
                            <td className="px-2 py-2.5 tabular-nums text-[#516078]">
                              {canViewFinance
                                ? formatMoneyFromCents(expense.vatCents)
                                : t("finance.masked")}
                            </td>
                            <td className="px-2 py-2.5 text-[#516078]">
                              {expense.receiptName ?? "—"}
                            </td>
                            <td className="px-2 py-2.5 text-[#516078]">
                              {expense.submittedBy}
                            </td>
                            <td className="px-2 py-2.5">
                              <StatusBadge
                                size="xs"
                                tone={expenseStatusTone[expense.status]}
                              >
                                {t(`expense.status.${expense.status}`)}
                              </StatusBadge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        ) : null}

        {mainTab === "approvals" ? (
          <div
            className="dashboard-enter enter-3 min-h-0 flex-1 overflow-y-auto"
            style={{ animation: "compte-tab-in 160ms ease-out" }}
          >
            {!canExpenseRead ? (
              <p className="text-sm text-[#7d8aa0]">{t("forbiddenExpense")}</p>
            ) : pendingApprovals.length === 0 ? (
              <section className="dashboard-card px-4 py-12 text-center">
                <p className="text-sm font-semibold text-[#24334c]">
                  {t("approvals.empty")}
                </p>
              </section>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pendingApprovals.map((expense) => {
                  const project = scopedProjects.find(
                    (item) => item.id === expense.projectId,
                  );
                  return (
                    <article
                      className="dashboard-card flex min-w-0 flex-col px-3.5 py-3"
                      key={expense.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-[#24334c]">
                            {expense.supplier}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#7d8aa0]">
                            {expense.date}
                          </p>
                        </div>
                        <StatusBadge size="xs" tone="orange">
                          {t("expense.status.pending_approval")}
                        </StatusBadge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <dt className="text-[#98a4b5]">{t("expense.amount")}</dt>
                          <dd className="font-semibold tabular-nums text-[#24334c]">
                            {canViewFinance
                              ? formatMoneyFromCents(expense.amountCents)
                              : t("finance.masked")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-[#98a4b5]">{t("expense.vat")}</dt>
                          <dd className="font-semibold tabular-nums text-[#24334c]">
                            {canViewFinance
                              ? formatMoneyFromCents(expense.vatCents)
                              : t("finance.masked")}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-[#98a4b5]">{t("expense.project")}</dt>
                          <dd className="truncate text-[#405069]">
                            {project
                              ? `${project.code} · ${project.name}`
                              : t("expense.noProject")}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-[#98a4b5]">
                            {t("expense.submittedBy")}
                          </dt>
                          <dd className="text-[#405069]">{expense.submittedBy}</dd>
                        </div>
                      </dl>
                      <p className="mt-2 line-clamp-2 text-[11px] text-[#516078]">
                        {expense.description || t("expense.noDescription")}
                      </p>
                      <button
                        className="action-motion soft-primary mt-3 inline-flex h-8 items-center justify-center rounded-[9px] px-3 text-[11px] font-semibold text-white"
                        type="button"
                        onClick={() => setReviewExpenseId(expense.id)}
                      >
                        {t("approvals.review")}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <NewProjectSheet
        key={`new-project-${newProjectKey}`}
        companyId={COMPANY_ID}
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={(projectId) => {
          setNewProjectOpen(false);
          setNotice(t("toast.projectCreated"));
          openProject(projectId);
        }}
      />
      <NewExpenseSheet
        key={`new-expense-${newExpenseKey}`}
        companyId={COMPANY_ID}
        open={newExpenseOpen}
        projects={scopedProjects}
        onClose={() => setNewExpenseOpen(false)}
        onCreated={() => {
          setNewExpenseOpen(false);
          setNotice(t("toast.expenseCreated"));
          setMainTab("expenses");
        }}
      />
      <ProjectDetailSheet
        activities={activities}
        canUpdate={canUpdate}
        canViewFinance={canViewFinance}
        expenses={scopedExpenses}
        invoices={invoices}
        open={detailOpen}
        payments={payments}
        project={selectedProject}
        quotes={quotes}
        onClose={() => setDetailOpen(false)}
        onOpenInvoice={(invoiceId) => {
          setDetailOpen(false);
          router.push(`/factures?invoice=${invoiceId}`);
          setNotice(t("toast.openInvoice"));
        }}
        onOpenQuote={(quoteId) => {
          setDetailOpen(false);
          router.push(`/devis?quote=${quoteId}`);
          setNotice(t("toast.openQuote"));
        }}
      />
      <ExpenseReviewSheet
        key={reviewExpenseId ?? "expense-review"}
        canApprove={canExpenseApprove}
        expense={reviewExpense}
        open={Boolean(reviewExpenseId)}
        project={reviewProject}
        onClose={() => setReviewExpenseId(null)}
        onDone={() => {
          setReviewExpenseId(null);
          setNotice(t("toast.approvalUpdated"));
        }}
      />
      <SoftToast message={notice} onDismiss={() => setNotice("")} />
    </main>
  );
}
