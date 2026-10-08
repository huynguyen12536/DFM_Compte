"use client";

import { useEffect, useState, type ReactNode } from "react";

import { ContentLoadingScreen } from "./content-loading-screen";

const DEFAULT_MIN_MS = 380;

/**
 * Shows the shared content loading screen on mount (route enter),
 * matching dashboard navigation feedback for client-heavy pages.
 */
export function RouteContentGate({
  children,
  minMs = DEFAULT_MIN_MS,
}: {
  children: ReactNode;
  minMs?: number;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduceMotion ? 0 : minMs;
    const timer = window.setTimeout(() => setReady(true), delay);
    return () => window.clearTimeout(timer);
  }, [minMs]);

  if (!ready) {
    return <ContentLoadingScreen />;
  }

  return children;
}
