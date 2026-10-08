"use client";

import { Archive, Building2, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

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

export function CompaniesPage() {
  const t = useTranslations("settingsCompanies");
  const tCommon = useTranslations("usersPermissions");
  const permissions = MOCK_ACTOR_PERMISSIONS;
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CompanyStatus>("all");
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

  const canEdit = can(permissions, "company.update");
  const showArchive =
    sheetMode === "edit" &&
    editing?.status === "ACTIVE" &&
    can(permissions, "company.archive");

  return (
    <SettingsShell description={t("page.description")} title={t("page.title")}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:overflow-hidden">
        <div className="flex shrink-0 min-w-0 flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <label className="relative min-w-0 flex-1 basis-[200px] max-w-md">
              <span className="sr-only">{t("search")}</span>
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#8a97ab]"
              />
              <input
                className="h-10 w-full rounded-[10px] border border-[#dfe6f1] bg-white pr-3 pl-9 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/30"
                placeholder={t("search")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <select
              aria-label={t("statusFilter")}
              className="h-10 min-w-[140px] rounded-[10px] border border-[#dfe6f1] bg-white px-2.5 text-sm font-medium text-[#405069]"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | CompanyStatus)}
            >
              <option value="all">{t("allStatuses")}</option>
              <option value="ACTIVE">{t("status.ACTIVE")}</option>
              <option value="ARCHIVED">{t("status.ARCHIVED")}</option>
            </select>
          </div>
          <Can permission="company.create" permissions={permissions}>
            <button
              className="action-motion soft-primary inline-flex min-h-10 items-center gap-1.5 rounded-[10px] px-3 text-sm font-semibold text-white"
              type="button"
              onClick={openCreate}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              {t("add")}
            </button>
          </Can>
        </div>

        <section className="dashboard-card dashboard-list dashboard-enter flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden lg:h-full">
          <div className="dashboard-scroll min-h-0 flex-1 overflow-auto">
            <ul className="divide-y divide-[rgb(220_229_239/0.7)]">
              {filtered.length === 0 ? (
                <li className="px-4 py-10 text-center text-sm text-[#7a899e]">{t("empty")}</li>
              ) : (
                filtered.map((company) => {
                  const active = sheetMode === "edit" && company.id === editingId;
                  return (
                    <li key={company.id}>
                      <button
                        className={cn(
                          "flex w-full min-w-0 items-start gap-3 px-4 py-3 text-left transition-colors duration-150",
                          active ? "bg-[#f2f6ff]" : "hover:bg-[#f7fafd]",
                        )}
                        type="button"
                        onClick={() => openEdit(company)}
                      >
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-[#e7efff] text-[#044ce2]">
                          <Building2 aria-hidden="true" className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-semibold text-[#1b2d47]">
                              {company.name}
                            </span>
                            <StatusBadge
                              size="xs"
                              tone={company.status === "ACTIVE" ? "green" : "slate"}
                            >
                              {t(`status.${company.status}`)}
                            </StatusBadge>
                          </span>
                          <span className="mt-0.5 block truncate text-[12px] text-[#7a899e]">
                            {company.legalName}
                          </span>
                          <span className="mt-1 block text-[11px] text-[#66758d]">
                            {company.currency} · {t("userCount", { count: memberCount(company.id) })}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
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
