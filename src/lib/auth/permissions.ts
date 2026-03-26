import type { UserAccess } from "@/lib/auth/types";

export function hasPermission(
  access: UserAccess | null | undefined,
  permissionKey: string,
) {
  return access?.effectivePermissionKeys.includes(permissionKey) ?? false;
}

export function hasAnyPermission(
  access: UserAccess | null | undefined,
  permissionKeys: string[],
) {
  return permissionKeys.some((permissionKey) =>
    hasPermission(access, permissionKey),
  );
}

export function hasAllPermissions(
  access: UserAccess | null | undefined,
  permissionKeys: string[],
) {
  return permissionKeys.every((permissionKey) =>
    hasPermission(access, permissionKey),
  );
}
