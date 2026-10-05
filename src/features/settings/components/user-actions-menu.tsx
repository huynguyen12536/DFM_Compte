"use client";

import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import type { TeamMember } from "../types";

const actions = [
  "edit",
  "changeRole",
  "changeScope",
  "manageCompanies",
  "resetPassword",
  "manageSessions",
  "resendInvitation",
  "disable",
] as const;

export function UserActionsMenu({ member }: { member: TeamMember }) {
  const t = useTranslations("usersPermissions.userActions");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t("open", { name: member.name })}
        className="soft-button grid h-10 w-10 place-items-center rounded-[10px] text-[#506078]"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
      </button>
      {open ? (
        <ul
          className="absolute top-full right-0 z-20 mt-1 min-w-[220px] overflow-hidden rounded-[12px] border border-[#e1e7f1] bg-white py-1 shadow-[0_14px_32px_rgb(29_43_68/0.12)]"
          id={menuId}
          role="menu"
        >
          {actions.map((action) => {
            if (action === "resendInvitation" && member.status !== "INVITED") return null;
            if (action === "disable" && member.status === "DISABLED") return null;
            const danger = action === "disable";
            return (
              <li key={action} role="none">
                {action === "disable" ? (
                  <div className="my-1 border-t border-[#edf1f6]" role="separator" />
                ) : null}
                <button
                  className={cn(
                    "flex min-h-10 w-full items-center px-3 text-left text-sm",
                    danger
                      ? "font-medium text-[#c9564f] hover:bg-[#fff0ed]"
                      : "text-[#24334c] hover:bg-[#f4f8ff]",
                  )}
                  role="menuitem"
                  type="button"
                  onClick={() => setOpen(false)}
                >
                  {t(action)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
