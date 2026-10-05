"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { PERMISSION_MODULES } from "../permissions";
import type { DataScope, PermissionId } from "../types";

export function CreateRoleDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("usersPermissions");
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState<DataScope>("COMPANY");
  const [selected, setSelected] = useState<PermissionId[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (open) nameRef.current?.focus();
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

  function toggle(permission: PermissionId) {
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  function submit() {
    if (!name.trim()) {
      setError(t("createRole.errors.name"));
      return;
    }
    setError(undefined);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-[#063586]/30 px-4 pt-[6vh]">
      <button
        aria-label={t("dialogs.close")}
        className="absolute inset-0 cursor-default"
        type="button"
        onClick={onClose}
      />
      <form
        aria-labelledby="create-role-title"
        className="relative z-10 max-h-[88dvh] w-full max-w-[560px] overflow-y-auto rounded-[18px] bg-white p-5 shadow-[0_22px_70px_rgb(29_43_68/0.16)] ring-1 ring-[#e1e7f1]"
        role="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#063586]" id="create-role-title">
              {t("createRole.title")}
            </h2>
            <p className="mt-1 text-sm text-[#728097]">{t("createRole.body")}</p>
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
          <label className="block" htmlFor="role-name">
            <span className="mb-1.5 block text-xs font-medium text-[#405069]">
              {t("createRole.name")}
              <span className="text-[#8e2a26]"> *</span>
            </span>
            <input
              ref={nameRef}
              className={`h-10 w-full rounded-[12px] border px-3 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/35 ${
                error ? "border-[#c9564f]" : "border-[#dfe6f1]"
              }`}
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {error ? <span className="mt-1.5 block text-xs text-[#8e2a26]">{error}</span> : null}
          </label>

          <label className="block" htmlFor="role-description">
            <span className="mb-1.5 block text-xs font-medium text-[#405069]">
              {t("createRole.description")}
            </span>
            <textarea
              className="min-h-[72px] w-full rounded-[12px] border border-[#dfe6f1] px-3 py-2 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/35"
              id="role-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className="block" htmlFor="role-scope">
            <span className="mb-1.5 block text-xs font-medium text-[#405069]">
              {t("createRole.scope")}
            </span>
            <select
              className="h-10 w-full rounded-[12px] border border-[#dfe6f1] px-3 text-sm text-[#063586] outline-none focus:ring-[3px] focus:ring-[#044ce2]/35"
              id="role-scope"
              value={scope}
              onChange={(event) => setScope(event.target.value as DataScope)}
            >
              <option value="OWN">{t("scope.OWN")}</option>
              <option value="COMPANY">{t("scope.COMPANY")}</option>
              <option value="TENANT">{t("scope.TENANT")}</option>
            </select>
          </label>

          <fieldset>
            <legend className="mb-2 text-xs font-medium text-[#405069]">
              {t("createRole.permissions")}
            </legend>
            <div className="max-h-[280px] space-y-3 overflow-y-auto rounded-[12px] border border-[#e1e7f1] p-3">
              {PERMISSION_MODULES.filter((module) => module.phase !== 2).map((module) => (
                <div key={module.id}>
                  <p className="text-[12px] font-semibold text-[#1b2d47]">{t(module.labelKey)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {module.capabilities.map((entry) => {
                      const checked = selected.includes(entry.permission);
                      return (
                        <label
                          className={`inline-flex min-h-9 items-center gap-1.5 rounded-[8px] border px-2 text-[11px] ${
                            checked
                              ? "border-[#b9d0fb] bg-[#eef4ff] text-[#1456d9]"
                              : "border-[#e1e7f1] bg-white text-[#5f6f88]"
                          }`}
                          key={entry.permission}
                        >
                          <input
                            checked={checked}
                            className="h-3.5 w-3.5 accent-[#044ce2]"
                            type="checkbox"
                            onChange={() => toggle(entry.permission)}
                          />
                          {t(`capabilities.${entry.capability}`)}
                          {entry.sensitive ? (
                            <span className="text-[9px] font-semibold text-[#b96d24]">
                              {t("matrix.sensitive")}
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
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
            {t("createRole.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
