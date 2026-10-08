"use client";

import { StatusBadge } from "@/components/dashboard/tone";
import { useCurrentCompany } from "@/features/settings/company-store";

export function HeroCompanyBadge() {
  const { company } = useCurrentCompany();
  return (
    <StatusBadge size="sm" tone="blue">
      {company.name}
    </StatusBadge>
  );
}
