"use client";

import { AuthRouteGuard } from "@/components/auth/route-guards";

export function AdminPermissionGuard({
  children,
  permissionKeys,
}: Readonly<{
  children: React.ReactNode;
  permissionKeys: string[];
}>) {
  return (
    <AuthRouteGuard
      loginHref="/admin/login"
      loadingTitle="Checking admin access"
      loadingDescription="Verifying the current admin session and loading the requested internal workspace."
      permissionKeys={permissionKeys}
      permissionMatch="any"
      requiredUserType="ADMIN"
    >
      {children}
    </AuthRouteGuard>
  );
}
