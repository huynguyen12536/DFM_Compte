"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import {
  AnimatedActiveIndicator,
  AnimatedSelectionGroup,
} from "@/components/compte/animated-selection";
import { cn } from "@/lib/utils";

import type {
  IntegrationActivity,
  IntegrationConnection,
  IntegrationDefinition,
  IntegrationDisplayStatus,
} from "../model";
import { IntegrationActivityPanel } from "./details/integration-activity";
import {
  IntegrationApiKeysPanel,
  IntegrationMegPanel,
  IntegrationWebhooksPanel,
} from "./details/integration-developer-panels";
import { IntegrationOverview } from "./details/integration-overview";

type DetailTab = "overview" | "activity" | "api_keys" | "endpoints" | "imports";

function tabsFor(
  definition: IntegrationDefinition,
  status: IntegrationDisplayStatus,
): DetailTab[] {
  if (definition.slug === "rest-api") return ["overview", "api_keys"];
  if (definition.slug === "webhooks") return ["overview", "endpoints"];
  if (definition.slug === "meg-import") return ["overview", "imports"];
  if (
    (status === "connected" || status === "attention") &&
    (definition.category === "banking" ||
      definition.category === "payments" ||
      definition.category === "accounting")
  ) {
    return ["overview", "activity"];
  }
  return ["overview"];
}

export function IntegrationDetails({
  definition,
  connection,
  status,
  activities,
  scopeLabel,
  canManage,
  syncing,
  onClose,
  onConnect,
  onDisconnect,
  onSync,
  onManageApi,
  onStartImport,
}: {
  definition: IntegrationDefinition;
  connection: IntegrationConnection | null;
  status: IntegrationDisplayStatus;
  activities: IntegrationActivity[];
  scopeLabel: string;
  canManage: boolean;
  syncing?: boolean;
  onClose: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  onManageApi?: () => void;
  onStartImport?: () => void;
}) {
  const t = useTranslations("integrations");
  const tabs = useMemo(() => tabsFor(definition, status), [definition, status]);
  const [tab, setTab] = useState<DetailTab>(tabs[0] ?? "overview");
  const activeTab = tabs.includes(tab) ? tab : (tabs[0] ?? "overview");

  const canSync =
    Boolean(connection) &&
    (status === "connected" || status === "attention") &&
    (definition.category === "banking" || definition.category === "payments");

  return (
    <aside className="integration-detail-panel flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[17px] border border-[#e4ecf6] bg-white shadow-[0_1px_2px_rgba(15,23,42,.03),0_12px_34px_rgba(30,64,175,.055)]">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[#e8eef7] px-4 py-4">
        <div className="min-w-0">
          <h2 className="truncate text-[18px] font-bold tracking-[-0.02em] text-[#173156]">
            {t(definition.nameKey)}
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[#7d8aa0]">
            {t(`categories.${definition.category}`)}
          </p>
        </div>
        <button
          aria-label={t("detail.close")}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] text-[#66758d] hover:bg-[#f3f6fb]"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </header>

      {tabs.length > 1 ? (
        <AnimatedSelectionGroup
          className="shrink-0 border-b border-[#e8eef7] px-2"
          id={`integration-detail-tabs-${definition.id}`}
        >
          <div
            aria-label={t("detail.tabsLabel")}
            className="flex min-w-0 gap-1 overflow-x-auto"
            role="tablist"
          >
            {tabs.map((item) => {
              const active = activeTab === item;
              return (
                <button
                  aria-selected={active}
                  className={cn(
                    "relative h-11 shrink-0 rounded-full px-3 text-[12px] font-semibold transition-colors",
                    active ? "text-[#145be7]" : "text-[#7d8aa0] hover:text-[#405069]",
                  )}
                  key={item}
                  role="tab"
                  type="button"
                  onClick={() => setTab(item)}
                >
                  {active ? (
                    <AnimatedActiveIndicator
                      className="rounded-full"
                      layoutId={`integration-detail-tab-${definition.id}`}
                      variant="soft-pill"
                    />
                  ) : null}
                  <span className="relative z-[1]">{t(`detail.tabs.${item}`)}</span>
                </button>
              );
            })}
          </div>
        </AnimatedSelectionGroup>
      ) : null}

      <div className="app-scroll min-h-0 flex-1 overflow-y-auto p-4">
        {activeTab === "overview" ? (
          <IntegrationOverview
            canManage={canManage}
            canSync={canSync}
            connection={connection}
            definition={definition}
            scopeLabel={scopeLabel}
            status={status}
            syncing={syncing}
            onConnect={onConnect}
            onDisconnect={onDisconnect}
            onManageApi={onManageApi}
            onStartImport={onStartImport}
            onSync={onSync}
          />
        ) : null}
        {activeTab === "activity" ? (
          <IntegrationActivityPanel items={activities} />
        ) : null}
        {activeTab === "api_keys" ? <IntegrationApiKeysPanel /> : null}
        {activeTab === "endpoints" ? <IntegrationWebhooksPanel /> : null}
        {activeTab === "imports" ? <IntegrationMegPanel /> : null}
      </div>
    </aside>
  );
}
