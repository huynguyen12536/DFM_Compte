"use client";

import {
  AlertCircle,
  CircleDollarSign,
  Clock3,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { CountUp } from "@/components/count-up";
import { IconTile } from "@/components/dashboard/tone";
import { formatEuroCompact } from "@/lib/money";
import type { Tone } from "@/mocks/dashboard/types";

import type { CustomerKpis } from "../types";

const cards: Array<{
  key: "total" | "active" | "revenue" | "quotes" | "overdue";
  icon: LucideIcon;
  tone: Tone;
}> = [
  {
    key: "total",
    icon: Users,
    tone: "blue",
  },
  {
    key: "active",
    icon: UserCheck,
    tone: "green",
  },
  {
    key: "revenue",
    icon: CircleDollarSign,
    tone: "blue",
  },
  {
    key: "quotes",
    icon: Clock3,
    tone: "purple",
  },
  {
    key: "overdue",
    icon: AlertCircle,
    tone: "red",
  },
];

export function CustomerKpisStrip({ kpis }: { kpis: CustomerKpis }) {
  const t = useTranslations("customers.kpis");

  const values = {
    total: String(kpis.totalCustomers),
    active: String(kpis.activeCustomers),
    revenue: formatEuroCompact(kpis.totalRevenueCents / 100),
    quotes: String(kpis.openQuotes),
    overdue: String(kpis.overdueInvoices),
  };

  return (
    <section className="grid shrink-0 grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <article
          className="dashboard-card flex h-[84px] min-w-0 items-center gap-2.5 px-3 py-2.5 sm:h-[88px]"
          key={card.key}
        >
          <IconTile
            className="shadow-[3px_4px_10px_rgba(78,108,145,0.08),-2px_-2px_8px_rgba(255,255,255,0.8)]"
            icon={card.icon}
            size="md"
            strokeWidth={2.15}
            tone={card.tone}
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-[#7d8aa0]">{t(card.key)}</p>
            <p className="mt-1 truncate text-[26px] leading-none font-semibold tracking-[-0.03em] text-[#063586] tabular-nums">
              <CountUp value={values[card.key]} />
            </p>
          </div>
        </article>
      ))}
    </section>
  );
}
