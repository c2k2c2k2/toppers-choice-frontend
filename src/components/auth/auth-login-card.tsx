"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/primitives/brand-logo";
import { signup as signupRequest } from "@/lib/auth/auth-api";
import { useAuthSession, type UserType } from "@/lib/auth";
import {
  getApiErrorMessage,
  getDefaultHomeHrefForUserType,
  sanitizeRedirectTarget,
} from "@/lib/auth/session-utils";

type AuthSurface = "student" | "admin";
type AuthMode = "login" | "signup";

const SURFACE_CONFIG: Record<
  AuthSurface,
  {
    accentColor: string;
    allowSignup: boolean;
    description: string;
    eyebrow: string;
    highlights: string[];
    otherSurfaceHref?: string;
    otherSurfaceLabel?: string;
    title: string;
  }
> = {
  student: {
    accentColor: "var(--accent-student)",
    allowSignup: true,
    description:
      "Create an account or sign in to continue studying.",
    eyebrow: "Student access",
    highlights: [],
    title: "Start learning.",
  },
  admin: {
    accentColor: "var(--accent-admin)",
    allowSignup: false,
    description:
      "Sign in to manage website content, learning material, students, plans, and day-to-day operations.",
    eyebrow: "Admin sign in",
    highlights: [
      "Manage pages, content, tests, students, and plans",
      "Only the sections allowed for your role are shown",
      "Important actions stay protected by admin permissions",
    ],
    otherSurfaceHref: "/student/login",
    otherSurfaceLabel: "Student login",
    title: "Admin login",
  },
};

function getSurfaceType(surface: AuthSurface): UserType {
  return surface === "admin" ? "ADMIN" : "STUDENT";
}

export function AuthLoginCard({
  initialMode = "login",
  redirectTo,
  surface,
}: Readonly<{
  initialMode?: AuthMode;
  redirectTo: string | null | undefined;
  surface: AuthSurface;
}>) {
  const authSession = useAuthSession();
  const router = useRouter();
  const config = SURFACE_CONFIG[surface];
  const [mode, setMode] = useState<AuthMode>(
    config.allowSignup && initialMode === "signup" ? "signup" : "login",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMode(config.allowSignup && initialMode === "signup" ? "signup" : "login");
    setErrorMessage(null);
  }, [config.allowSignup, initialMode]);

  useEffect(() => {
    if (!authSession.isReady || !authSession.isAuthenticated || !authSession.user) {
      return;
    }

    const preferredHomeHref = getDefaultHomeHrefForUserType(
      authSession.user.userType,
    );
    const nextHref =
      authSession.user.userType === getSurfaceType(surface)
        ? sanitizeRedirectTarget(redirectTo, preferredHomeHref)
        : preferredHomeHref;

    router.replace(nextHref);
  }, [
    authSession.isAuthenticated,
    authSession.isReady,
    authSession.user,
    redirectTo,
    router,
    surface,
  ]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response =
        mode === "signup"
          ? await signupRequest({
              fullName,
              email,
              password,
            })
          : await authSession.login({
              email,
              password,
            });

      if (mode === "signup") {
        authSession.setSession({
          user: response.user,
          access: response.access,
          tokens: response.tokens,
          sessionId: response.tokens.sessionId,
        });
      }

      const preferredHomeHref = getDefaultHomeHrefForUserType(
        response.user.userType,
      );
      const nextHref =
        response.user.userType === getSurfaceType(surface)
          ? sanitizeRedirectTarget(redirectTo, preferredHomeHref)
          : preferredHomeHref;

      router.replace(nextHref);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "We couldn't sign you in right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="tc-card mx-auto w-full max-w-4xl rounded-[24px] p-4 md:p-6">
      <div className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
        <div className={`tc-hero rounded-[22px] p-5 ${surface === "student" ? "hidden lg:block" : ""}`}>
          <div className="inline-flex rounded-[24px] bg-white/10 px-4 py-3 shadow-[0_16px_34px_rgba(0,30,64,0.18)] backdrop-blur-sm">
            <BrandLockup
              alt="Toppers' Choice"
              priority
              sizes="184px"
              className="w-[11.5rem] max-w-full"
            />
          </div>
          <p
            className="tc-kicker mt-5"
            style={{ color: "rgba(255, 184, 111, 0.92)" }}
          >
            {config.eyebrow}
          </p>
          <h1 className="tc-display mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
            {config.title}
          </h1>
          <p className="tc-muted mt-3 max-w-xl text-sm leading-6">
            {config.description}
          </p>

          {config.highlights.length > 0 ? (
          <div className="mt-5 grid gap-2">
            {config.highlights.map((item) => (
              <div
                key={item}
                className="rounded-[18px] border border-white/12 bg-white/10 px-4 py-3 text-sm text-white/88"
              >
                {item}
              </div>
            ))}
          </div>
          ) : null}
        </div>

        <div className="space-y-4">
          {surface === "student" ? (
            <div className="flex items-center gap-3 lg:hidden">
              <BrandLockup
                alt="Toppers' Choice"
                priority
                sizes="160px"
                className="w-40 max-w-full"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setErrorMessage(null);
              }}
              className="tc-nav-chip"
              data-active={mode === "login"}
            >
              Sign in
            </button>
            {config.allowSignup ? (
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage(null);
                }}
                className="tc-nav-chip"
                data-active={mode === "signup"}
              >
                Create student account
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <label className="tc-form-field">
                <span className="tc-form-label">Full name</span>
                <input
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="tc-input"
                  name="fullName"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>
            ) : null}

            <label className="tc-form-field">
              <span className="tc-form-label">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="tc-input"
                name="email"
                placeholder={surface === "admin" ? "admin@topperschoice.in" : "student@example.com"}
                autoComplete="email"
              />
            </label>

            <label className="tc-form-field">
              <span className="tc-form-label">Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="tc-input"
                name="password"
                placeholder="Enter your password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={8}
              />
            </label>

            {errorMessage ? (
              <div
                className="rounded-[22px] px-4 py-3 text-sm"
                style={{
                  background: "rgba(255, 245, 240, 0.96)",
                  border: "1px solid rgba(225, 134, 0, 0.18)",
                  color: "var(--brand)",
                }}
              >
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="tc-button-primary"
              >
                {isSubmitting
                  ? mode === "signup"
                    ? "Creating account..."
                    : "Signing in..."
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
              <Link href="/" className="tc-button-secondary">
                Back to public home
              </Link>
              {config.otherSurfaceHref && config.otherSurfaceLabel ? (
                <Link href={config.otherSurfaceHref} className="tc-button-secondary">
                  {config.otherSurfaceLabel}
                </Link>
              ) : null}
            </div>
          </form>

          <div className={`tc-panel rounded-[20px] p-4 ${surface === "student" ? "hidden" : ""}`}>
            <p className="tc-overline" style={{ color: config.accentColor }}>
              Helpful note
            </p>
            <p className="tc-muted mt-3 text-sm leading-6">
              If you sign in to the wrong panel by mistake, we will send you to
              the correct student or admin dashboard automatically.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
