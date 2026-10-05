import type { Capability, PermissionId, PermissionModule, Role } from "./types";

/** Sensitive permissions that require audit when changed or used. */
export const SENSITIVE_PERMISSIONS = new Set<PermissionId>([
  "customer.delete",
  "invoice.validate",
  "bank.manage",
  "role.manage",
  "user.disable",
  "user.invite",
  "user.update",
  "company.manage",
  "security.session.manage",
]);

export const CAPABILITY_ORDER: Capability[] = [
  "read",
  "create",
  "update",
  "delete",
  "send",
  "approve",
  "validate",
  "manage",
  "invite",
  "disable",
  "export",
];

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "company",
    labelKey: "modules.company",
    capabilities: [
      { capability: "read", permission: "company.read" },
      { capability: "manage", permission: "company.manage", sensitive: true },
    ],
  },
  {
    id: "users",
    labelKey: "modules.users",
    capabilities: [
      { capability: "read", permission: "user.read" },
      { capability: "invite", permission: "user.invite", sensitive: true },
      { capability: "update", permission: "user.update", sensitive: true },
      { capability: "disable", permission: "user.disable", sensitive: true },
    ],
  },
  {
    id: "roles",
    labelKey: "modules.roles",
    capabilities: [
      { capability: "read", permission: "role.read" },
      { capability: "manage", permission: "role.manage", sensitive: true },
    ],
  },
  {
    id: "customers",
    labelKey: "modules.customers",
    capabilities: [
      { capability: "read", permission: "customer.read" },
      { capability: "create", permission: "customer.create" },
      { capability: "update", permission: "customer.update" },
      { capability: "delete", permission: "customer.delete", sensitive: true },
    ],
  },
  {
    id: "products",
    labelKey: "modules.products",
    capabilities: [
      { capability: "read", permission: "product.read" },
      { capability: "create", permission: "product.create" },
      { capability: "update", permission: "product.update" },
    ],
  },
  {
    id: "quotes",
    labelKey: "modules.quotes",
    capabilities: [
      { capability: "read", permission: "quote.read" },
      { capability: "create", permission: "quote.create" },
      { capability: "update", permission: "quote.update" },
      { capability: "send", permission: "quote.send" },
      { capability: "approve", permission: "quote.approve" },
    ],
  },
  {
    id: "invoices",
    labelKey: "modules.invoices",
    capabilities: [
      { capability: "read", permission: "invoice.read" },
      { capability: "create", permission: "invoice.create" },
      {
        capability: "validate",
        permission: "invoice.validate",
        sensitive: true,
      },
    ],
  },
  {
    id: "payments",
    labelKey: "modules.payments",
    capabilities: [
      { capability: "read", permission: "payment.read" },
      { capability: "create", permission: "payment.create" },
      { capability: "manage", permission: "payment.manage" },
    ],
  },
  {
    id: "emailTemplates",
    labelKey: "modules.emailTemplates",
    capabilities: [
      { capability: "read", permission: "template.email.read" },
      { capability: "manage", permission: "template.email.manage" },
    ],
  },
  {
    id: "pdfTemplates",
    labelKey: "modules.pdfTemplates",
    capabilities: [
      { capability: "read", permission: "template.pdf.read" },
      { capability: "manage", permission: "template.pdf.manage" },
    ],
  },
  {
    id: "reports",
    labelKey: "modules.reports",
    capabilities: [
      { capability: "read", permission: "report.read" },
      { capability: "export", permission: "report.export" },
    ],
  },
  {
    id: "security",
    labelKey: "modules.security",
    capabilities: [
      {
        capability: "manage",
        permission: "security.session.manage",
        sensitive: true,
      },
    ],
  },
  {
    id: "audit",
    labelKey: "modules.audit",
    capabilities: [{ capability: "read", permission: "audit.read" }],
  },
  {
    id: "bank",
    labelKey: "modules.bank",
    phase: 2,
    capabilities: [
      { capability: "read", permission: "bank.read" },
      { capability: "manage", permission: "bank.manage", sensitive: true },
    ],
  },
];

export function roleHasPermission(role: Role, permission: PermissionId): boolean {
  return role.permissions.includes(permission);
}

export function permissionsInclude(
  permissions: readonly PermissionId[],
  permission: PermissionId,
): boolean {
  return permissions.includes(permission);
}

/** Matrix columns actually used by at least one module (keeps UI meaningful). */
export function usedCapabilities(modules: PermissionModule[] = PERMISSION_MODULES): Capability[] {
  const present = new Set<Capability>();
  for (const permissionModule of modules) {
    for (const cap of permissionModule.capabilities) present.add(cap.capability);
  }
  return CAPABILITY_ORDER.filter((cap) => present.has(cap));
}
