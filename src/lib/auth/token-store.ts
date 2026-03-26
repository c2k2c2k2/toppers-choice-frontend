import type { AuthTokenBundle } from "@/lib/auth/types";

const AUTH_TOKEN_STORAGE_KEY = "toppers-choice.auth.tokens";

export function readAuthTokenBundle() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as AuthTokenBundle;
  } catch {
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return null;
  }
}

export function writeAuthTokenBundle(tokens: AuthTokenBundle) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    AUTH_TOKEN_STORAGE_KEY,
    JSON.stringify(tokens),
  );
}

export function clearAuthTokenBundle() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
