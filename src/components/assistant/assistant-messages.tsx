"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import type { AssistantMessage } from "./types";

export function AssistantMessages({
  messages,
  busyLabel,
  busy,
  onSelectFollowUp,
}: {
  messages: AssistantMessage[];
  busy: boolean;
  busyLabel: string;
  onSelectFollowUp: (prompt: string) => void;
}) {
  const t = useTranslations("assistant");
  const endRef = useRef<HTMLDivElement | null>(null);
  const lastAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.id;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  return (
    <div className="flex flex-col gap-3">
      {messages.map((message) => {
        const isUser = message.role === "user";
        const showFollowUps =
          !isUser &&
          !busy &&
          message.id === lastAssistantId &&
          Boolean(message.followUps?.length);

        return (
          <div key={message.id} className="flex flex-col gap-2">
            <div
              className={cn("flex", isUser ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[84%] whitespace-pre-wrap break-words text-[13px] leading-5",
                  isUser
                    ? "rounded-[16px_16px_4px_16px] bg-[#1764e8] px-3.5 py-2.5 text-white"
                    : "rounded-[16px_16px_16px_4px] border border-[#e3eaf4] bg-[#f5f8fc] px-3.5 py-2.5 text-[#263750]",
                  isUser && "max-w-[80%]",
                )}
              >
                {message.content}
              </div>
            </div>

            {showFollowUps ? (
              <div className="flex max-w-[92%] flex-col gap-2 pl-0.5">
                <p className="text-[11px] font-semibold tracking-[0.02em] text-[#7d8aa0]">
                  {t("followUps.label")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {message.followUps?.map((prompt) => (
                    <button
                      className="rounded-full border border-[#d5e2f4] bg-white px-3 py-1.5 text-left text-[12px] font-semibold text-[#145be7] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-[#bfd6f8] hover:bg-[#f7faff]"
                      key={prompt}
                      type="button"
                      onClick={() => onSelectFollowUp(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
      {busy ? (
        <div className="flex justify-start">
          <div className="rounded-[16px_16px_16px_4px] border border-[#e3eaf4] bg-[#f5f8fc] px-3.5 py-2.5 text-[13px] text-[#7d8aa0]">
            {busyLabel}
          </div>
        </div>
      ) : null}
      <div ref={endRef} />
    </div>
  );
}
