import type { ReactNode } from "react";

export function DashboardScroll({
  children,
  scrollClassName = "overflow-x-hidden overflow-y-auto",
}: {
  children: ReactNode;
  scrollClassName?: string;
}) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <div className={`dashboard-scroll h-full min-h-0 ${scrollClassName}`}>
        {children}
      </div>
    </div>
  );
}
