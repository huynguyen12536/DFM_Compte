"use client";

import { Search, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useCommand } from "@/components/command/command-palette";

type Breakpoint = "lg" | "xl";

const drawerQuery: Record<Breakpoint, string> = {
  lg: "(max-width: 1023.98px)",
  xl: "(max-width: 1279.98px)",
};

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DrawerApi = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const DrawerContext = createContext<DrawerApi | null>(null);

function useDrawer() {
  const context = useContext(DrawerContext);
  if (!context) throw new Error("NavDrawer components must be used inside NavDrawerProvider");
  return context;
}

export function NavDrawerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return <DrawerContext.Provider value={{ open, setOpen, triggerRef }}>{children}</DrawerContext.Provider>;
}

export function NavDrawerTrigger({
  className = "",
  label,
  children,
}: {
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const { open, setOpen, triggerRef } = useDrawer();

  return (
    <button
      aria-controls="app-nav-drawer"
      aria-expanded={open}
      aria-label={label}
      className={className}
      onClick={() => setOpen(true)}
      ref={triggerRef}
      type="button"
    >
      {children}
    </button>
  );
}

export function NavDrawerSearch({ label, className = "" }: { label: string; className?: string }) {
  const { setOpen } = useDrawer();
  const { openCommand } = useCommand();

  return (
    <button
      className={`soft-input flex min-h-10 w-full items-center gap-2 rounded-[10px] px-3 text-left text-sm text-[#7b8798] ${className}`}
      onClick={() => {
        setOpen(false);
        openCommand();
      }}
      type="button"
    >
      <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function NavDrawer({
  breakpoint,
  className = "",
  closeLabel,
  label,
  children,
}: {
  breakpoint: Breakpoint;
  className?: string;
  closeLabel: string;
  label: string;
  children: ReactNode;
}) {
  const { open, setOpen, triggerRef } = useDrawer();
  const panelRef = useRef<HTMLElement>(null);
  const [drawerMode, setDrawerMode] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, [setOpen, triggerRef]);

  useEffect(() => {
    const media = window.matchMedia(drawerQuery[breakpoint]);
    const sync = () => {
      setDrawerMode(media.matches);
      if (!media.matches) setOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [breakpoint, setOpen]);

  useEffect(() => {
    if (!open || !drawerMode) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close, drawerMode, open]);

  const isDialog = drawerMode && open;

  return (
    <>
      {isDialog ? <div aria-hidden="true" className="nav-drawer-backdrop" onClick={close} /> : null}
      <aside
        aria-label={label}
        aria-modal={isDialog ? true : undefined}
        className={`nav-drawer nav-drawer--${breakpoint} ${className}`}
        data-drawer-panel=""
        data-open={open}
        id="app-nav-drawer"
        onClick={(event) => {
          if (drawerMode && (event.target as HTMLElement).closest("a[href]")) setOpen(false);
        }}
        ref={panelRef}
        role={isDialog ? "dialog" : undefined}
      >
        <button aria-label={closeLabel} className="nav-drawer__close soft-button" onClick={close} type="button">
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
        {children}
      </aside>
    </>
  );
}
