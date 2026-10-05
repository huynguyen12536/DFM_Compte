import type { PermissionId, Role } from "../types";

const tenantAdminPermissions: PermissionId[] = [
  "company.read",
  "company.manage",
  "user.read",
  "user.invite",
  "user.update",
  "user.disable",
  "role.read",
  "role.manage",
  "customer.read",
  "customer.create",
  "customer.update",
  "customer.delete",
  "product.read",
  "product.create",
  "product.update",
  "quote.read",
  "quote.create",
  "quote.update",
  "quote.send",
  "quote.approve",
  "invoice.read",
  "invoice.create",
  "invoice.validate",
  "payment.read",
  "payment.create",
  "payment.manage",
  "template.email.read",
  "template.email.manage",
  "template.pdf.read",
  "template.pdf.manage",
  "report.read",
  "report.export",
  "security.session.manage",
  "audit.read",
  // Bank is Phase 2 — catalog shows it, default tenant admin may manage when module is enabled.
  "bank.read",
  "bank.manage",
];

const businessOwnerPermissions: PermissionId[] = [
  "company.read",
  "customer.read",
  "product.read",
  "quote.read",
  "quote.approve",
  "invoice.read",
  "invoice.validate",
  "payment.read",
  "report.read",
  "report.export",
  "audit.read",
];

/** Accountant: invoices/payments ops. No quote create/update/send per PRD. */
const accountantPermissions: PermissionId[] = [
  "company.read",
  "customer.read",
  "product.read",
  "quote.read",
  "invoice.read",
  "invoice.create",
  "invoice.validate",
  "payment.read",
  "payment.create",
  "payment.manage",
  "report.read",
  "report.export",
];

/** Sales: OWN scope defaults. No invoice.validate. */
const salesPermissions: PermissionId[] = [
  "customer.read",
  "customer.create",
  "customer.update",
  "product.read",
  "quote.read",
  "quote.create",
  "quote.update",
  "quote.send",
  "invoice.read",
  "report.read",
];

/** Viewer: read-only. */
const viewerPermissions: PermissionId[] = [
  "company.read",
  "customer.read",
  "product.read",
  "quote.read",
  "invoice.read",
  "payment.read",
  "report.read",
];

export const systemRoles: Role[] = [
  {
    id: "tenant-admin",
    nameKey: "roles.tenantAdmin.name",
    descriptionKey: "roles.tenantAdmin.description",
    defaultScope: "TENANT",
    permissions: tenantAdminPermissions,
    system: true,
  },
  {
    id: "business-owner",
    nameKey: "roles.businessOwner.name",
    descriptionKey: "roles.businessOwner.description",
    defaultScope: "COMPANY",
    permissions: businessOwnerPermissions,
    system: true,
  },
  {
    id: "accountant",
    nameKey: "roles.accountant.name",
    descriptionKey: "roles.accountant.description",
    defaultScope: "COMPANY",
    permissions: accountantPermissions,
    system: true,
  },
  {
    id: "sales",
    nameKey: "roles.sales.name",
    descriptionKey: "roles.sales.description",
    defaultScope: "OWN",
    permissions: salesPermissions,
    system: true,
  },
  {
    id: "viewer",
    nameKey: "roles.viewer.name",
    descriptionKey: "roles.viewer.description",
    defaultScope: "COMPANY",
    permissions: viewerPermissions,
    system: true,
  },
];

/** Platform Super Admin — excluded from tenant role lists. */
export const platformSuperAdminRole: Role = {
  id: "super-admin",
  nameKey: "roles.superAdmin.name",
  descriptionKey: "roles.superAdmin.description",
  defaultScope: "TENANT",
  permissions: [],
  system: true,
  platform: true,
};

export function getTenantRoles(roles: Role[] = systemRoles): Role[] {
  return roles.filter((role) => !role.platform);
}

export function getRoleById(roleId: string, roles: Role[] = systemRoles): Role | undefined {
  return roles.find((role) => role.id === roleId);
}
