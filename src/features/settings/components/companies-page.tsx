"use client";

import { Archive, Building2, Plus, RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { SoftSelect } from "@/components/compte/soft-select";
import { StatusBadge } from "@/components/dashboard/tone";
import { cn } from "@/lib/utils";

import { Can, can } from "../can";
import { MOCK_ACTOR_PERMISSIONS } from "../mocks/actor";
import {
  companyToDraft,
  emptyCompanyDraft,
  mockCompanies,
} from "../mocks/companies";
import { mockUsers } from "../mocks/users";
import type { Company, CompanyDraft, CompanyStatus } from "../types";
import { ConfirmDialog } from "./confirm-dialog";
import { SettingsShell } from "./settings-shell";
import { SettingsSheet } from "./settings-sheet";

const pageSizeOptions = [5, 10, 25, 50] as const;

export function CompaniesPage() {
  const t = useTranslations("settingsCompanies");
  const tCommon = useTranslations("usersPermissions");
  const permissions = MOCK_ACTOR_PERMISSIONS;
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CompanyStatus>("all");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sheetMode, setSheetMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CompanyDraft>(emptyCompanyDraft());
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyDraft, string>>>({});
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (statusFilter !== "all" && company.status !== statusFilter) return false;
      if (!needle) return true;
      const hay = `${company.name} ${company.legalName} ${company.siret ?? ""} ${company.vatNumber ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [companies, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize,
  );
  const rangeFrom = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const rangeTo = Math.min(filtered.length, (safePage + 1) * pageSize);

  const editing = companies.find((company) => company.id === editingId) ?? null;

  function memberCount(companyId: string) {
    return mockUsers.filter((user) =>
      user.memberships.some((membership) => membership.companyId === companyId),
    ).length;
  }

  function openCreate() {
    setEditingId(null);
    setDraft(emptyCompanyDraft());
    setErrors({});
    setSheetMode("create");
  }

  function openEdit(company: Company) {
    if (!can(permissions, "company.update") && !can(permissions, "company.read")) return;
    setEditingId(company.id);
    setDraft(companyToDraft(company));
    setErrors({});
    setSheetMode("edit");
  }

  function closeSheet() {
    setSheetMode(null);
    setEditingId(null);
    setErrors({});
  }

  function validate(next: CompanyDraft) {
    const nextErrors: Partial<Record<keyof CompanyDraft, string>> = {};
    if (!next.legalName.trim()) nextErrors.legalName = t("errors.legalName");
    if (!next.name.trim()) nextErrors.name = t("errors.name");
    if (!next.currency.trim()) nextErrors.currency = t("errors.currency");
    return nextErrors;
  }

  function saveDraft() {
    if (sheetMode === "edit" && !can(permissions, "company.update")) return;
    if (sheetMode === "create" && !can(permissions, "company.create")) return;

    const nextErrors = validate(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (sheetMode === "create") {
      const id = `co-${Date.now()}`;
      const created: Company = {
        id,
        name: draft.name.trim(),
        legalName: draft.legalName.trim(),
        currency: draft.currency.trim().toUpperCase(),
        status: "ACTIVE",
        siret: draft.siret.trim() || undefined,
        vatNumber: draft.vatNumber.trim() || undefined,
        naf: draft.naf.trim() || undefined,
        iban: draft.iban.trim() || undefined,
        bic: draft.bic.trim() || undefined,
        address: draft.address.trim() || undefined,
        logoUrl: draft.logoUrl.trim() || undefined,
        subtitle: `Tenant DFM · ${draft.currency.trim().toUpperCase()}`,
      };
      setCompanies((current) => [created, ...current]);
    } else if (sheetMode === "edit" && editingId) {
      setCompanies((current) =>
        current.map((company) =>
          company.id === editingId
            ? {
                ...company,
                name: draft.name.trim(),
                legalName: draft.legalName.trim(),
                currency: draft.currency.trim().toUpperCase(),
                siret: draft.siret.trim() || undefined,
                vatNumber: draft.vatNumber.trim() || undefined,
                naf: draft.naf.trim() || undefined,
                iban: draft.iban.trim() || undefined,
                bic: draft.bic.trim() || undefined,
                address: draft.address.trim() || undefined,
                logoUrl: draft.logoUrl.trim() || undefined,
                subtitle: `Tenant DFM · ${draft.currency.trim().toUpperCase()}`,
              }
            : company,
        ),
      );
    }
    closeSheet();
  }

  function archiveCompany(companyId: string) {
    setCompanies((current) =>
      current.map((company) =>
        company.id === companyId ? { ...company, status: "ARCHIVED" as const } : company,
      ),
    );
    setArchiveId(null);
    if (editingId === companyId) closeSheet();
  }

  function activateCompany(companyId: string) {
    setCompanies((current) =>
      current.map((company) =>
        company.id === companyId ? { ...company, status: "ACTIVE" as const } : company,
      ),
    );
  }

  const canEdit = can(permissions, "company.update");
  const canArchive = can(permissions, "company.archive");
  const showArchive =
    sheetMode === "edit" && editing?.status === "ACTIVE" && canArchive;
  const showActivate =
    sheetMode === "edit" && editing?.status === "ARCHIVED" && (canArchive || canEdit);

  return (
    <SettingsShell>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:overflow-hidden">
        <section className="dashboard-card dashboard-list dashboard-enter flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden lg:h-full">
          <div className="flex shrink-0 min-w-0 flex-col gap-2 border-b border-[rgb(217_227_238/0.72)] px-3.5 py-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="relative min-w-0 flex-1 basis-[220px]">
              <span className="sr-only">{t("search")}</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#8a97ab]"
              />
              <input
                className="h-9 w-full rounded-[10px] border border-[#dfe6f1] bg-white pr-3 pl-9 text-[13px] text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/30"
                placeholder={t("search")}
                value={query}
                onChange={(event) => {
                  setPage(0);
                  setQuery(event.target.value);
                }}
              />
            </label>
            <SoftSelect
              className="w-full min-w-[148px] sm:w-[160px]"
              hideLabel
              label={t("statusFilter")}
              options={[
                { value: "all", label: t("allStatuses") },
                { value: "ACTIVE", label: t("status.ACTIVE") },
                { value: "ARCHIVED", label: t("status.ARCHIVED") },
              ]}
              triggerClassName="h-9 rounded-[10px] text-[12px]"
              value={statusFilter}
              onChange={(value) => {
                setPage(0);
                setStatusFilter(value as "all" | CompanyStatus);
              }}
            />
            <Can permission="company.create" permissions={permissions}>
              <button
                className="action-motion soft-primary inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-[10px] px-3 text-xs font-semibold text-white sm:w-auto"
                type="button"
                onClick={openCreate}
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                {t("add")}
              </button>
            </Can>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <Building2 aria-hidden="true" className="h-8 w-8 text-[#b7c3d6]" />
              <p className="text-sm font-semibold text-[#24334c]">{t("empty")}</p>
            </div>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="dashboard-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                <ul className="divide-y divide-[rgb(220_229_239/0.7)]">
                  {paged.map((company) => {
                    const active = sheetMode === "edit" && company.id === editingId;
                    return (
                      <li key={company.id}>
                        <button
                          className={cn(
                            "flex w-full min-w-0 items-start gap-3 px-3.5 py-3 text-left transition-colors duration-150 sm:px-4",
                            active ? "bg-[#f2f6ff]" : "hover:bg-[#f7fafd]",
                          )}
                          type="button"
                          onClick={() => openEdit(company)}
                        >
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-[#e7efff] text-[#044ce2]">
                            <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 flex-wrap items-center gap-2">
                              <span
                                className="dashboard-list__primary truncate"
                                title={company.name}
                              >
                                {company.name}
                              </span>
                              <StatusBadge
                                size="xs"
                                tone={company.status === "ACTIVE" ? "green" : "slate"}
                              >
                                {t(`status.${company.status}`)}
                              </StatusBadge>
                            </span>
                            <span
                              className="mt-0.5 block truncate text-[12px] text-[#7a899e]"
                              title={company.legalName}
                            >
                              {company.legalName}
                            </span>
                            <span className="dashboard-list__secondary mt-1 block">
                              {company.currency} ·{" "}
                              {t("userCount", { count: memberCount(company.id) })}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex shrink-0 min-w-0 flex-wrap items-center justify-between gap-2 border-t border-[#edf2f8] px-3.5 py-2.5 text-[11px] text-[#7d8aa0]">
                <p>
                  {t("pagination.summary", {
                    from: rangeFrom,
                    to: rangeTo,
                    total: filtered.length,
                  })}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={t("pagination.pageSize")}
                    className="soft-input h-8 rounded-[8px] px-2 text-[11px] font-semibold text-[#405069]"
                    value={pageSize}
                    onChange={(event) => {
                      setPage(0);
                      setPageSize(Number(event.target.value));
                    }}
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {t("pagination.rowsPerPage", { count: size })}
                      </option>
                    ))}
                  </select>
                  <button
                    className="soft-button h-8 rounded-[8px] px-2.5 text-[11px] font-semibold disabled:opacity-40"
                    disabled={safePage === 0}
                    type="button"
                    onClick={() => setPage((value) => Math.max(0, value - 1))}
                  >
                    {t("pagination.prev")}
                  </button>
                  <button
                    className="soft-button h-8 rounded-[8px] px-2.5 text-[11px] font-semibold disabled:opacity-40"
                    disabled={safePage >= pageCount - 1}
                    type="button"
                    onClick={() =>
                      setPage((value) => Math.min(pageCount - 1, value + 1))
                    }
                  >
                    {t("pagination.next")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <SettingsSheet
        description={sheetMode === "create" ? t("sheet.createBody") : t("sheet.editBody")}
        open={sheetMode !== null}
        title={sheetMode === "create" ? t("sheet.createTitle") : t("sheet.editTitle")}
        widthClassName="sm:max-w-[520px]"
        onClose={closeSheet}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            {showArchive ? (
              <button
                className="soft-button inline-flex min-h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-[#c9564f]"
                type="button"
                onClick={() => editingId && setArchiveId(editingId)}
              >
                <Archive aria-hidden="true" className="h-3.5 w-3.5" />
                {t("archive")}
              </button>
            ) : showActivate ? (
              <button
                className="soft-button inline-flex min-h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-[#044ce2]"
                type="button"
                onClick={() => editingId && activateCompany(editingId)}
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                {t("activate")}
              </button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2">
              <button
                className="soft-button min-h-10 rounded-[10px] px-3 text-sm font-semibold text-[#405069]"
                type="button"
                onClick={closeSheet}
              >
                {tCommon("dialogs.cancel")}
              </button>
              {(sheetMode === "create" || canEdit) && (
                <button
                  className="soft-primary min-h-10 rounded-[10px] px-3 text-sm font-semibold text-white"
                  type="button"
                  onClick={saveDraft}
                >
                  {sheetMode === "create" ? t("sheet.createSave") : t("sheet.editSave")}
                </button>
              )}
            </div>
          </div>
        }
      >
        <CompanyFormFields
          draft={draft}
          errors={errors}
          readOnly={sheetMode === "edit" && !canEdit}
          onChange={setDraft}
        />
      </SettingsSheet>

      <ConfirmDialog
        body={t("archiveConfirm.body")}
        cancelLabel={tCommon("dialogs.cancel")}
        confirmLabel={t("archive")}
        danger
        open={archiveId !== null}
        title={t("archiveConfirm.title")}
        onCancel={() => setArchiveId(null)}
        onConfirm={() => {
          if (archiveId) archiveCompany(archiveId);
        }}
      />
    </SettingsShell>
  );
}

function CompanyFormFields({
  draft,
  errors,
  onChange,
  readOnly = false,
}: {
  draft: CompanyDraft;
  errors: Partial<Record<keyof CompanyDraft, string>>;
  onChange: (draft: CompanyDraft) => void;
  readOnly?: boolean;
}) {
  const t = useTranslations("settingsCompanies");

  function field(key: keyof CompanyDraft, label: string, props?: { multiline?: boolean }) {
    const value = draft[key];
    return (
      <label className="block" htmlFor={`company-${key}`}>
        <span className="mb-1.5 block text-[11px] font-medium text-[#5f6f88]">{label}</span>
        {props?.multiline ? (
          <textarea
            className="min-h-[84px] w-full rounded-[10px] border border-[#dfe6f1] bg-white px-3 py-2 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/30 disabled:bg-[#f7fafd] disabled:text-[#66758d]"
            disabled={readOnly}
            id={`company-${key}`}
            value={value}
            onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
          />
        ) : (
          <input
            className="h-10 w-full rounded-[10px] border border-[#dfe6f1] bg-white px-3 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/30 disabled:bg-[#f7fafd] disabled:text-[#66758d]"
            disabled={readOnly}
            id={`company-${key}`}
            value={value}
            onChange={(event) => onChange({ ...draft, [key]: event.target.value })}
          />
        )}
        {errors[key] ? <span className="mt-1 block text-[11px] text-[#c9564f]">{errors[key]}</span> : null}
      </label>
    );
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-[12px] font-semibold tracking-[0.06em] text-[#7a899e] uppercase">
          {t("sections.identity")}
        </h3>
        {field("legalName", t("fields.legalName"))}
        {field("name", t("fields.name"))}
        {field("currency", t("fields.currency"))}
      </section>
      <section className="space-y-3">
        <h3 className="text-[12px] font-semibold tracking-[0.06em] text-[#7a899e] uppercase">
          {t("sections.legal")}
        </h3>
        {field("siret", t("fields.siret"))}
        {field("vatNumber", t("fields.vat"))}
        {field("naf", t("fields.naf"))}
      </section>
      <section className="space-y-3">
        <h3 className="text-[12px] font-semibold tracking-[0.06em] text-[#7a899e] uppercase">
          {t("sections.address")}
        </h3>
        {field("address", t("fields.address"), { multiline: true })}
      </section>
      <section className="space-y-3">
        <h3 className="text-[12px] font-semibold tracking-[0.06em] text-[#7a899e] uppercase">
          {t("sections.bank")}
        </h3>
        {field("iban", t("fields.iban"))}
        {field("bic", t("fields.bic"))}
      </section>
      <section className="space-y-3">
        <h3 className="text-[12px] font-semibold tracking-[0.06em] text-[#7a899e] uppercase">
          {t("sections.branding")}
        </h3>
        {field("logoUrl", t("fields.logo"))}
      </section>
    </div>
  );
}
