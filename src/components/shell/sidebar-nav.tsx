"use client";

import {
  FileText,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Link2,
  Mail,
  Package,
  ReceiptText,
  Settings,
  Sparkles,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
  SIDEBAR_ACTIVE_LAYOUT_ID,
} from "@/components/compte/animated-selection";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavKey =
  | "nav.overview"
  | "nav.customers"
  | "nav.quotes"
  | "nav.invoices"
  | "nav.payments"
  | "nav.products"
  | "nav.reports"
  | "nav.automation"
  | "nav.projects"
  | "nav.templates"
  | "nav.integrations"
  | "nav.settings";

type SidebarNavItem = {
  labelKey: NavKey;
  icon: LucideIcon;
  href?: string;
  /** Prefix used for active matching when the link target is a nested default page. */
  matchPrefix?: string;
  count?: string;
};

const mainNav: SidebarNavItem[] = [
  { labelKey: "nav.overview", icon: LayoutDashboard, href: "/" },
  { labelKey: "nav.customers", icon: UsersRound, href: "/customers" },
  { labelKey: "nav.quotes", icon: FileText, href: "/devis", count: "6" },
  { labelKey: "nav.invoices", icon: ReceiptText, href: "/factures" },
  { labelKey: "nav.payments", icon: WalletCards, href: "/paiements", count: "3" },
  { labelKey: "nav.products", icon: Package },
  { labelKey: "nav.reports", icon: Gauge },
];

const opsNav: SidebarNavItem[] = [
  { labelKey: "nav.automation", icon: Sparkles },
  { labelKey: "nav.projects", icon: FolderKanban },
  { labelKey: "nav.templates", icon: Mail },
  { labelKey: "nav.integrations", icon: Link2 },
  {
    labelKey: "nav.settings",
    icon: Settings,
    href: "/parametres/utilisateurs",
    // Settings sub-pages (General, Users, Audit…) must keep Settings active —
    // never fall back to Overview when switching the settings sub-nav.
    matchPrefix: "/parametres",
  },
];

function pathMatches(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function matchRouteKey(pathname: string): NavKey {
  const normalized = pathname || "/";
  const ranked = [...mainNav, ...opsNav]
    .filter((item) => item.href)
    .sort(
      (a, b) =>
        (b.matchPrefix?.length ?? b.href?.length ?? 0) -
        (a.matchPrefix?.length ?? a.href?.length ?? 0),
    );

  for (const item of ranked) {
    const matchRoot = item.matchPrefix ?? item.href ?? "/";
    if (pathMatches(normalized, matchRoot)) return item.labelKey;
  }

  return "nav.overview";
}

/** Exact link target only — used to skip redundant navigation, not for section active state. */
function isExactHref(pathname: string, item: SidebarNavItem): boolean {
  if (!item.href) return false;
  return pathMatches(pathname, item.href);
}

function SidebarNavButton({
  item,
  label,
  active,
  pathname,
  comingSoon,
}: {
  item: SidebarNavItem;
  label: string;
  active: boolean;
  pathname: string;
  comingSoon: string;
}) {
  const Icon = item.icon;

  const className = cn(
    "nav-item group relative flex min-h-11 w-full items-center gap-3 rounded-[14px] px-3 text-left text-sm transition-colors duration-150 ease-out",
    active
      ? "font-semibold text-[#044ce2]"
      : "text-[#66758d] hover:text-[#24334c]",
  );

  const content = (
    <>
      {active ? (
        <AnimatedActiveIndicator layoutId={SIDEBAR_ACTIVE_LAYOUT_ID} variant="sidebar" />
      ) : null}
      <span className="relative z-[1] flex min-w-0 flex-1 items-center gap-3 transition-transform duration-[90ms] ease-out group-active:scale-[0.985]">
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-[color,transform] duration-150 ease-out",
            active ? "scale-[1.04] text-[#044ce2]" : "text-current",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {item.count ? (
          <span
            className={cn(
              "rounded-[6px] bg-white px-2 py-0.5 text-xs text-[#044ce2] shadow-[0_1px_2px_rgb(20_32_51/0.06)] transition-opacity duration-150",
              active ? "opacity-100" : "opacity-90",
            )}
          >
            {item.count}
          </span>
        ) : null}
      </span>
    </>
  );

  if (item.href) {
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={className}
        href={item.href}
        onClick={(event) => {
          if (isExactHref(pathname, item)) {
            event.preventDefault();
          }
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      aria-disabled="true"
      className={className}
      disabled
      title={comingSoon}
      type="button"
    >
      {content}
    </button>
  );
}

export function SidebarNav({
  labels,
  opsLabel,
  comingSoon,
}: {
  labels: Record<NavKey, string>;
  opsLabel: string;
  comingSoon: string;
}) {
  const pathname = usePathname();
  const activeKey = matchRouteKey(pathname);

  return (
    <AnimatedSelectionGroup id="compte-sidebar-nav">
      <nav className="space-y-1">
        {mainNav.map((item) => (
          <SidebarNavButton
            active={activeKey === item.labelKey}
            comingSoon={comingSoon}
            item={item}
            key={item.labelKey}
            label={labels[item.labelKey]}
            pathname={pathname}
          />
        ))}
      </nav>

      <div className="mt-7 border-t border-[#edf1f6] pt-5">
        <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.12em] text-[#98a4b5]">
          {opsLabel}
        </p>
        <nav className="space-y-1">
          {opsNav.map((item) => (
            <SidebarNavButton
              active={activeKey === item.labelKey}
              comingSoon={comingSoon}
              item={item}
              key={item.labelKey}
              label={labels[item.labelKey]}
              pathname={pathname}
            />
          ))}
        </nav>
      </div>
    </AnimatedSelectionGroup>
  );
}
