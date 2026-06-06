"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { BrandLockup } from "@/components/primitives/brand-logo";
import {
  requestEmailOtp,
  requestPasswordReset,
  resetPassword,
  signup as signupRequest,
  verifyEmail,
} from "@/lib/auth/auth-api";
import { useAuthSession, type UserType } from "@/lib/auth";
import {
  getApiErrorMessage,
  getDefaultHomeHrefForUserType,
  sanitizeRedirectTarget,
} from "@/lib/auth/session-utils";

type AuthSurface = "student" | "admin";
type AuthMode = "login" | "signup" | "verify" | "forgot" | "reset";

const MOBILE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;

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

function getPrimaryActionLabel(mode: AuthMode, isSubmitting: boolean) {
  if (isSubmitting) {
    if (mode === "signup") return "Creating account...";
    if (mode === "verify") return "Verifying...";
    if (mode === "forgot") return "Sending code...";
    if (mode === "reset") return "Resetting password...";
    return "Signing in...";
  }

  if (mode === "signup") return "Create account";
  if (mode === "verify") return "Verify email";
  if (mode === "forgot") return "Send reset code";
  if (mode === "reset") return "Reset password";
  return "Sign in";
}

function PasswordVisibilityIcon({
  isVisible,
}: Readonly<{
  isVisible: boolean;
}>) {
  if (isVisible) {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="m3 3 18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.3A10.5 10.5 0 0 1 12 4c5 0 8.6 4.2 10 8a12.3 12.3 0 0 1-3 4.7" />
        <path d="M6.5 6.5A12.4 12.4 0 0 0 2 12c1.4 3.8 5 8 10 8a10.5 10.5 0 0 0 4.1-.8" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verificationPanelRef = useRef<HTMLDivElement | null>(null);
  const hasConfirmPasswordValue = confirmPassword.length > 0;
  const doPasswordsMatch = password === confirmPassword;
  const hasConfirmNewPasswordValue = confirmNewPassword.length > 0;
  const doNewPasswordsMatch = newPassword === confirmNewPassword;

  useEffect(() => {
    setMode(config.allowSignup && initialMode === "signup" ? "signup" : "login");
    setErrorMessage(null);
  }, [config.allowSignup, initialMode]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [cooldownSeconds]);

  useEffect(() => {
    if (mode === "verify") {
      window.setTimeout(() => {
        verificationPanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 80);
    }
  }, [mode]);

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
    setSuccessMessage(null);

    try {
      if (mode === "signup") {
        const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
        if (!MOBILE_PATTERN.test(normalizedPhone)) {
          throw new Error("Enter a valid Indian mobile number.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const response = await signupRequest({
          fullName,
          email,
          phone: normalizedPhone,
          password,
        });
        setPendingEmail(response.email);
        setOtpCode("");
        setCooldownSeconds(response.resendAfterSeconds || 60);
        setSuccessMessage(response.message);
        setMode("verify");
        return;
      }

      if (mode === "verify") {
        const response = await verifyEmail({
          email: pendingEmail || email,
          code: otpCode,
        });

        authSession.setSession({
          user: response.user,
          access: response.access,
          tokens: response.tokens,
          sessionId: response.tokens.sessionId,
        });

        const preferredHomeHref = getDefaultHomeHrefForUserType(
          response.user.userType,
        );
        const nextHref =
          response.user.userType === getSurfaceType(surface)
            ? sanitizeRedirectTarget(redirectTo, preferredHomeHref)
            : preferredHomeHref;

        router.replace(nextHref);
        return;
      }

      if (mode === "forgot") {
        const response = await requestPasswordReset({ email });
        setPendingEmail(email);
        setOtpCode("");
        setSuccessMessage(response.message);
        setCooldownSeconds(60);
        setMode("reset");
        return;
      }

      if (mode === "reset") {
        if (newPassword !== confirmNewPassword) {
          throw new Error("New passwords do not match.");
        }

        const response = await resetPassword({
          email: pendingEmail || email,
          code: otpCode,
          newPassword,
        });
        setSuccessMessage(response.message);
        setPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setOtpCode("");
        setMode("login");
        return;
      }

      const response = await authSession.login({
        email,
        password,
      });

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
          "We couldn't complete this step right now.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendOtp() {
    const targetEmail = pendingEmail || email;
    if (!targetEmail || cooldownSeconds > 0) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (mode === "reset") {
        const response = await requestPasswordReset({ email: targetEmail });
        setSuccessMessage(response.message);
        setCooldownSeconds(60);
      } else {
        const response = await requestEmailOtp({ email: targetEmail });
        setSuccessMessage(response.message);
        setCooldownSeconds(response.resendAfterSeconds || 60);
      }
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "We couldn't resend the code right now."),
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
            {mode === "verify" || mode === "reset" ? (
              <div ref={verificationPanelRef} className="tc-panel rounded-[20px] p-4">
                <p className="tc-overline" style={{ color: config.accentColor }}>
                  {mode === "verify" ? "Email verification" : "Password reset"}
                </p>
                <p className="tc-muted mt-2 text-sm leading-6">
                  Enter the code sent to {pendingEmail || email}.
                </p>
                <OtpCodeInput autoFocus value={otpCode} onChange={setOtpCode} />
                <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
                  {mode === "verify" ? (
                    <button
                      type="submit"
                      className="tc-button-primary w-full sm:w-auto"
                      disabled={isSubmitting || otpCode.length !== 6}
                    >
                      {isSubmitting ? "Verifying..." : "Verify email"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="tc-button-secondary w-full sm:w-auto"
                    disabled={isSubmitting || cooldownSeconds > 0}
                    onClick={handleResendOtp}
                  >
                    {cooldownSeconds > 0
                      ? `Resend in ${cooldownSeconds}s`
                      : "Resend code"}
                  </button>
                </div>
              </div>
            ) : null}

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

            {mode !== "verify" && mode !== "reset" ? (
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
            ) : null}

            {mode === "signup" ? (
              <label className="tc-form-field">
                <span className="tc-form-label">Mobile number</span>
                <input
                  required
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="tc-input"
                  name="phone"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                />
              </label>
            ) : null}

            {mode === "login" || mode === "signup" ? (
            <label className="tc-form-field">
              <span className="tc-form-label">Password</span>
              <div className="relative">
                <input
                  required
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="tc-input pr-12"
                  name="password"
                  placeholder="Enter your password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(0,30,64,0.08)] bg-white/86 text-[color:var(--muted)] transition-colors duration-200 hover:text-[color:var(--brand)]"
                  aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                  aria-pressed={isPasswordVisible}
                  onClick={() => setIsPasswordVisible((value) => !value)}
                >
                  <PasswordVisibilityIcon isVisible={isPasswordVisible} />
                </button>
              </div>
            </label>
            ) : null}

            {mode === "signup" ? (
              <label className="tc-form-field">
                <span className="tc-form-label">Retype password</span>
                <div className="relative">
                  <input
                    required
                    type={isConfirmPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="tc-input pr-12"
                    name="confirmPassword"
                    placeholder="Retype your password"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(0,30,64,0.08)] bg-white/86 text-[color:var(--muted)] transition-colors duration-200 hover:text-[color:var(--brand)]"
                    aria-label={
                      isConfirmPasswordVisible
                        ? "Hide retyped password"
                        : "Show retyped password"
                    }
                    aria-pressed={isConfirmPasswordVisible}
                    onClick={() => setIsConfirmPasswordVisible((value) => !value)}
                  >
                    <PasswordVisibilityIcon isVisible={isConfirmPasswordVisible} />
                  </button>
                </div>
                {hasConfirmPasswordValue ? (
                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{
                      color: doPasswordsMatch
                        ? "var(--accent-student)"
                        : "#9a3412",
                    }}
                  >
                    {doPasswordsMatch
                      ? "Passwords match."
                      : "Passwords do not match."}
                  </p>
                ) : null}
              </label>
            ) : null}

            {mode === "reset" ? (
              <>
                <label className="tc-form-field">
                  <span className="tc-form-label">New password</span>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="tc-input"
                    name="newPassword"
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                    minLength={8}
                  />
                </label>
                <label className="tc-form-field">
                  <span className="tc-form-label">Retype new password</span>
                  <input
                    required
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    className="tc-input"
                    name="confirmNewPassword"
                    placeholder="Retype your new password"
                    autoComplete="new-password"
                    minLength={8}
                  />
                  {hasConfirmNewPasswordValue ? (
                    <p
                      className="mt-2 text-xs font-semibold"
                      style={{
                        color: doNewPasswordsMatch
                          ? "var(--accent-student)"
                          : "#9a3412",
                      }}
                    >
                      {doNewPasswordsMatch
                        ? "Passwords match."
                        : "Passwords do not match."}
                    </p>
                  ) : null}
                </label>
              </>
            ) : null}

            {successMessage ? (
              <div
                className="rounded-[22px] px-4 py-3 text-sm"
                style={{
                  background: "rgba(243, 244, 245, 0.96)",
                  color: "var(--brand)",
                }}
              >
                {successMessage}
              </div>
            ) : null}

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
                className={`tc-button-primary ${mode === "verify" ? "hidden" : ""}`}
              >
                {getPrimaryActionLabel(mode, isSubmitting)}
              </button>
              {mode === "login" ? (
                <button
                  type="button"
                  className="tc-button-secondary"
                  onClick={() => {
                    setMode("forgot");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                >
                  Forgot password
                </button>
              ) : null}
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
