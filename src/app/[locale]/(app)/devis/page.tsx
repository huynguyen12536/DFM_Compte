import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { QuotesRegister } from "@/features/quotes/quotes-register";

export default async function QuotesPage() {
  const t = await getTranslations("register");

  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#728097]">{t("loading")}</p>}>
      <QuotesRegister />
    </Suspense>
  );
}
