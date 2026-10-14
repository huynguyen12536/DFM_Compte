"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
} from "@/components/compte/animated-selection";
import { SoftToast } from "@/components/compte/soft-toast";
import { FormSheet } from "@/components/forms/form-sheet";
import { cn } from "@/lib/utils";

import { CountrySelectField } from "./country-select-field";
import { PhoneInputField } from "./phone-input-field";

import {
  buildCustomerRecord,
  canSaveCustomerDraft,
  getCustomerDraftSaveIssues,
  initialCustomerDraft,
  type CustomerDraft,
  type CustomerDraftSaveField,
} from "../customer-draft";
import { AVAILABLE_TAGS, QUOTE_TEMPLATES } from "../mocks/customers";
import { isOptionalSiretValid, lookupSiret } from "../services/siret-lookup";
import type {
  CustomerOwner,
  CustomerRecord,
  PaymentMethod,
  PaymentTerms,
  SiretLookupState,
} from "../types";

function saveIssueMessage(
  t: ReturnType<typeof useTranslations<"customers">>,
  field: CustomerDraftSaveField,
) {
  switch (field) {
    case "displayName":
      return t("form.requiredName");
    case "legalName":
      return t("form.requiredLegalName");
    case "email":
      return t("form.requiredEmail");
    case "website":
      return t("form.invalidWebsite");
  }
}

/** Create-only customer sheet. Edit happens inline in CustomerDetailsPanel. */
export function CustomerFormDialog({
  open,
  owners,
  onClose,
  onSubmit,
  onDuplicateFound,
}: {
  open: boolean;
  owners: CustomerOwner[];
  onClose: () => void;
  onSubmit: (customer: CustomerRecord) => void;
  onDuplicateFound: (draft: CustomerRecord, resume: () => void) => void;
}) {
  const t = useTranslations("customers");
  const defaultOwner = owners[0]?.id ?? "fm";
  const [draft, setDraft] = useState<CustomerDraft>(() => initialCustomerDraft(defaultOwner));
  const [siretState, setSiretState] = useState<SiretLookupState>("idle");
  const [siretTouched, setSiretTouched] = useState(false);
  const [error, setError] = useState("");
  const [invalidFields, setInvalidFields] = useState<CustomerDraftSaveField[]>([]);

  const canSave = useMemo(() => canSaveCustomerDraft(draft), [draft]);

  function patch(partial: Partial<CustomerDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setInvalidFields((current) =>
      current.filter((field) => {
        if (field in partial) return false;
        return true;
      }),
    );
  }

  async function handleSiretLookup() {
    setSiretState("loading");
    setError("");
    try {
      const result = await lookupSiret(draft.siret);
      if (!result) {
        setSiretState("not_found");
        return;
      }
      patch({
        legalName: result.legalName,
        displayName: draft.displayName || result.legalName,
        vatNumber: result.vatNumber,
        billingLine1: result.address.line1,
        billingCity: result.address.city,
        billingPostalCode: result.address.postalCode,
        billingCountry: result.address.country,
        billingCountryCode: result.address.countryCode,
        siretFilled: true,
      });
      setSiretState("found");
    } catch {
      setSiretState("error");
    }
  }

  function focusFirstInvalid(fields: CustomerDraftSaveField[]) {
    const first = fields[0];
    if (!first) return;
    window.requestAnimationFrame(() => {
      const node = document.getElementById(`customer-field-${first}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (node instanceof HTMLInputElement) node.focus({ preventScroll: true });
    });
  }

  function handleSave(force = false) {
    if (draft.type === "company" && !isOptionalSiretValid(draft.siret)) {
      setSiretTouched(true);
      setSiretState("error");
      setError(t("form.siretError"));
      return;
    }
    const issues = getCustomerDraftSaveIssues(draft);
    if (issues.length > 0) {
      setInvalidFields(issues);
      setError(saveIssueMessage(t, issues[0]));
      focusFirstInvalid(issues);
      return;
    }
    const record = buildCustomerRecord(draft);
    if (!force) {
      onDuplicateFound(record, () => handleSave(true));
      return;
    }
    onSubmit(record);
    setDraft(initialCustomerDraft(defaultOwner));
    setSiretState("idle");
    setError("");
    setInvalidFields([]);
    onClose();
  }

  return (
    <FormSheet
      closeLabel={t("form.cancel")}
      description={t("form.body")}
      open={open}
      title={t("form.title")}
      widthClassName="sm:max-w-[520px]"
      zIndexClassName="z-[70]"
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2 sm:items-end">
          {!canSave ? (
            <p className="w-full text-left text-xs font-medium text-[#c46b12] sm:text-right">
              {t("form.requiredHint")}
            </p>
          ) : null}
          <div className="flex w-full flex-wrap justify-end gap-2">
            <button
              className="action-motion soft-button min-h-10 rounded-[10px] px-3 text-sm font-semibold text-[#516078]"
              onClick={onClose}
              type="button"
            >
              {t("form.cancel")}
            </button>
            <button
              className="action-motion soft-primary min-h-10 rounded-[10px] px-3 text-sm font-semibold text-white"
              onClick={() => handleSave(false)}
              type="button"
            >
              {t("form.save")}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <section>
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
            {t("form.type")}
          </p>
          <AnimatedSelectionGroup
            className="mt-2 inline-flex gap-1 rounded-full bg-[#eef3fa] p-1"
            id="customer-type"
          >
            {(["company", "individual"] as const).map((type) => {
              const active = draft.type === type;
              return (
                <button
                  className={cn(
                    "relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    active ? "text-[#2458d6]" : "text-[#7d8aa0]",
                  )}
                  key={type}
                  onClick={() => {
                    patch({ type });
                    if (type === "individual") {
                      setInvalidFields((current) =>
                        current.filter((field) => field !== "legalName"),
                      );
                    }
                  }}
                  type="button"
                >
                  {active ? (
                    <AnimatedActiveIndicator
                      layoutId="compte-customer-type-active"
                      variant="soft-pill"
                    />
                  ) : null}
                  <span className="relative z-[1]">{t(`type.${type}`)}</span>
                </button>
              );
            })}
          </AnimatedSelectionGroup>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
            {t("sections.identity")}
          </p>
          <Field
            error={
              invalidFields.includes("displayName") ? t("form.requiredName") : undefined
            }
            id="customer-field-displayName"
            label={draft.type === "company" ? t("fields.displayName") : t("fields.fullName")}
            onChange={(value) => patch({ displayName: value })}
            required
            value={draft.displayName}
          />
          {draft.type === "company" ? (
            <>
              <Field
                error={
                  invalidFields.includes("legalName") ? t("form.requiredLegalName") : undefined
                }
                id="customer-field-legalName"
                label={t("fields.legalName")}
                onChange={(value) => patch({ legalName: value })}
                required
                value={draft.legalName}
              />
              <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <Field
                  error={
                    siretTouched && !isOptionalSiretValid(draft.siret)
                      ? t("form.siretError")
                      : undefined
                  }
                  label={t("fields.siret")}
                  onBlur={() => setSiretTouched(true)}
                  onChange={(value) => {
                    setSiretState("idle");
                    patch({ siret: value, siretFilled: false });
                  }}
                  value={draft.siret}
                />
                <button
                  className="action-motion soft-button mt-5 min-h-10 rounded-[10px] px-3 text-xs font-semibold text-[#044ce2]"
                  onClick={handleSiretLookup}
                  type="button"
                >
                  {siretState === "loading" ? t("form.siretLoading") : t("form.lookupSiret")}
                </button>
              </div>
              {siretState === "found" ? (
                <p className="text-xs font-medium text-[#0f8a5f]">{t("form.siretFound")}</p>
              ) : null}
              {siretState === "not_found" ? (
                <p className="text-xs font-medium text-[#c46b12]">{t("form.siretNotFound")}</p>
              ) : null}
              {siretState === "error" ? (
                <p className="text-xs font-medium text-[#d1492a]">{t("form.siretError")}</p>
              ) : null}
              {draft.siretFilled ? (
                <p className="text-[11px] text-[#7d8aa0]">{t("form.siretAutofill")}</p>
              ) : null}
              <Field
                label={t("fields.vat")}
                onChange={(value) => patch({ vatNumber: value })}
                value={draft.vatNumber}
              />
            </>
          ) : null}
          <Field
            error={invalidFields.includes("email") ? t("form.requiredEmail") : undefined}
            id="customer-field-email"
            label={t("fields.email")}
            onChange={(value) => patch({ email: value })}
            required
            value={draft.email}
          />
          <PhoneInputField
            label={t("fields.phone")}
            onChange={(value) => patch({ phone: value })}
            value={draft.phone}
          />
          <Field
            error={invalidFields.includes("website") ? t("form.invalidWebsite") : undefined}
            id="customer-field-website"
            label={t("fields.website")}
            onChange={(value) => patch({ website: value })}
            value={draft.website}
          />
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
            {t("sections.contacts", { count: 1 })}
          </p>
          <Field
            label={t("fields.contactName")}
            onChange={(value) => patch({ contactName: value })}
            value={draft.contactName}
          />
          <Field
            label={t("fields.contactEmail")}
            onChange={(value) => patch({ contactEmail: value })}
            value={draft.contactEmail}
          />
          <PhoneInputField
            label={t("fields.contactPhone")}
            onChange={(value) => patch({ contactPhone: value })}
            value={draft.contactPhone}
          />
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
            {t("address.billing")}
          </p>
          <Field
            label={t("fields.line1")}
            onChange={(value) => patch({ billingLine1: value })}
            value={draft.billingLine1}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Field
              label={t("fields.postalCode")}
              onChange={(value) => patch({ billingPostalCode: value })}
              value={draft.billingPostalCode}
            />
            <Field
              label={t("fields.city")}
              onChange={(value) => patch({ billingCity: value })}
              value={draft.billingCity}
            />
          </div>
          <CountrySelectField
            label={t("fields.country")}
            valueCode={draft.billingCountryCode}
            onChange={(country) =>
              patch({
                billingCountry: country.name,
                billingCountryCode: country.code,
              })
            }
          />
          <label className="flex items-center gap-2 text-xs text-[#516078]">
            <input
              checked={draft.useBillingForDelivery}
              className="accent-[#044ce2]"
              onChange={(event) => patch({ useBillingForDelivery: event.target.checked })}
              type="checkbox"
            />
            {t("form.useBillingForDelivery")}
          </label>
        </section>

        <section className="space-y-2">
          <p className="text-[11px] font-bold tracking-[0.08em] text-[#98a4b5] uppercase">
            {t("sections.commercial")}
          </p>
          <SelectField
            label={t("fields.paymentTerms")}
            onChange={(value) => patch({ paymentTerms: value as PaymentTerms })}
            options={["net_15", "net_30", "net_45", "net_60", "upon_receipt"].map((value) => ({
              value,
              label: t(`terms.${value}`),
            }))}
            value={draft.paymentTerms}
          />
          <SelectField
            label={t("fields.paymentMethod")}
            onChange={(value) => patch({ paymentMethod: value as PaymentMethod })}
            options={["transfer", "check", "card", "direct_debit"].map((value) => ({
              value,
              label: t(`methods.${value}`),
            }))}
            value={draft.paymentMethod}
          />
          <SelectField
            label={t("fields.quoteTemplate")}
            onChange={(value) => patch({ defaultQuoteTemplate: value })}
            options={QUOTE_TEMPLATES.map((template) => ({
              value: template.id,
              label: t(`templates.${template.id}`),
            }))}
            value={draft.defaultQuoteTemplate}
          />
          <SelectField
            label={t("fields.owner")}
            onChange={(value) => patch({ ownerId: value })}
            options={owners.map((owner) => ({ value: owner.id, label: owner.name }))}
            value={draft.ownerId}
          />
          <p className="text-[11px] leading-5 text-[#7d8aa0]">{t("form.ownerHint")}</p>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_TAGS.filter((tag) => tag !== "Duplicate").map((tag) => {
              const active = draft.tags.includes(tag);
              return (
                <button
                  className={cn(
                    "rounded-[6px] px-2 py-1 text-[11px] font-semibold",
                    active ? "bg-[#e7efff] text-[#044ce2]" : "bg-[#eef3fa] text-[#66758d]",
                  )}
                  key={tag}
                  onClick={() =>
                    patch({
                      tags: active
                        ? draft.tags.filter((item) => item !== tag)
                        : [...draft.tags, tag],
                    })
                  }
                  type="button"
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>

      </div>

      {error ? (
        <SoftToast message={error} tone="error" onDismiss={() => setError("")} />
      ) : null}
    </FormSheet>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  required = false,
  error,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-[11px] font-medium text-[#7d8aa0]">
        {label}
        {required ? <span className="ml-0.5 text-[#d1492a]">*</span> : null}
      </span>
      <input
        aria-invalid={Boolean(error)}
        className={cn(
          "soft-input mt-1 min-h-10 w-full rounded-[10px] px-3 text-sm text-[#24334c] outline-none",
          error && "ring-1 ring-[#e7a59a]",
        )}
        id={id}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <p className="mt-1 text-xs font-medium text-[#d1492a]">{error}</p> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[#7d8aa0]">{label}</span>
      <select
        className="soft-input mt-1 min-h-10 w-full rounded-[10px] px-3 text-sm text-[#24334c] outline-none"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
