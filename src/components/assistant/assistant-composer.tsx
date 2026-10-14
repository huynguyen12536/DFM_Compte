"use client";

import { Paperclip, SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

/** Common office / mail formats + broad fallback for “other” types. */
export const ASSISTANT_FILE_ACCEPT = [
  ".eml",
  ".msg",
  ".xls",
  ".xlsx",
  ".csv",
  ".doc",
  ".docx",
  ".pdf",
  ".txt",
  ".rtf",
  ".odt",
  ".ods",
  ".ppt",
  ".pptx",
  ".json",
  ".xml",
  ".zip",
  "image/*",
  "text/*",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

export function AssistantComposer({
  value,
  disabled,
  autoFocus,
  onChange,
  onSend,
  onAttachFiles,
}: {
  value: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onAttachFiles: (files: File[]) => void;
}) {
  const t = useTranslations("assistant");
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const node = areaRef.current;
    if (!node) return;
    node.style.height = "0px";
    const next = Math.min(node.scrollHeight, 120);
    node.style.height = `${Math.max(24, next)}px`;
  }, [value]);

  useEffect(() => {
    if (!autoFocus) return;
    areaRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    if (disabled || !value.trim()) return;
    onSend();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (!files.length || disabled) return;
    onAttachFiles(files);
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <form className="assistant-composer-wrap shrink-0" onSubmit={handleSubmit}>
      <div className="assistant-composer flex items-end gap-1.5">
        <input
          accept={ASSISTANT_FILE_ACCEPT}
          className="sr-only"
          multiple
          ref={fileRef}
          type="file"
          onChange={handleFileChange}
        />
        <button
          aria-label={t("composer.attach")}
          className="grid h-10 w-10 shrink-0 place-items-center bg-transparent text-[#063586] transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
          title={t("composer.attachHint")}
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip aria-hidden="true" className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <label className="sr-only" htmlFor="compte-assistant-input">
          {t("composer.label")}
        </label>
        <textarea
          className="max-h-[120px] min-h-[24px] min-w-0 flex-1 resize-none bg-transparent px-1.5 py-2.5 text-[13px] leading-5 text-[#24334c] outline-none placeholder:text-[#9aa8bc] sm:px-2"
          id="compte-assistant-input"
          placeholder={t("composer.placeholder")}
          ref={areaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          aria-label={t("composer.send")}
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-[10px] transition-colors",
            canSend
              ? "bg-[#145be7] text-white hover:bg-[#114fc9]"
              : "bg-[#e8eef8] text-[#9aa8bc]",
          )}
          disabled={!canSend}
          type="submit"
        >
          <SendHorizontal aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
