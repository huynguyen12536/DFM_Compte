import { getTranslations } from "next-intl/server";

type ContentLoadingProps = {
  /** next-intl message key, e.g. loading.status or register.loading */
  namespace?: "loading" | "register";
};

/** Content-area skeleton only — never remounts the sidebar/header shell. */
export async function ContentLoading({ namespace = "loading" }: ContentLoadingProps) {
  const t = await getTranslations(namespace);
  const label = namespace === "register" ? t("loading") : t("status");

  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4 sm:p-6"
    >
      <div className="loading-shimmer h-10 max-w-md rounded-[12px]" />
      <div className="loading-shimmer min-h-48 flex-1 rounded-[14px]" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="loading-shimmer h-28 rounded-[14px]" key={index} />
        ))}
      </div>
    </div>
  );
}
