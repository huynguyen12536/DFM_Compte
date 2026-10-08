import type { SettingsNavItemId } from "./types";

export type SettingsNavItem = {
  id: SettingsNavItemId;
  labelKey: string;
  href: string | null;
  /** Implemented page vs future placeholder. */
  available: boolean;
};

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: "general", labelKey: "nav.general", href: "/parametres", available: true },
  { id: "companies", labelKey: "nav.companies", href: "/parametres/societes", available: true },
  { id: "users", labelKey: "nav.users", href: "/parametres/utilisateurs", available: true },
  { id: "roles", labelKey: "nav.roles", href: "/parametres/roles", available: true },
  { id: "billing", labelKey: "nav.billing", href: null, available: false },
  { id: "documents", labelKey: "nav.documents", href: null, available: false },
  { id: "payments", labelKey: "nav.payments", href: null, available: false },
  { id: "integrations", labelKey: "nav.integrations", href: null, available: false },
  { id: "automation", labelKey: "nav.automation", href: null, available: false },
  { id: "templates", labelKey: "nav.templates", href: null, available: false },
  { id: "notifications", labelKey: "nav.notifications", href: null, available: false },
  { id: "security", labelKey: "nav.security", href: "/parametres/securite", available: true },
  { id: "audit", labelKey: "nav.audit", href: "/parametres/audit", available: true },
];

export function matchSettingsNavId(pathname: string): SettingsNavItemId {
  if (pathname.startsWith("/parametres/societes")) return "companies";
  if (pathname.startsWith("/parametres/utilisateurs")) return "users";
  if (pathname.startsWith("/parametres/roles")) return "roles";
  if (pathname.startsWith("/parametres/securite")) return "security";
  if (pathname.startsWith("/parametres/audit")) return "audit";
  if (pathname === "/parametres" || pathname.startsWith("/parametres/")) return "general";
  return "general";
}
