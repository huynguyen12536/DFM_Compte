"use client";

import type { ReactNode } from "react";

import { SettingsNavigation } from "./settings-navigation";

export function SettingsShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="app-scroll dashboard-canvas min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
      <div className="dashboard-page dashboard-stack min-w-0">
        <header className="dashboard-enter enter-0 min-w-0">
          <h2 className="truncate text-[22px] font-semibold tracking-[-0.025em] text-[#063586] sm:text-[24px]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-[68ch] text-sm leading-6 text-[#66758d]">{description}</p>
          ) : null}
        </header>

        <div className="mt-1 grid min-w-0 gap-3 lg:grid-cols-[210px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)]">
          <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
            <SettingsNavigation />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
