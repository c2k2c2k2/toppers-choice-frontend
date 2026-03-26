import type { Metadata } from "next";
import { AuthLoginCard } from "@/components/auth/auth-login-card";

type StudentLoginPageProps = {
  searchParams: Promise<{
    redirect?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Student Login",
  description:
    "Sign in to the Topper's Choice student app and continue into the protected learning workspace.",
};

export default async function StudentLoginPage({
  searchParams,
}: Readonly<StudentLoginPageProps>) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = Array.isArray(resolvedSearchParams.redirect)
    ? resolvedSearchParams.redirect[0]
    : resolvedSearchParams.redirect;

  return <AuthLoginCard surface="student" redirectTo={redirectTo} />;
}
