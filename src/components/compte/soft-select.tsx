"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

export type SoftSelectOption = {
  value: string;
  label: string;
};

const OPEN_EVENT = "compte:soft-select-open";
const MENU_GAP = 4;
const MENU_EDGE = 8;
const MENU_MAX_CAP = 240;

/**
 * Soft-UI select — custom listbox (native <select> popups cannot be styled).
 * Opens downward; list scrolls when content exceeds available space.
 * Closes on outside click / Escape / when another SoftSelect opens.
 */
export function SoftSelect({
  label,
  value,
  options,
  onChange,
  className,
  triggerClassName,
  hideLabel = false,
  disabled = false,
  /** Above FormSheet (z-60–100) so the list stays clickable inside sheets. */
  menuZIndexClassName = "z-[110]",
}: {
  label: string;
  value: string;
  options: SoftSelectOption[];
  onChange: (value: string) => void;
  className?: string;
  triggerClassName?: string;
  hideLabel?: boolean;
  disabled?: boolean;
  menuZIndexClassName?: string;
}) {
  const listId = useId();
  const instanceId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  function close() {
    setOpen(false);
  }

  function openMenu() {
    setOpen(true);
    window.dispatchEvent(
      new CustomEvent(OPEN_EVENT, { detail: { id: instanceId } }),
    );
  }

  useLayoutEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const spaceBelow = Math.max(72, window.innerHeight - rect.bottom - MENU_GAP - MENU_EDGE);
      const maxHeight = Math.min(MENU_MAX_CAP, spaceBelow);
      setMenuBox({
        top: rect.bottom + MENU_GAP,
        left: rect.left,
        width: rect.width,
        maxHeight,
      });
    }

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
    }

    function onOtherOpen(event: Event) {
      const detail = (event as CustomEvent<{ id: string }>).detail;
      if (detail?.id !== instanceId) close();
    }

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown, true);
    }, 0);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener(OPEN_EVENT, onOtherOpen);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener(OPEN_EVENT, onOtherOpen);
    };
  }, [open, instanceId]);

  return (
    <div
      className={cn("relative min-w-0", className)}
      data-soft-select-root={instanceId}
      ref={rootRef}
    >
      {hideLabel ? null : (
        <span className="mb-1 block text-[11px] font-medium text-[#7d8aa0]">{label}</span>
      )}
      <button
        ref={triggerRef}
        aria-controls={open ? listId : undefined}
        aria-disabled={disabled || undefined}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={cn(
          "soft-input flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[9px] px-2.5 text-left text-xs font-semibold text-[#24334c] outline-none",
          open && "ring-1 ring-[#044ce2]/30",
          disabled && "cursor-not-allowed opacity-70",
          triggerClassName,
        )}
        disabled={disabled}
        type="button"
        onClick={() => {
          if (disabled) return;
          if (open) {
            close();
            return;
          }
          openMenu();
        }}
      >
        <span className="min-w-0 truncate">{selected?.label ?? value}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[#7d8aa0] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open
        ? createPortal(
            <ul
              ref={menuRef}
              aria-label={label}
              className={cn(
                "soft-select-scroll fixed overflow-y-auto overscroll-contain rounded-[10px] border border-[#e2eaf5] bg-white py-1 shadow-[0_12px_28px_rgba(29,43,68,0.14)]",
                menuZIndexClassName,
              )}
              data-soft-select-list={instanceId}
              id={listId}
              role="listbox"
              style={
                menuBox
                  ? {
                      top: menuBox.top,
                      left: menuBox.left,
                      width: menuBox.width,
                      maxHeight: menuBox.maxHeight,
                    }
                  : { top: -9999, left: -9999, visibility: "hidden" }
              }
            >
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <li key={option.value} role="none">
                    <button
                      aria-selected={active}
                      className={cn(
                        "flex min-h-9 w-full items-center justify-between gap-2 px-2.5 text-left text-xs font-medium",
                        active
                          ? "bg-[#eef4ff] text-[#044ce2]"
                          : "text-[#24334c] hover:bg-[#f5f8fd]",
                      )}
                      role="option"
                      type="button"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onChange(option.value);
                        close();
                      }}
                    >
                      <span className="min-w-0 truncate">{option.label}</span>
                      {active ? (
                        <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
