"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/compte/confirm-dialog";
import { SoftToast } from "@/components/compte/soft-toast";
import { can } from "@/features/settings/can";
import { systemRoles } from "@/features/settings/mocks/roles";
import { Link, useRouter } from "@/i18n/navigation";

import {
  clearLegacyCustomerPersistence,
  detectDuplicatesIn,
  getCustomerByIdFrom,
  getInitialCustomers,
  listCustomerOwners,
  updateCustomerIn,
} from "../services/customers-service";
import type { CustomerRecord } from "../types";
import { CustomerDetailsPanel } from "./customer-details-panel";
import { DuplicateCustomerDialog } from "./duplicate-customer-dialog";

const activePermissions =
  systemRoles.find((role) => role.id === "tenant-admin")?.permissions ?? [];

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const t = useTranslations("customers");
  const router = useRouter();
  const owners = useMemo(() => listCustomerOwners(), []);
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    clearLegacyCustomerPersistence();
    return getInitialCustomers();
  });
  const [notice, setNotice] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<CustomerRecord | null>(null);
  const [duplicateCandidates, setDuplicateCandidates] = useState<CustomerRecord[]>([]);
  const [detailGuard, setDetailGuard] = useState({ editing: false, dirty: false });
  const [discardCloseOpen, setDiscardCloseOpen] = useState(false);

  const displayCustomer = getCustomerByIdFrom(customers, customerId);
  const owner = owners.find((item) => item.id === displayCustomer?.ownerId);

  return (
    <main className="dashboard-canvas flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-hidden">
      <div className="dashboard-page flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-2">
          <Link
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#044ce2] hover:underline"
            href="/customers"
            onClick={(event) => {
              if (detailGuard.editing && detailGuard.dirty) {
                event.preventDefault();
                setDiscardCloseOpen(true);
              }
            }}
          >
            ← {t("title")}
          </Link>
        </div>

        {displayCustomer ? (
          <section className="dashboard-card flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <CustomerDetailsPanel
              key={displayCustomer.id}
              canUpdate={can(activePermissions, "customer.update")}
              customer={displayCustomer}
              embedded
              owner={owner}
              owners={owners}
              onDuplicateFound={(draft, resume) => {
                const found = detectDuplicatesIn(
                  customers,
                  {
                    displayName: draft.displayName,
                    email: draft.email,
                    siret: draft.siret,
                    vatNumber: draft.vatNumber,
                  },
                  draft.id,
                );
                if (found.length) {
                  setPendingUpdate(draft);
                  setDuplicateCandidates(found);
                  return;
                }
                resume();
              }}
              onEditingChange={setDetailGuard}
              onPatchCustomer={(next) => {
                setCustomers((previous) => updateCustomerIn(previous, next.id, next));
              }}
              onSave={(next) => {
                setCustomers((previous) => updateCustomerIn(previous, next.id, next));
                setNotice(t("updated"));
                setDetailGuard({ editing: false, dirty: false });
              }}
            />
          </section>
        ) : (
          <section className="dashboard-card px-3.5 py-3">
            <p className="dashboard-card-title">{t("details.notFound")}</p>
            <p className="mt-1.5 text-xs leading-5 text-[#516078]">{t("details.emptyBody")}</p>
          </section>
        )}
      </div>

      <DuplicateCustomerDialog
        candidates={duplicateCandidates}
        open={duplicateCandidates.length > 0}
        onClose={() => {
          setDuplicateCandidates([]);
          setPendingUpdate(null);
        }}
        onContinue={() => {
          if (!pendingUpdate) return;
          setCustomers((previous) =>
            updateCustomerIn(previous, pendingUpdate.id, pendingUpdate),
          );
          setDuplicateCandidates([]);
          setPendingUpdate(null);
          setNotice(t("updated"));
          setDetailGuard({ editing: false, dirty: false });
        }}
        onReview={(id) => {
          setDuplicateCandidates([]);
          setPendingUpdate(null);
          if (id !== customerId) router.push(`/customers/${id}`);
        }}
      />

      <ConfirmDialog
        body={t("details.discardConfirm")}
        cancelLabel={t("details.keepEditing")}
        confirmLabel={t("details.discardAction")}
        danger
        open={discardCloseOpen}
        title={t("details.discardTitle")}
        onCancel={() => setDiscardCloseOpen(false)}
        onConfirm={() => {
          setDiscardCloseOpen(false);
          router.push("/customers");
        }}
      />

      {notice ? (
        <SoftToast message={notice} tone="success" onDismiss={() => setNotice("")} />
      ) : null}
    </main>
  );
}
