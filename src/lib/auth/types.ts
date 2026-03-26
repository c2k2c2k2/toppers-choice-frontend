export type UserType = "ADMIN" | "STUDENT";

export interface RoleSummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  userType: UserType;
  isSystem: boolean;
  isActive: boolean;
  permissionKeys: string[];
}

export interface UserPermissionOverride {
  permissionKey: string;
  isAllowed: boolean;
  reason: string | null;
  updatedAt: string;
}

export interface UserAccess {
  userId: string;
  siteId: string;
  userType: UserType;
  roles: RoleSummary[];
  directOverrides: UserPermissionOverride[];
  effectivePermissionKeys: string[];
}

export interface UserIdentity {
  id: string;
  siteId: string;
  email: string;
  fullName: string;
  userType: UserType;
  status: string;
  lastLoginAt?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenBundle {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  sessionId: string;
}

export interface AuthResponse {
  user: UserIdentity;
  access: UserAccess;
  tokens: AuthTokenBundle;
}

export interface AuthMeResponse {
  user: UserIdentity;
  sessionId: string;
  access: UserAccess;
}

export interface RefreshSession {
  id: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  lastUsedAt?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent: boolean;
}

export interface AuthSessionsResponse {
  sessions: RefreshSession[];
}

export interface ActionMessageResponse {
  message: string;
}

export type AuthSessionStatus =
  | "hydrating"
  | "anonymous"
  | "session-restored"
  | "authenticated";
