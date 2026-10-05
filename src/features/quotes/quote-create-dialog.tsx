"use client";

import { useRouter } from "@/i18n/navigation";
import { TextField } from "@/components/forms/text-field";
import { demoAccess } from "@/lib/session";
import { owners } from "@/features/quotes/seed";
import { addCustomer, addQuote } from "@/features/quotes/store";
import type { CustomerRecord } from "@/features/quotes/model";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";

export function QuoteCreateDialog({
  customers,
  forceNewCustomer,
  onClose,
}: {
  customers: CustomerRecord[];
  forceNewCustomer: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("register.create");
  const shell = useTranslations("register");
  const router = useRouter();
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [openList, setOpenList] = useState(forceNewCustomer);
  const [errors, setErrors] = useState<{ customer?: string; validity?: string; owner?: string }>({});

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return customers.filter((customer) => customer.name.toLowerCase().includes(needle)).slice(0, 6);
  }, [customers, query]);

  const canCreate = demoAccess.canCreateCustomer && query.trim().length > 1 && !matches.some((customer) => customer.name.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function submit() {
    const nextErrors: typeof errors = {};
    if (!customerId && !(canCreate && query.trim())) nextErrors.customer = t("customerRequired");
    if (!validUntil) nextErrors.validity = t("validityRequired");
    if (!ownerId) nextErrors.owner = t("ownerRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const customer = customerId
      ? customers.find((item) => item.id === customerId)
      : addCustomer(query.trim());
    if (!customer) {
      setErrors({ customer: t("customerRequired") });
      return;
    }
    const quote = addQuote({
      customerId: customer.id,
      ownerId,
      validUntil,
    });
    router.push(`/devis/${quote.id}`);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-[#063586]/30 px-4 pt-[14vh]">
      <button className="absolute inset-0 cursor-default" type="button" aria-label={t("title")} onClick={onClose} />
      <form
        className="relative z-10 w-full max-w-[440px] rounded-[18px] bg-white p-5 shadow-[0_22px_70px_rgb(29_43_68/0.16)] ring-1 ring-[#e1e7f1]"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#063586]">{t("title")}</h2>
        <p className="mt-1 text-sm text-[#728097]">{t("body")}</p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#405069]" htmlFor="quote-customer">
              {t("customer")}
              <span className="text-[#8e2a26]"> *</span>
            </label>
            <input
              ref={inputRef}
              id="quote-customer"
              role="combobox"
              aria-expanded={openList}
              aria-controls={listId}
              aria-invalid={errors.customer ? true : undefined}
              aria-describedby={errors.customer ? "quote-customer-error" : undefined}
              className={`h-10 w-full rounded-[12px] border bg-white px-3 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/35 ${
                errors.customer ? "border-[#c9564f]" : "border-[#dfe6f1]"
              }`}
              placeholder={t("customerPlaceholder")}
              value={query}
              onFocus={() => setOpenList(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setCustomerId("");
                setOpenList(true);
              }}
            />
            {openList ? (
              <ul id={listId} role="listbox" className="mt-1 overflow-hidden rounded-[12px] border border-[#e1e7f1] bg-white">
                {matches.map((customer) => (
                  <li key={customer.id}>
                    <button
                      className="flex min-h-10 w-full items-center px-3 text-left text-sm text-[#24334c] hover:bg-[#f4f8ff]"
                      type="button"
                      onClick={() => {
                        setCustomerId(customer.id);
                        setQuery(customer.name);
                        setOpenList(false);
                      }}
                    >
                      {customer.name}
                    </button>
                  </li>
                ))}
                {canCreate ? (
                  <li>
                    <button
                      className="flex min-h-10 w-full items-center px-3 text-left text-sm font-medium text-[#044ce2] hover:bg-[#f4f8ff]"
                      type="button"
                      onClick={() => setOpenList(false)}
                    >
                      {t("createCustomer", { name: query.trim() })}
                    </button>
                  </li>
                ) : null}
              </ul>
            ) : null}
            {errors.customer ? (
              <span id="quote-customer-error" className="mt-1.5 block text-xs text-[#8e2a26]">
                {errors.customer}
              </span>
            ) : null}
          </div>
          <TextField
            id="quote-validity"
            label={t("validity")}
            type="date"
            required
            value={validUntil}
            error={errors.validity}
            onChange={setValidUntil}
          />
          <label className="block" htmlFor="quote-owner">
            <span className="mb-1.5 block text-xs font-medium text-[#405069]">
              {t("owner")}
              <span className="text-[#8e2a26]"> *</span>
            </span>
            <select
              id="quote-owner"
              className="h-10 w-full rounded-[12px] border border-[#dfe6f1] bg-white px-3 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/35"
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button className="min-h-10 rounded-[10px] px-3 text-sm font-semibold text-[#405069]" type="button" onClick={onClose}>
            {shell("cancel")}
          </button>
          <button className="min-h-10 rounded-[10px] bg-[#044ce2] px-3 text-sm font-semibold text-white hover:bg-[#063586]" type="submit">
            {t("submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
