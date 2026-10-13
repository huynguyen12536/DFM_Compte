"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { SoftSelect } from "@/components/compte/soft-select";
import { FormSheet } from "@/components/forms/form-sheet";
import { seedCustomers } from "@/features/quotes/seed";

import type { ProjectStatus } from "../model";
import { createProject } from "../store";

export function NewProjectSheet({
  open,
  companyId,
  onClose,
  onCreated,
}: {
  open: boolean;
  companyId: string;
  onClose: () => void;
  onCreated: (projectId: string) => void;
}) {
  const t = useTranslations("projects");
  const [name, setName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  const customerOptions = useMemo(
    () =>
      seedCustomers.map((customer) => ({
        value: customer.id,
        label: customer.name,
      })),
    [],
  );

  function submit() {
    if (!name.trim() || !customerId) {
      setError(t("form.required"));
      return;
    }
    const customer = seedCustomers.find((item) => item.id === customerId);
    const project = createProject({
      name,
      customerId,
      customerName: customer?.name ?? customerId,
      companyId,
      code: code || undefined,
      description,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
    });
    onCreated(project.id);
  }

  return (
    <FormSheet
      open={open}
      title={t("form.createTitle")}
      widthClassName="sm:max-w-[480px]"
      zIndexClassName="z-[70]"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            className="action-motion soft-button h-9 rounded-[9px] px-3 text-xs font-semibold text-[#405069]"
            type="button"
            onClick={onClose}
          >
            {t("form.cancel")}
          </button>
          <button
            className="action-motion soft-primary h-9 rounded-[9px] px-3 text-xs font-semibold text-white"
            type="button"
            onClick={submit}
          >
            {t("form.create")}
          </button>
        </div>
      }
    >
      <div className="space-y-3 px-1 py-1">
        <Field label={`${t("form.name")} *`}>
          <input
            className="h-9 w-full rounded-[9px] border border-[#e1e7f1] px-2.5 text-xs outline-none focus:border-[#044ce2]"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label={`${t("form.customer")} *`}>
          <SoftSelect
            label={t("form.customer")}
            hideLabel
            options={[
              { value: "", label: t("form.selectCustomer") },
              ...customerOptions,
            ]}
            value={customerId}
            onChange={setCustomerId}
          />
        </Field>
        <Field label={t("form.code")}>
          <input
            className="h-9 w-full rounded-[9px] border border-[#e1e7f1] px-2.5 text-xs outline-none focus:border-[#044ce2]"
            placeholder={t("form.codeHint")}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </Field>
        <Field label={t("form.description")}>
          <textarea
            className="min-h-[72px] w-full rounded-[9px] border border-[#e1e7f1] px-2.5 py-2 text-xs outline-none focus:border-[#044ce2]"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t("form.startDate")}>
            <input
              className="h-9 w-full rounded-[9px] border border-[#e1e7f1] px-2.5 text-xs outline-none focus:border-[#044ce2]"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label={t("form.endDate")}>
            <input
              className="h-9 w-full rounded-[9px] border border-[#e1e7f1] px-2.5 text-xs outline-none focus:border-[#044ce2]"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
        </div>
        <Field label={t("form.status")}>
          <SoftSelect
            label={t("form.status")}
            hideLabel
            options={(
              ["draft", "active", "completed", "on_hold", "archived"] as const
            ).map((value) => ({
              value,
              label: t(`status.${value}`),
            }))}
            value={status}
            onChange={(value) => setStatus(value as ProjectStatus)}
          />
        </Field>
        {error ? <p className="text-[11px] text-[#c9564f]">{error}</p> : null}
        <p className="text-[10px] text-[#98a4b5]">{t("form.statusNote")}</p>
      </div>
    </FormSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[10px] font-semibold text-[#7d8aa0]">{label}</span>
      {children}
    </label>
  );
}
