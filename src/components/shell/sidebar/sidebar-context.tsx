"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { usePathname } from "@/i18n/navigation";
import { useMediaQuery } from "@/lib/use-media-query";

export const SIDEBAR_COLLAPSED_WIDTH = 76;
export const SIDEBAR_EXPANDED_WIDTH = 288;
export const SIDEBAR_DESKTOP_MQ = "(min-width: 1024px)";

const SIDEBAR_DESKTOP_OPEN_KEY = "compte.sidebar.desktopOpen";

function readDesktopOpenPreference(): boolean | null {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_DESKTOP_OPEN_KEY);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    // private mode / blocked storage
  }
  return null;
}

function writeDesktopOpenPreference(open: boolean) {
  try {
    window.localStorage.setItem(SIDEBAR_DESKTOP_OPEN_KEY, open ? "1" : "0");
  } catch {
    // ignore
  }
}

type SidebarApi = {
  open: boolean;
  setOpen: (open: boolean) => void;
  animate: boolean;
  isDesktop: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const SidebarContext = createContext<SidebarApi | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("Sidebar components must be used inside SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  open: openControlled,
  setOpen: setOpenControlled,
  animate = true,
}: {
  children: ReactNode;
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
}) {
  // Desktop-first: start expanded so SSR rail width (288) matches chrome content.
  // Client then restores the last desktop preference before paint when possible.
  const [openUncontrolled, setOpenUncontrolled] = useState(true);
  const [desktopPrefReady, setDesktopPrefReady] = useState(false);
  const open = openControlled ?? openUncontrolled;
  const setOpen = setOpenControlled ?? setOpenUncontrolled;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  // Desktop-first SSR snapshot — prevents expanded chrome inside collapsed rail on reload.
  const isDesktop = useMediaQuery(SIDEBAR_DESKTOP_MQ, true);
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const prevDesktop = useRef<boolean | null>(null);

  const applyDesktopPreference = useCallback(() => {
    if (openControlled !== undefined) return;
    setOpen(readDesktopOpenPreference() ?? true);
  }, [openControlled, setOpen]);

  // Restore preference / close drawer before paint; keep desktop↔mobile in sync.
  useLayoutEffect(() => {
    if (prevDesktop.current === null) {
      prevDesktop.current = isDesktop;
      if (!isDesktop) setOpen(false);
      else applyDesktopPreference();
      setDesktopPrefReady(true);
      return;
    }
    if (prevDesktop.current === isDesktop) return;
    prevDesktop.current = isDesktop;
    if (!isDesktop) {
      setOpen(false);
      return;
    }
    applyDesktopPreference();
  }, [applyDesktopPreference, isDesktop, setOpen]);

  // Persist desktop open/collapsed across reloads (never overwrite from mobile drawer).
  useEffect(() => {
    if (!desktopPrefReady || openControlled !== undefined || !isDesktop) return;
    writeDesktopOpenPreference(open);
  }, [desktopPrefReady, isDesktop, open, openControlled]);

  // Close mobile drawer after route changes.
  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    if (!isDesktop) setOpen(false);
  }, [pathname, isDesktop, setOpen]);

  const value = useMemo(
    () => ({ open, setOpen, animate, isDesktop, triggerRef }),
    [open, setOpen, animate, isDesktop],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebarOptional() {
  return useContext(SidebarContext);
}

export function useCloseSidebar() {
  const sidebar = useSidebarOptional();
  return useCallback(() => {
    sidebar?.setOpen(false);
  }, [sidebar]);
}
