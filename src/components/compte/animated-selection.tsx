"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { selectionReduced, selectionSpring } from "@/lib/motion";
import { cn } from "@/lib/utils";

export const SIDEBAR_ACTIVE_LAYOUT_ID = "compte-sidebar-active";
export const TOP_TABS_ACTIVE_LAYOUT_ID = "compte-top-tabs-active";
export const QUOTE_FILTER_ACTIVE_LAYOUT_ID = "compte-quote-filter-active";

export type ActiveIndicatorVariant = "sidebar" | "soft-pill";

const variantClass: Record<ActiveIndicatorVariant, string> = {
  sidebar:
    "rounded-[14px] border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(238,245,253,0.88))] shadow-[5px_6px_14px_rgba(78,108,145,0.11),-4px_-4px_11px_rgba(255,255,255,0.82),inset_0_1px_0_rgba(255,255,255,0.92)]",
  "soft-pill":
    "rounded-full border border-[rgba(99,138,221,0.28)] bg-[linear-gradient(145deg,#EDF4FF,#E4EEFF)] shadow-[inset_2px_2px_5px_rgba(71,101,165,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.78)]",
};

type AnimatedSelectionGroupProps = {
  id: string;
  children: ReactNode;
  className?: string;
};

/** Scopes shared layoutIds so unrelated selection groups never morph into each other. */
export function AnimatedSelectionGroup({
  id,
  children,
  className,
}: AnimatedSelectionGroupProps) {
  return (
    <LayoutGroup id={id}>
      <div className={className}>{children}</div>
    </LayoutGroup>
  );
}

type AnimatedActiveIndicatorProps = {
  layoutId: string;
  variant?: ActiveIndicatorVariant;
  className?: string;
  /** Override layout border radius (defaults: sidebar 14, soft-pill 9999). */
  borderRadius?: number;
};

/**
 * Single shared active surface. Render once inside the active item only —
 * Motion morphs the same layoutId between siblings.
 */
export function AnimatedActiveIndicator({
  layoutId,
  variant = "sidebar",
  className,
  borderRadius,
}: AnimatedActiveIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const radius = borderRadius ?? (variant === "sidebar" ? 14 : 9999);
  // useReducedMotion() is null on the server and boolean after mount — keep the
  // first paint identical to SSR to avoid a hydration mismatch.
  const transition = reduceMotion === true ? selectionReduced : selectionSpring;

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0",
        variantClass[variant],
        className,
      )}
      layoutId={layoutId}
      style={{ borderRadius: radius }}
      transition={transition}
    />
  );
}
