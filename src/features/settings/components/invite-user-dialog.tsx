"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Company, DataScope, Role } from "../types";

type InviteForm = {
  email: string;
  name: string;
  roleId: string;
  dataScope: DataScope;
  companyIds: string[];
};

export function InviteUserDialog({
  open,
  roles,
  companies,
  onClose,
}: {
  open: boolean;
  roles: Role[];
  companies: Company[];
  onClose: () => void;
}) {
  const t = useTranslations("usersPermissions");
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<InviteForm>({
    email: "",
    name: "",
    roleId: roles[0]?.id ?? "sales",
    dataScope: "OWN",
    companyIds: companies[0] ? [companies[0].id] : [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof InviteForm, string>>>({});

  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function toggleCompany(companyId: string) {
    setForm((current) => {
      const exists = current.companyIds.includes(companyId);
      return {
        ...current,
        companyIds: exists
          ? current.companyIds.filter((id) => id !== companyId)
          : [...current.companyIds, companyId],
      };
    });
  }

  function submit() {
    const nextErrors: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = t("invite.errors.email");
    }
    if (!form.roleId) nextErrors.roleId = t("invite.errors.role");
    if (!form.dataScope) nextErrors.dataScope = t("invite.errors.scope");
    if (form.dataScope !== "TENANT" && form.companyIds.length === 0) {
      nextErrors.companyIds = t("invite.errors.companies");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-[#063586]/30 px-4 pt-[8vh]">
      <button
        aria-label={t("dialogs.close")}
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />
      <form
        aria-labelledby="invite-user-title"
        className="relative z-10 max-h-[84dvh] w-full max-w-[480px] overflow-y-auto rounded-[18px] bg-white p-5 shadow-[0_22px_70px_rgb(29_43_68/0.16)] ring-1 ring-[#e1e7f1]"
        role="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#063586]" id="invite-user-title">
              {t("invite.title")}
            </h2>
            <p className="mt-1 text-sm text-[#728097]">{t("invite.body")}</p>
          </div>
          <button
            aria-label={t("dialogs.close")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[#dfe6f1] text-[#506078]"
            type="button"
            onClick={onClose}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Field
            error={errors.email}
            id="invite-email"
            label={t("invite.email")}
            required
          >
            <input
              ref={firstFieldRef}
              aria-invalid={errors.email ? true : undefined}
              className={inputClass(Boolean(errors.email))}
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </Field>

          <Field id="invite-name" label={t("invite.name")}>
            <input
              className={inputClass(false)}
              id="invite-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>

          <Field error={errors.roleId} id="invite-role" label={t("invite.role")} required>
            <select
              className={inputClass(Boolean(errors.roleId))}
              id="invite-role"
              value={form.roleId}
              onChange={(event) => {
                const role = roles.find((entry) => entry.id === event.target.value);
                setForm((current) => ({
                  ...current,
                  roleId: event.target.value,
                  dataScope: role?.defaultScope ?? current.dataScope,
                }));
              }}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {t(role.nameKey)}
                </option>
              ))}
            </select>
          </Field>

          <Field error={errors.dataScope} id="invite-scope" label={t("invite.scope")} required>
            <select
              className={inputClass(Boolean(errors.dataScope))}
              id="invite-scope"
              value={form.dataScope}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dataScope: event.target.value as DataScope,
                }))
              }
            >
              <option value="OWN">{t("scope.OWN")}</option>
              <option value="COMPANY">{t("scope.COMPANY")}</option>
              <option value="TENANT">{t("scope.TENANT")}</option>
            </select>
          </Field>

          {form.dataScope !== "TENANT" ? (
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-[#405069]">
                {t("invite.companies")}
                <span className="text-[#8e2a26]"> *</span>
              </legend>
              <div className="space-y-1.5 rounded-[12px] border border-[#dfe6f1] p-2">
                {companies.map((company) => {
                  const checked = form.companyIds.includes(company.id);
                  return (
                    <label
                      className="flex min-h-10 items-center gap-2 rounded-[10px] px-2 hover:bg-[#f4f8ff]"
                      key={company.id}
                    >
                      <input
                        checked={checked}
                        className="h-4 w-4 accent-[#044ce2]"
                        type="checkbox"
                        onChange={() => toggleCompany(company.id)}
                      />
                      <span className="text-sm text-[#24334c]">{company.name}</span>
                    </label>
                  );
                })}
              </div>
              {errors.companyIds ? (
                <span className="mt-1.5 block text-xs text-[#8e2a26]">{errors.companyIds}</span>
              ) : null}
            </fieldset>
          ) : (
            <p className="text-[12px] text-[#7a899e]">{t("invite.tenantHint")}</p>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            className="min-h-10 rounded-[10px] px-3 text-sm font-semibold text-[#405069]"
            type="button"
            onClick={onClose}
          >
            {t("dialogs.cancel")}
          </button>
          <button
            className="soft-primary min-h-10 rounded-[10px] px-3 text-sm font-semibold text-white"
            type="submit"
          >
            {t("invite.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1.5 block text-xs font-medium text-[#405069]">
        {label}
        {required ? <span className="text-[#8e2a26]"> *</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-[#8e2a26]">{error}</span> : null}
    </label>
  );
}

function inputClass(invalid: boolean) {
  return `h-10 w-full rounded-[12px] border bg-white px-3 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/35 ${
    invalid ? "border-[#c9564f]" : "border-[#dfe6f1]"
  }`;
}
