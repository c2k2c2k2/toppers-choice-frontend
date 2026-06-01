import type { Metadata } from "next";
import { AuthLoginCard } from "@/components/auth/auth-login-card";

type StudentLoginPageProps = {
  searchParams: Promise<{
    mode?: string | string[] | undefined;
    redirect?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Student Login",
  description:
    "Sign in to continue your Toppers' Choice notes, practice, tests, and updates.",
};

export default async function StudentLoginPage({
  searchParams,
}: Readonly<StudentLoginPageProps>) {
  const resolvedSearchParams = await searchParams;
  const redirectTo = Array.isArray(resolvedSearchParams.redirect)
    ? resolvedSearchParams.redirect[0]
    : resolvedSearchParams.redirect;
  const mode = Array.isArray(resolvedSearchParams.mode)
    ? resolvedSearchParams.mode[0]
    : resolvedSearchParams.mode;
  const initialMode = mode === "signup" ? "signup" : "login";

  return (
    <AuthLoginCard
      surface="student"
      redirectTo={redirectTo}
      initialMode={initialMode}
    />
  );
}
