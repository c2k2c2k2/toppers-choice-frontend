import { apiRequest } from "@/lib/api/client";
import { apiRoutes } from "@/lib/api/routes";
import type {
  ActionMessageResponse,
  AuthMeResponse,
  AuthResponse,
  AuthSessionsResponse,
} from "@/lib/auth/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  newPassword: string;
}

export function signup(payload: SignupPayload) {
  return apiRequest<AuthResponse>(apiRoutes.auth.signup, {
    method: "POST",
    body: payload,
  });
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthResponse>(apiRoutes.auth.login, {
    method: "POST",
    body: payload,
  });
}

export function refreshSession(payload: RefreshPayload) {
  return apiRequest<AuthResponse>(apiRoutes.auth.refresh, {
    method: "POST",
    body: payload,
  });
}

export function logout(accessToken: string) {
  return apiRequest<ActionMessageResponse>(apiRoutes.auth.logout, {
    method: "POST",
    accessToken,
  });
}

export function getMe(accessToken: string) {
  return apiRequest<AuthMeResponse>(apiRoutes.auth.me, {
    accessToken,
    cache: "no-store",
  });
}

export function getSessions(accessToken: string) {
  return apiRequest<AuthSessionsResponse>(apiRoutes.auth.sessions, {
    accessToken,
    cache: "no-store",
  });
}

export function requestPasswordReset(payload: ForgotPasswordPayload) {
  return apiRequest<ActionMessageResponse>(apiRoutes.auth.forgotPassword, {
    method: "POST",
    body: payload,
  });
}

export function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest<ActionMessageResponse>(apiRoutes.auth.resetPassword, {
    method: "POST",
    body: payload,
  });
}
