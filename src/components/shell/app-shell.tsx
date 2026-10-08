import {
  Bot,
  CalendarDays,
  Menu,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { BrandLogo } from "@/components/brand-logo";
import { CommandSearchIconTrigger, CommandSearchTrigger } from "@/components/command/command-palette";
import { CompanySwitcher } from "@/components/shell/company-switcher";
import { HeaderNotifications } from "@/components/shell/header-notifications";
import { NavDrawer, NavDrawerProvider, NavDrawerSearch, NavDrawerTrigger } from "@/components/shell/nav-drawer";
import { ShellTitle } from "@/components/shell/shell-title";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserAccountMenu } from "@/components/shell/user-account-menu";

/** Persistent COMPTE chrome — sidebar stays mounted across route changes. */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const t = await getTranslations();
  const today = t("header.today", { date: "02/10/2026" });

  return (
    <NavDrawerProvider>
      <div className="flex h-dvh w-full overflow-hidden bg-[#f2f6fd] text-[#063586]">
        <NavDrawer
          breakpoint="xl"
          className="nav-rail relative z-40 flex h-full w-[268px] shrink-0 flex-col overflow-hidden border-r border-[#e0e6ef] px-4 py-5"
          closeLabel={t("header.closeMenu")}
          label={t("header.navigation")}
        >
          <div className="shrink-0 px-3 pb-6">
            <BrandLogo />
          </div>

          <CompanySwitcher />

          <NavDrawerSearch className="mt-3 shrink-0 min-[480px]:hidden" label={t("header.search")} />

          <div className="sidebar-scroll mt-6 min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <SidebarNav
              comingSoon={t("nav.comingSoon")}
              labels={{
                "nav.overview": t("nav.overview"),
                "nav.customers": t("nav.customers"),
                "nav.quotes": t("nav.quotes"),
                "nav.invoices": t("nav.invoices"),
                "nav.payments": t("nav.payments"),
                "nav.products": t("nav.products"),
                "nav.reports": t("nav.reports"),
                "nav.automation": t("nav.automation"),
                "nav.projects": t("nav.projects"),
                "nav.templates": t("nav.templates"),
                "nav.integrations": t("nav.integrations"),
                "nav.settings": t("nav.settings"),
              }}
              opsLabel={t("nav.operations")}
            />
          </div>

          <div className="assistant-card mt-4 shrink-0 rounded-[15px] bg-[#063586] p-4 text-white">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/12">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{t("sidebar.assistantTitle")}</p>
                <p className="mt-1 text-xs leading-5 text-[#bec9da]">{t("sidebar.assistantBody")}</p>
              </div>
            </div>
            <button
              className="action-motion mt-4 min-h-10 w-full rounded-[10px] bg-white text-sm font-semibold text-[#063586]"
              type="button"
            >
              {t("sidebar.assistantAction")}
            </button>
          </div>
        </NavDrawer>

        <div className="workspace-pane flex min-h-0 min-w-0 flex-1 flex-col">
          <img alt="" aria-hidden="true" className="workspace-pane__art" src="/workspace-bg.png" />
          <header className="dashboard-enter enter-0 relative z-30 flex min-h-[64px] shrink-0 items-center gap-2 border-b border-[#e0e6ef] bg-white/55 px-3 shadow-[0_8px_30px_rgb(24_36_58/0.05)] backdrop-blur-md sm:min-h-[76px] sm:gap-4 sm:px-6 xl:px-8">
            <NavDrawerTrigger
              className="action-motion soft-button grid h-10 w-10 shrink-0 place-items-center rounded-[10px] text-[#506078] xl:hidden"
              label={t("header.openMenu")}
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </NavDrawerTrigger>
            <BrandLogo className="hidden h-8 w-auto shrink-0 md:block xl:hidden" />

            <div className="min-w-0 flex-1 xl:flex-none xl:shrink-0">
              <p className="hidden text-xs font-medium text-[#7d8aa0] sm:block">{today}</p>
              <h1 className="truncate text-[21px] font-semibold tracking-[-0.025em] text-[#063586] sm:text-[26px] lg:text-[28px] xl:text-[30px]">
                <ShellTitle />
              </h1>
            </div>

            <CommandSearchTrigger label={t("header.search")} />
            <CommandSearchIconTrigger className="hidden min-[480px]:grid xl:hidden" label={t("header.search")} />

            <button
              aria-disabled="true"
              className="action-motion soft-button hidden min-h-10 items-center gap-2 rounded-[10px] px-3 text-sm font-semibold text-[#405069] xl:inline-flex"
              disabled
              title={t("header.periodUnavailable")}
              type="button"
            >
              <CalendarDays className="h-4 w-4 text-[#044ce2]" />
              {t("header.month")}
            </button>

            <HeaderNotifications label={t("header.notifications")} />

            <UserAccountMenu />
          </header>

          <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </NavDrawerProvider>
  );
}
