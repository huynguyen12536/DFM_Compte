"use client";

import { AssistantLauncher } from "./assistant-launcher";
import { useAssistant } from "./assistant-provider";
import { AssistantWindow } from "./assistant-window";

/** Global COMPTA Assistant chrome — requires AssistantProvider in AppShell. */
export function FloatingAssistant() {
  const { open } = useAssistant();

  return (
    <>
      {!open ? <AssistantLauncher /> : null}
      <AssistantWindow />
    </>
  );
}
