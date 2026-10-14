"use client";

import { SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useEffect,
  useRef,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

export function AssistantComposer({
  value,
  disabled,
  autoFocus,
  onChange,
  onSend,
}: {
  value: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  const t = useTranslations("assistant");
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

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

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <form className="assistant-composer-wrap shrink-0" onSubmit={handleSubmit}>
      <div className="assistant-composer flex items-end gap-2">
        <label className="sr-only" htmlFor="compte-assistant-input">
          {t("composer.label")}
        </label>
        <textarea
          className="max-h-[120px] min-h-[24px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[13px] leading-5 text-[#24334c] outline-none placeholder:text-[#9aa8bc]"
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
            "grid h-11 w-11 shrink-0 place-items-center rounded-[12px] transition-colors",
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
