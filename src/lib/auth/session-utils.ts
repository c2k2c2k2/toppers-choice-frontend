import type {
  AuthSessionStatus,
  AuthTokenBundle,
  UserType,
} from "@/lib/auth/types";
import { isApiError } from "@/lib/api/errors";

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 45_000;
const REFRESH_TOKEN_EXPIRY_BUFFER_MS = 30_000;

export function getDefaultHomeHrefForUserType(userType: UserType) {
  return userType === "ADMIN" ? "/admin" : "/student";
}

export function getLoginHrefForUserType(userType: UserType) {
  return userType === "ADMIN" ? "/admin/login" : "/student/login";
}

export function getForbiddenHrefForUserType(userType: UserType) {
  return userType === "ADMIN" ? "/admin/forbidden" : "/student/forbidden";
}

export function sanitizeRedirectTarget(
  value: string | null | undefined,
  fallbackHref: string,
) {
  if (!value || value.trim().length === 0) {
    return fallbackHref;
  }

  const normalizedValue = value.trim();

  if (!normalizedValue.startsWith("/")) {
    return fallbackHref;
  }

  if (normalizedValue.startsWith("//") || normalizedValue.includes("://")) {
    return fallbackHref;
  }

  return normalizedValue;
}

export function buildLoginRedirectHref(
  loginHref: string,
  redirectHref: string,
) {
  return `${loginHref}?redirect=${encodeURIComponent(redirectHref)}`;
}

export function isTimestampExpired(
  timestamp: string | null | undefined,
  bufferMs = 0,
) {
  if (!timestamp) {
    return true;
  }

  const parsedTimestamp = new Date(timestamp).getTime();

  if (Number.isNaN(parsedTimestamp)) {
    return true;
  }

  return parsedTimestamp <= Date.now() + bufferMs;
}

export function shouldRefreshAccessToken(tokens: AuthTokenBundle) {
  return isTimestampExpired(
    tokens.accessTokenExpiresAt,
    ACCESS_TOKEN_REFRESH_BUFFER_MS,
  );
}

export function isRefreshTokenUsable(tokens: AuthTokenBundle) {
  return !isTimestampExpired(
    tokens.refreshTokenExpiresAt,
    REFRESH_TOKEN_EXPIRY_BUFFER_MS,
  );
}

export function deriveSessionStatus(input: {
  isReady: boolean;
  tokens: AuthTokenBundle | null;
  hasIdentity: boolean;
}): AuthSessionStatus {
  if (!input.isReady) {
    return input.tokens ? "session-restored" : "hydrating";
  }

  if (!input.tokens) {
    return "anonymous";
  }

  return input.hasIdentity ? "authenticated" : "session-restored";
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallbackMessage;
}
