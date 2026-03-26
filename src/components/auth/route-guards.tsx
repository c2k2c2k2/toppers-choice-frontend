"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  hasAllPermissions,
  hasAnyPermission,
  useAuthSession,
  type UserType,
} from "@/lib/auth";
import {
  buildLoginRedirectHref,
  getDefaultHomeHrefForUserType,
  getForbiddenHrefForUserType,
} from "@/lib/auth/session-utils";
import { LoadingState } from "@/components/primitives/loading-state";

function resolveCurrentRoute(pathname: string) {
  if (typeof window === "undefined") {
    return pathname;
  }

  return `${pathname}${window.location.search}`;
}

interface CanProps {
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function canRender(input: {
  access: ReturnType<typeof useAuthSession>["access"];
  permission?: string;
  anyPermissions?: string[];
  allPermissions?: string[];
}) {
  if (input.permission) {
    return input.access?.effectivePermissionKeys.includes(input.permission) ?? false;
  }

  if (input.anyPermissions && input.anyPermissions.length > 0) {
    return hasAnyPermission(input.access, input.anyPermissions);
  }

  if (input.allPermissions && input.allPermissions.length > 0) {
    return hasAllPermissions(input.access, input.allPermissions);
  }

  return true;
}

export function Can({
  permission,
  anyPermissions,
  allPermissions,
  children,
  fallback = null,
}: Readonly<CanProps>) {
  const authSession = useAuthSession();

  return canRender({
    access: authSession.access,
    permission,
    anyPermissions,
    allPermissions,
  })
    ? children
    : fallback;
}

export function PermissionGate(props: Readonly<CanProps>) {
  return <Can {...props} />;
}

interface AuthRouteGuardProps {
  children: React.ReactNode;
  loginHref: string;
  loadingDescription: string;
  loadingTitle: string;
  permission?: string;
  permissionMatch?: "all" | "any";
  permissionKeys?: string[];
  requiredUserType: UserType;
}

export function AuthRouteGuard({
  children,
  loginHref,
  loadingDescription,
  loadingTitle,
  permission,
  permissionKeys = [],
  permissionMatch = "all",
  requiredUserType,
}: Readonly<AuthRouteGuardProps>) {
  const authSession = useAuthSession();
  const pathname = usePathname();
  const router = useRouter();

  const waitingForBootstrap =
    !authSession.isReady ||
    authSession.status === "hydrating" ||
    authSession.status === "session-restored";

  const permissionAllowed = canRender({
    access: authSession.access,
    permission,
    anyPermissions: permissionMatch === "any" ? permissionKeys : undefined,
    allPermissions: permissionMatch === "all" ? permissionKeys : undefined,
  });

  useEffect(() => {
    if (waitingForBootstrap) {
      return;
    }

    if (!authSession.isAuthenticated) {
      router.replace(
        buildLoginRedirectHref(loginHref, resolveCurrentRoute(pathname)),
      );
      return;
    }

    if (authSession.user?.userType !== requiredUserType) {
      router.replace(
        authSession.user
          ? getDefaultHomeHrefForUserType(authSession.user.userType)
          : loginHref,
      );
      return;
    }

    if (!permissionAllowed) {
      router.replace(getForbiddenHrefForUserType(requiredUserType));
    }
  }, [
    authSession.isAuthenticated,
    authSession.isReady,
    authSession.status,
    authSession.user,
    loadingDescription,
    loginHref,
    pathname,
    permissionAllowed,
    requiredUserType,
    router,
    waitingForBootstrap,
  ]);

  if (waitingForBootstrap) {
    return (
      <LoadingState
        title={loadingTitle}
        description={loadingDescription}
      />
    );
  }

  if (
    !authSession.isAuthenticated ||
    authSession.user?.userType !== requiredUserType ||
    !permissionAllowed
  ) {
    return (
      <LoadingState
        title={loadingTitle}
        description={loadingDescription}
      />
    );
  }

  return <>{children}</>;
}
