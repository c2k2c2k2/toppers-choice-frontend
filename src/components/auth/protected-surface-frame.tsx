"use client";

import { usePathname } from "next/navigation";
import type { UserType } from "@/lib/auth";
import { AuthRouteGuard } from "@/components/auth/route-guards";
import { AdminShell } from "@/components/shells/admin-shell";
import { StudentShell } from "@/components/shells/student-shell";

type SurfaceType = "student" | "admin";

const SURFACE_CONFIG: Record<
  SurfaceType,
  {
    loadingDescription: string;
    loadingTitle: string;
    loginHref: string;
    requiredUserType: UserType;
  }
> = {
  student: {
    loadingDescription:
      "Checking the current student session and preparing the install-ready dashboard shell.",
    loadingTitle: "Preparing the student workspace",
    loginHref: "/student/login",
    requiredUserType: "STUDENT",
  },
  admin: {
    loadingDescription:
      "Checking the current admin session and enforcing the shared access rules for internal tools.",
    loadingTitle: "Preparing the admin workspace",
    loginHref: "/admin/login",
    requiredUserType: "ADMIN",
  },
};

function isOpenAccessRoute(surface: SurfaceType, pathname: string) {
  return (
    pathname === `/${surface}/login` ||
    pathname === `/${surface}/forbidden`
  );
}

export function ProtectedSurfaceFrame({
  children,
  surface,
}: Readonly<{
  children: React.ReactNode;
  surface: SurfaceType;
}>) {
  const pathname = usePathname();
  const config = SURFACE_CONFIG[surface];

  if (isOpenAccessRoute(surface, pathname)) {
    return (
      <div
        className={`min-h-dvh px-4 py-6 ${
          surface === "student"
            ? "bg-[color:var(--surface-student)]"
            : "bg-[color:var(--surface-admin)]"
        }`}
      >
        <div className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-7xl items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  const shell =
    surface === "student" ? (
      <StudentShell>{children}</StudentShell>
    ) : (
      <AdminShell>{children}</AdminShell>
    );

  return (
    <AuthRouteGuard
      loginHref={config.loginHref}
      loadingTitle={config.loadingTitle}
      loadingDescription={config.loadingDescription}
      requiredUserType={config.requiredUserType}
    >
      {shell}
    </AuthRouteGuard>
  );
}
