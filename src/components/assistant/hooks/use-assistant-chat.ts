"use client";

import { useLocale } from "next-intl";
import { useCallback, useState } from "react";

import { resolveDemoReply } from "../demo-replies";
import type { AssistantConversation, AssistantMessage } from "../types";

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromMessages(messages: AssistantMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) return null;
  const text = firstUser.content.trim();
  if (text.length <= 48) return text;
  return `${text.slice(0, 45)}…`;
}

function createEmptyConversation(): AssistantConversation {
  const now = Date.now();
  return {
    id: createId("conv"),
    title: null,
    messages: [],
    updatedAt: now,
    createdAt: now,
  };
}

export function useAssistantChat() {
  const locale = useLocale();
  const [conversations, setConversations] = useState<AssistantConversation[]>(
    () => [createEmptyConversation()],
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const resolvedActiveId = activeId ?? conversations[0]?.id ?? "";
  const active =
    conversations.find((item) => item.id === resolvedActiveId) ??
    conversations[0];
  const messages = active?.messages ?? [];

  const patchActive = useCallback(
    (updater: (current: AssistantConversation) => AssistantConversation) => {
      setConversations((list) => {
        const currentId = activeId ?? list[0]?.id;
        return list.map((item) =>
          item.id === currentId ? updater(item) : item,
        );
      });
    },
    [activeId],
  );

  const startNewConversation = useCallback(() => {
    setBusy(false);
    setDraft("");
    setHistoryOpen(false);
    const next = createEmptyConversation();
    setConversations((list) => {
      const currentId = activeId ?? list[0]?.id;
      const current = list.find((item) => item.id === currentId);
      const kept = list.filter((item) => {
        if (item.id !== currentId) return true;
        return (current?.messages.length ?? 0) > 0;
      });
      return [next, ...kept];
    });
    setActiveId(next.id);
  }, [activeId]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    setDraft("");
    setBusy(false);
    setHistoryOpen(false);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((list) => {
        const next = list.filter((item) => item.id !== id);
        if (next.length === 0) {
          const fresh = createEmptyConversation();
          setActiveId(fresh.id);
          return [fresh];
        }
        const currentId = activeId ?? list[0]?.id;
        if (id === currentId) {
          setActiveId(next[0].id);
        }
        return next;
      });
      setDraft("");
      setBusy(false);
    },
    [activeId],
  );

  const sendMessage = useCallback(
    async (raw: string) => {
      const content = raw.trim();
      if (!content) return;

      const userMessage: AssistantMessage = {
        id: createId("msg"),
        role: "user",
        content,
        createdAt: Date.now(),
      };

      patchActive((current) => ({
        ...current,
        title: current.title ?? titleFromMessages([userMessage]),
        messages: [...current.messages, userMessage],
        updatedAt: Date.now(),
      }));
      setDraft("");
      setBusy(true);
      setHistoryOpen(false);

      await new Promise((resolve) => window.setTimeout(resolve, 420));

      const demo = resolveDemoReply(content, locale);
      const assistantMessage: AssistantMessage = {
        id: createId("msg"),
        role: "assistant",
        content: demo.reply,
        followUps: demo.followUps,
        createdAt: Date.now(),
      };

      patchActive((current) => ({
        ...current,
        messages: [...current.messages, assistantMessage],
        updatedAt: Date.now(),
      }));
      setBusy(false);
    },
    [locale, patchActive],
  );

  const attachFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      const isFr = locale.toLowerCase().startsWith("fr");
      const attachments = files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      }));
      const count = attachments.length;
      const userContent = isFr
        ? count === 1
          ? `Fichier joint : ${attachments[0].name}`
          : `${count} fichiers joints`
        : count === 1
          ? `Attached file: ${attachments[0].name}`
          : `${count} attached files`;

      const userMessage: AssistantMessage = {
        id: createId("msg"),
        role: "user",
        content: userContent,
        createdAt: Date.now(),
        attachments,
      };

      patchActive((current) => ({
        ...current,
        title: current.title ?? titleFromMessages([userMessage]),
        messages: [...current.messages, userMessage],
        updatedAt: Date.now(),
      }));
      setBusy(true);
      setHistoryOpen(false);

      // Mock upload / analysis delay for UI testing.
      await new Promise((resolve) => window.setTimeout(resolve, 4000));

      const fileLines = attachments.flatMap((file, index) => {
        const sizeKb = Math.max(1, Math.round(file.size / 1024));
        if (isFr) {
          return [
            `${index + 1}. ${file.name}`,
            `   • Taille : ${sizeKb} Ko`,
            `   • Type : ${file.type || "inconnu"}`,
          ];
        }
        return [
          `${index + 1}. ${file.name}`,
          `   • Size: ${sizeKb} KB`,
          `   • Type: ${file.type || "unknown"}`,
        ];
      });

      const assistantMessage: AssistantMessage = {
        id: createId("msg"),
        role: "assistant",
        content: isFr
          ? [
              count === 1
                ? "Fichier reçu (démo)."
                : `${count} fichiers reçus (démo).`,
              "",
              ...fileLines,
              "",
              "Aucun traitement réel n’a été lancé — confirmation mock pour tester l’UI.",
            ].join("\n")
          : [
              count === 1
                ? "File received (demo)."
                : `${count} files received (demo).`,
              "",
              ...fileLines,
              "",
              "No real processing ran — mock confirmation for UI testing only.",
            ].join("\n"),
        followUps: isFr
          ? [
              "Quelles factures sont en retard ?",
              "Résume mon pipeline de devis",
              "Qu’est-ce qui a changé aujourd’hui ?",
            ]
          : [
              "Which invoices are overdue?",
              "Summarize my quote pipeline",
              "What changed today?",
            ],
        createdAt: Date.now(),
      };

      patchActive((current) => ({
        ...current,
        messages: [...current.messages, assistantMessage],
        updatedAt: Date.now(),
      }));
      setBusy(false);
    },
    [locale, patchActive],
  );

  return {
    conversations,
    activeConversationId: active?.id ?? resolvedActiveId,
    messages,
    draft,
    setDraft,
    busy,
    historyOpen,
    setHistoryOpen,
    sendMessage,
    attachFiles,
    startNewConversation,
    selectConversation,
    deleteConversation,
    clearConversation: startNewConversation,
    hasMessages: messages.length > 0,
  };
}
