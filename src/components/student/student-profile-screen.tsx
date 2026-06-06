"use client";

import { useEffect, useState } from "react";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { AuthenticatedFilePreview } from "@/components/primitives/file-preview";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import { requestEmailOtp, verifyEmail } from "@/lib/auth/auth-api";
import { getApiErrorMessage } from "@/lib/auth/session-utils";
import { uploadSelfServiceFile, type FileAsset } from "@/lib/files-api";
import { getMyProfile, updateMyProfile } from "@/lib/profile-api";

const MOBILE_PATTERN = /^(?:\+91)?[6-9]\d{9}$/;

export function StudentProfileScreen() {
  const authSession = useAuthSession();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImageFileAssetId, setProfileImageFileAssetId] = useState<string | null>(null);
  const [profileImageAsset, setProfileImageAsset] = useState<FileAsset | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [isEmailVerificationOpen, setIsEmailVerificationOpen] = useState(false);
  const [isVerificationCodeSending, setIsVerificationCodeSending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const profileQuery = useAuthenticatedQuery({
    queryFn: getMyProfile,
    queryKey: ["student", "profile"],
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.fullName);
    setEmail(profileQuery.data.email);
    setPhone(profileQuery.data.phone ?? "");
    setProfileImageFileAssetId(profileQuery.data.profileImageFileAssetId ?? null);
  }, [profileQuery.data]);

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

  const saveMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedEmail) {
        throw new Error("Email is required.");
      }
      if (normalizedPhone && !MOBILE_PATTERN.test(normalizedPhone)) {
        throw new Error("Enter a valid Indian mobile number.");
      }
      return updateMyProfile(
        {
          email: normalizedEmail,
          fullName,
          phone: normalizedPhone || undefined,
          profileImageFileAssetId,
        },
        accessToken,
      );
    },
    onSuccess: (profile) => {
      setEmail(profile.email);
      authSession.setSession({ user: profile });

      if (!profile.emailVerifiedAt) {
        setIsVerificationCodeSending(true);
        void requestEmailOtp({ email: profile.email })
          .then((response) => {
            setPendingVerificationEmail(profile.email);
            setIsEmailVerificationOpen(true);
            setOtpCode("");
            setCooldownSeconds(response.resendAfterSeconds || 60);
            setMessage("Profile updated. Verify the new email to finish this change.");
          })
          .catch((error) => {
            setErrorMessage(
              getApiErrorMessage(error, "Profile saved, but verification code could not be sent."),
            );
          })
          .finally(() => {
            setIsVerificationCodeSending(false);
          });
        return;
      }

      setPendingVerificationEmail("");
      setIsEmailVerificationOpen(false);
      setIsVerificationCodeSending(false);
      setOtpCode("");
      setMessage("Profile updated.");
    },
    onError: (error) => {
      setIsEmailVerificationOpen(false);
      setIsVerificationCodeSending(false);
      setErrorMessage(getApiErrorMessage(error, "Profile could not be saved."));
    },
  });

  const uploadMutation = useAuthenticatedMutation({
    mutationFn: async (file: File, accessToken) =>
      uploadSelfServiceFile({
        accessToken,
        file,
        purpose: "PROFILE_IMAGE",
      }),
    onSuccess: (asset) => {
      setProfileImageFileAssetId(asset.id);
      setProfileImageAsset(asset);
      setMessage("Profile image uploaded. Save profile to apply it.");
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Profile image could not be uploaded."));
    },
  });

  const verifyEmailMutation = useAuthenticatedMutation({
    mutationFn: async (_: void) =>
      verifyEmail({
        code: otpCode,
        email: pendingVerificationEmail || email,
      }),
    onSuccess: (response) => {
      authSession.setSession({
        user: response.user,
        access: response.access,
        tokens: response.tokens,
        sessionId: response.tokens.sessionId,
      });
      setPendingVerificationEmail("");
      setIsEmailVerificationOpen(false);
      setOtpCode("");
      setCooldownSeconds(0);
      setMessage("Email verified and profile updated.");
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Email could not be verified."));
    },
  });

  async function handleResendEmailOtp() {
    const targetEmail = pendingVerificationEmail || email;

    if (!targetEmail || cooldownSeconds > 0) {
      return;
    }

    setErrorMessage(null);
    setMessage(null);

    try {
      setIsVerificationCodeSending(true);
      const response = await requestEmailOtp({ email: targetEmail });
      setPendingVerificationEmail(targetEmail);
      setIsEmailVerificationOpen(true);
      setCooldownSeconds(response.resendAfterSeconds || 60);
      setMessage("Verification code sent again.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Verification code could not be sent."));
    } finally {
      setIsVerificationCodeSending(false);
    }
  }

  const previewAssetId = profileImageFileAssetId;
  const previewAssetContentType =
    profileImageAsset?.id === profileImageFileAssetId
      ? profileImageAsset.contentType
      : undefined;
  const previewAssetName =
    profileImageAsset?.id === profileImageFileAssetId
      ? profileImageAsset.originalFileName
      : "Profile image";

  return (
    <>
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="tc-card rounded-[24px] p-6">
        <p className="tc-overline">Profile</p>
        <h2 className="tc-display mt-3 text-2xl font-semibold">Your student profile</h2>
        <p className="tc-muted mt-3 text-sm leading-6">
          Keep your name and mobile number current for account support and future verification.
        </p>
        <div className="mt-6 flex items-center gap-4">
          {previewAssetId ? (
            <AuthenticatedFilePreview
              assetId={previewAssetId}
              contentType={previewAssetContentType}
              fileName={previewAssetName}
              label="Preview profile image"
              thumbClassName="h-20 w-20"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-[18px] bg-[color:var(--surface-student)] text-2xl font-bold text-[color:var(--brand)]">
              {fullName.trim().slice(0, 1).toUpperCase() || "T"}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-[color:var(--brand)]">{fullName || "Student"}</p>
            <p className="tc-muted truncate text-sm">{email || profileQuery.data?.email}</p>
            {profileImageFileAssetId ? (
              <p className="mt-1 text-xs font-semibold text-[color:var(--accent-student)]">
                Profile image selected
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <form
        className="tc-card rounded-[24px] p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setErrorMessage(null);
          setMessage(null);
          const normalizedEmail = email.trim().toLowerCase();
          const currentEmail = profileQuery.data?.email?.trim().toLowerCase();

          if (normalizedEmail && normalizedEmail !== currentEmail) {
            setPendingVerificationEmail(normalizedEmail);
            setIsEmailVerificationOpen(true);
            setIsVerificationCodeSending(true);
            setOtpCode("");
          }

          saveMutation.mutate();
        }}
      >
        <div className="grid gap-4">
          <label className="tc-form-field">
            <span className="tc-form-label">Full name</span>
            <input className="tc-input" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </label>
          <label className="tc-form-field">
            <span className="tc-form-label">Email</span>
            <input className="tc-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          </label>
          <label className="tc-form-field">
            <span className="tc-form-label">Mobile number</span>
            <input className="tc-input" value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="+91 98765 43210" />
          </label>
          <label className="tc-form-field">
            <span className="tc-form-label">Profile picture</span>
            <input
              className="tc-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
            />
          </label>
          {pendingVerificationEmail ? (
            <div className="tc-panel rounded-[18px] p-4 text-sm">
              <p className="font-semibold text-[color:var(--brand)]">
                Email verification pending
              </p>
              <p className="tc-muted mt-1 leading-6">
                Finish verifying {pendingVerificationEmail} to secure this profile change.
              </p>
              <button
                type="button"
                className="tc-button-secondary mt-3 w-full sm:w-auto"
                onClick={() => setIsEmailVerificationOpen(true)}
              >
                Continue verification
              </button>
            </div>
          ) : null}
          {message ? <div className="tc-panel rounded-[18px] p-4 text-sm">{message}</div> : null}
          {errorMessage ? (
            <div className="rounded-[18px] bg-[#fff5f0] p-4 text-sm text-[#9a3412]">{errorMessage}</div>
          ) : null}
          <button className="tc-button-primary" disabled={saveMutation.isPending || uploadMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </section>
    {pendingVerificationEmail && isEmailVerificationOpen ? (
      <div className="fixed inset-0 z-[90] grid place-items-center bg-[rgba(0,22,46,0.66)] p-4 backdrop-blur-sm">
        <div className="tc-card w-[min(25rem,calc(100vw-2rem))] rounded-[24px] p-5 shadow-[0_24px_70px_rgba(0,30,64,0.22)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="tc-overline">Verify new email</p>
              <h2 className="tc-display mt-2 text-xl font-semibold">Enter verification code</h2>
            </div>
            <button
              type="button"
              className="tc-button-secondary"
              onClick={() => setIsEmailVerificationOpen(false)}
            >
              Close
            </button>
          </div>
          <p className="tc-muted mt-3 text-sm leading-6">
            {isVerificationCodeSending
              ? `Preparing a verification code for ${pendingVerificationEmail}.`
              : `We sent a code to ${pendingVerificationEmail}.`}
          </p>
          <OtpCodeInput autoFocus={!isVerificationCodeSending} value={otpCode} onChange={setOtpCode} />
          <div className="mt-5 grid gap-3">
            <button
              type="button"
              className="tc-button-primary w-full"
              disabled={isVerificationCodeSending || verifyEmailMutation.isPending || otpCode.length !== 6}
              onClick={() => verifyEmailMutation.mutate()}
            >
              {isVerificationCodeSending
                ? "Sending code..."
                : verifyEmailMutation.isPending
                  ? "Verifying..."
                  : "Verify email"}
            </button>
            <button
              type="button"
              className="tc-button-secondary w-full"
              disabled={isVerificationCodeSending || cooldownSeconds > 0}
              onClick={handleResendEmailOtp}
            >
              {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend code"}
            </button>
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
