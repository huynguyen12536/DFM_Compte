"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { mockApprovalRules } from "../mocks/approval";
import { mockCompanies } from "../mocks/companies";
import { getTenantRoles, systemRoles } from "../mocks/roles";
import { mockSecuritySettings } from "../mocks/security";
import { mockTeamMembers } from "../mocks/users";
import { ApprovalRulesCard } from "./approval-rules-card";
import { CreateRoleDialog } from "./create-role-dialog";
import { DataScopeCard } from "./data-scope-card";
import { InviteUserDialog } from "./invite-user-dialog";
import { PermissionMatrix } from "./permission-matrix";
import { RoleSummary } from "./role-summary";
import { SecuritySettingsCard } from "./security-settings-card";
import { SensitiveActionsCard } from "./sensitive-actions-card";
import { SettingsShell } from "./settings-shell";
import { TeamMembersCard } from "./team-members-card";

export function UsersPermissionsPage() {
  const t = useTranslations("usersPermissions");
  const roles = useMemo(() => getTenantRoles(systemRoles), []);
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "tenant-admin");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createRoleOpen, setCreateRoleOpen] = useState(false);

  return (
    <SettingsShell description={t("page.description")} title={t("page.title")}>
      <div className="users-permissions-grid grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-1 min-w-0 space-y-3 xl:col-start-1">
          <TeamMembersCard
            companies={mockCompanies}
            members={mockTeamMembers}
            roles={roles}
            onCreateRole={() => setCreateRoleOpen(true)}
            onInvite={() => setInviteOpen(true)}
          />
        </div>

        <div className="order-2 min-w-0 space-y-3 xl:col-start-2 xl:row-span-2 xl:self-start">
          <RoleSummary
            roles={roles}
            selectedRoleId={selectedRoleId}
            onSelect={setSelectedRoleId}
          />
          <div className="hidden space-y-3 xl:block">
            <DataScopeCard />
            <ApprovalRulesCard initial={mockApprovalRules} />
            <SecuritySettingsCard initial={mockSecuritySettings} />
            <SensitiveActionsCard />
          </div>
        </div>

        <div className="order-3 min-w-0 xl:col-start-1">
          <PermissionMatrix roles={roles} selectedRoleId={selectedRoleId} />
        </div>

        <div className="order-4 grid min-w-0 gap-3 sm:grid-cols-2 xl:hidden">
          <DataScopeCard />
          <ApprovalRulesCard initial={mockApprovalRules} />
          <SecuritySettingsCard initial={mockSecuritySettings} />
          <SensitiveActionsCard />
        </div>
      </div>

      <InviteUserDialog
        companies={mockCompanies}
        open={inviteOpen}
        roles={roles}
        onClose={() => setInviteOpen(false)}
      />
      <CreateRoleDialog open={createRoleOpen} onClose={() => setCreateRoleOpen(false)} />
    </SettingsShell>
  );
}
