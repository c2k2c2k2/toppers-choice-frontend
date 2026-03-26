import type { Metadata } from "next";
import { AuthLoginCard } from "@/components/auth/auth-login-card";

type AdminLoginPageProps = {
  searchParams: Promise<{
    redirect?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Admin Login",
  description:
    "Sign in to the Topper's Choice admin surface with the shared session and permission-aware route guard foundation.",
};

export default async function AdminLoginPage({
  searchParams,
}: Readonly<AdminLoginPageProps>) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = Array.isArray(resolvedSearchParams.redirect)
    ? resolvedSearchParams.redirect[0]
    : resolvedSearchParams.redirect;

  return <AuthLoginCard surface="admin" redirectTo={redirectTo} />;
}
