"use client";

import {
  History,
  MoreHorizontal,
  PanelRightOpen,
  ReceiptText,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import type { PaymentNextAction } from "../model";

export type PaymentMenuAction = "open" | "invoice" | "customer" | "activity" | "match";

export function PaymentRowMenu({
  canReconcile,
  nextAction,
  onAction,
}: {
  canReconcile: boolean;
  nextAction: PaymentNextAction;
  onAction: (action: PaymentMenuAction) => void;
}) {
  const t = useTranslations("payments.menu");
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const items: Array<{ action: PaymentMenuAction; icon: typeof PanelRightOpen }> = [
    { action: "open", icon: PanelRightOpen },
    { action: "invoice", icon: ReceiptText },
    { action: "customer", icon: Users },
    { action: "activity", icon: History },
  ];
  if (canReconcile && (nextAction === "match" || nextAction === "review")) {
    items.splice(1, 0, { action: "match", icon: PanelRightOpen });
  }

  useLayoutEffect(() => {
    if (!open) return;
    function updatePosition() {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = menu?.offsetWidth ?? 180;
      const menuHeight = menu?.offsetHeight ?? 180;
      const gap = 4;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      );
      const openBelow = rect.bottom + gap + menuHeight <= window.innerHeight - 8;
      const top = openBelow
        ? rect.bottom + gap
        : Math.max(8, rect.top - gap - menuHeight);
      setMenuBox({ top, left });
    }
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, items.length]);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("trigger")}
        className="action-motion soft-button grid h-8 w-8 place-items-center rounded-[8px] text-[#66758d]"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>
      {open
        ? createPortal(
            <ul
              ref={menuRef}
              className="fixed z-[80] min-w-[180px] overflow-hidden rounded-[12px] border border-[#e1e7f1] bg-white py-1 shadow-[0_12px_28px_rgba(29,43,68,0.14)]"
              id={menuId}
              role="menu"
              style={
                menuBox
                  ? { top: menuBox.top, left: menuBox.left }
                  : { top: -9999, left: -9999, visibility: "hidden" }
              }
            >
              {items.map((item) => (
                <li key={item.action}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[#24334c] hover:bg-[#f4f8ff]",
                    )}
                    role="menuitem"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpen(false);
                      onAction(item.action);
                    }}
                  >
                    <item.icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-70" />
                    {t(item.action)}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
