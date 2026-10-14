"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { ActionList } from "@/components/dashboard/action-list";
import { AttentionListSheet } from "@/components/dashboard/attention-list-sheet";
import { CardHeader } from "@/components/dashboard/overview/dashboard-card";
import type { ActionItem } from "@/mocks/dashboard/types";

export function DashboardAttentionLive({ items }: { items: ActionItem[] }) {
  const t = useTranslations();
  const [listOpen, setListOpen] = useState(false);

  return (
    <>
      <CardHeader
        action={t("attention.seeAll")}
        actionAriaLabel={t("attention.listFull.openAria")}
        title={t("attention.title")}
        titleId="attention-title"
        onActionClick={() => setListOpen(true)}
      />
      <div className="mt-2 flex min-h-0 flex-1 flex-col">
        <ActionList items={items} />
      </div>
      <AttentionListSheet open={listOpen} items={items} onClose={() => setListOpen(false)} />
    </>
  );
}
