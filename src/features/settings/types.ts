export type DataScope = "OWN" | "COMPANY" | "TENANT";

export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export type PermissionId =
  | "company.read"
  | "company.manage"
  | "user.read"
  | "user.invite"
  | "user.update"
  | "user.disable"
  | "role.read"
  | "role.manage"
  | "customer.read"
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "product.read"
  | "product.create"
  | "product.update"
  | "quote.read"
  | "quote.create"
  | "quote.update"
  | "quote.send"
  | "quote.approve"
  | "invoice.read"
  | "invoice.create"
  | "invoice.validate"
  | "payment.read"
  | "payment.create"
  | "payment.manage"
  | "template.email.read"
  | "template.email.manage"
  | "template.pdf.read"
  | "template.pdf.manage"
  | "report.read"
  | "report.export"
  | "security.session.manage"
  | "audit.read"
  | "bank.read"
  | "bank.manage";

export type Capability =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "send"
  | "approve"
  | "validate"
  | "manage"
  | "invite"
  | "disable"
  | "export";

export type RoleId =
  | "tenant-admin"
  | "business-owner"
  | "accountant"
  | "sales"
  | "viewer";

export type Company = {
  id: string;
  name: string;
  /** ISO currency code shown in the sidebar switcher. */
  currency?: string;
  /** Short tenant / legal-entity label under the company name. */
  subtitle?: string;
};

export type Role = {
  id: RoleId | string;
  nameKey: string;
  descriptionKey: string;
  defaultScope: DataScope;
  permissions: PermissionId[];
  system: boolean;
  /** Platform roles must not appear in tenant settings by default. */
  platform?: boolean;
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  initials: string;
  roleId: RoleId | string;
  dataScope: DataScope;
  companyIds: string[];
  status: UserStatus;
  lastActivityLabel: string;
};

export type PermissionCapability = {
  capability: Capability;
  permission: PermissionId;
  sensitive?: boolean;
};

export type PermissionModule = {
  id: string;
  labelKey: string;
  phase?: 2;
  capabilities: PermissionCapability[];
};

export type ApprovalRulesConfig = {
  quoteApprovalThresholdEuro: number;
  requireApprovalAboveThreshold: boolean;
};

export type SsoProviderStatus = "connected" | "not_configured";

export type SecuritySettingsConfig = {
  totpEnabled: boolean;
  email2faEnabled: boolean;
  googleSso: SsoProviderStatus;
  microsoftSso: SsoProviderStatus;
  failedLoginLockout: number;
  preferredLanguage: "fr" | "en" | "vi";
};

export type SettingsNavItemId =
  | "general"
  | "company"
  | "users"
  | "billing"
  | "documents"
  | "payments"
  | "integrations"
  | "automation"
  | "templates"
  | "notifications"
  | "security"
  | "audit";
