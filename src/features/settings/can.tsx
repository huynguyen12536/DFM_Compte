"use client";

import type { ReactNode } from "react";

import { permissionsInclude } from "./permissions";
import type { PermissionId } from "./types";

type CanProps = {
  permission: PermissionId;
  permissions: readonly PermissionId[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Permission-ready gate. Prefer this over role-name checks.
 * Pass the active membership's effective permission list from the API later.
 */
export function Can({ permission, permissions, children, fallback = null }: CanProps) {
  if (!permissionsInclude(permissions, permission)) return <>{fallback}</>;
  return <>{children}</>;
}

export function can(permissions: readonly PermissionId[], permission: PermissionId): boolean {
  return permissionsInclude(permissions, permission);
}
