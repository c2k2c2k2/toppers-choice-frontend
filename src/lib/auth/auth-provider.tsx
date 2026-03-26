"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { queryKeys } from "@/lib/api/query-keys";
import { isApiError } from "@/lib/api/errors";
import {
  getMe,
  login as loginRequest,
  logout as logoutRequest,
  refreshSession as refreshAuthSession,
  type LoginPayload,
} from "@/lib/auth/auth-api";
import { hasPermission } from "@/lib/auth/permissions";
import {
  deriveSessionStatus,
  getDefaultHomeHrefForUserType,
  isRefreshTokenUsable,
  shouldRefreshAccessToken,
} from "@/lib/auth/session-utils";
import {
  clearAuthTokenBundle,
  readAuthTokenBundle,
  writeAuthTokenBundle,
} from "@/lib/auth/token-store";
import type {
  AuthMeResponse,
  AuthResponse,
  AuthSessionStatus,
  AuthTokenBundle,
  UserAccess,
  UserIdentity,
} from "@/lib/auth/types";

interface AuthSessionState {
  status: AuthSessionStatus;
  user: UserIdentity | null;
  access: UserAccess | null;
  tokens: AuthTokenBundle | null;
  sessionId: string | null;
}

interface AuthSessionContextValue extends AuthSessionState {
  isReady: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isStudent: boolean;
  preferredHomeHref: string | null;
  clearSession: () => void;
  ensureAccessToken: () => Promise<string | null>;
  hasPermission: (permissionKey: string) => boolean;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
  reloadSession: () => Promise<void>;
  setSession: (input: {
    user?: UserIdentity | null;
    access?: UserAccess | null;
    tokens?: AuthTokenBundle | null;
    sessionId?: string | null;
  }) => void;
}

const INITIAL_STATE: AuthSessionState = {
  status: "hydrating",
  user: null,
  access: null,
  tokens: null,
  sessionId: null,
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function isIdentityPayload(
  response: AuthResponse | AuthMeResponse,
): response is AuthResponse {
  return "tokens" in response;
}

function buildState(input: {
  access?: UserAccess | null;
  isReady: boolean;
  sessionId?: string | null;
  tokens?: AuthTokenBundle | null;
  user?: UserIdentity | null;
}): AuthSessionState {
  const nextTokens = input.tokens ?? null;
  const nextUser = input.user ?? null;
  const nextAccess = input.access ?? null;
  const nextSessionId = input.sessionId ?? nextTokens?.sessionId ?? null;

  return {
    status: deriveSessionStatus({
      isReady: input.isReady,
      tokens: nextTokens,
      hasIdentity: Boolean(nextUser && nextAccess),
    }),
    user: nextUser,
    access: nextAccess,
    tokens: nextTokens,
    sessionId: nextSessionId,
  };
}

export function AuthSessionProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthSessionState>(INITIAL_STATE);
  const [isReady, setIsReady] = useState(false);
  const stateRef = useRef<AuthSessionState>(INITIAL_STATE);
  const refreshPromiseRef = useRef<Promise<AuthResponse | null> | null>(null);

  function commitState(nextState: AuthSessionState, ready = true) {
    stateRef.current = nextState;
    setState(nextState);
    setIsReady(ready);
  }

  function syncAuthQueries(nextState: AuthSessionState) {
    if (nextState.user && nextState.access && nextState.sessionId) {
      queryClient.setQueryData(queryKeys.auth.me(), {
        user: nextState.user,
        access: nextState.access,
        sessionId: nextState.sessionId,
      });
      return;
    }

    queryClient.removeQueries({ queryKey: queryKeys.auth.me() });
    queryClient.removeQueries({ queryKey: queryKeys.auth.sessions() });
  }

  function applyResolvedSession(
    response: AuthResponse | AuthMeResponse,
    tokens: AuthTokenBundle | null,
  ) {
    const nextTokens = isIdentityPayload(response) ? response.tokens : tokens;

    if (nextTokens) {
      writeAuthTokenBundle(nextTokens);
    } else {
      clearAuthTokenBundle();
    }

    const nextState = buildState({
      isReady: true,
      user: response.user,
      access: response.access,
      tokens: nextTokens,
      sessionId: isIdentityPayload(response)
        ? response.tokens.sessionId
        : response.sessionId,
    });

    syncAuthQueries(nextState);
    commitState(nextState, true);
  }

  function clearResolvedSession() {
    clearAuthTokenBundle();
    const nextState = buildState({
      isReady: true,
      user: null,
      access: null,
      tokens: null,
      sessionId: null,
    });

    syncAuthQueries(nextState);
    commitState(nextState, true);
  }

  async function rotateSessionTokens(
    sourceTokens?: AuthTokenBundle | null,
  ): Promise<AuthResponse | null> {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const activeTokens =
      sourceTokens ?? stateRef.current.tokens ?? readAuthTokenBundle();

    if (!activeTokens || !isRefreshTokenUsable(activeTokens)) {
      clearResolvedSession();
      return null;
    }

    const pendingRefresh = (async () => {
      try {
        const response = await refreshAuthSession({
          refreshToken: activeTokens.refreshToken,
        });

        applyResolvedSession(response, response.tokens);
        return response;
      } catch {
        clearResolvedSession();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = pendingRefresh;
    return pendingRefresh;
  }

  async function bootstrapSession(sourceTokens?: AuthTokenBundle | null) {
    const storedTokens = sourceTokens ?? readAuthTokenBundle();

    if (!storedTokens) {
      clearResolvedSession();
      return;
    }

    const restoredState = buildState({
      isReady: false,
      user: null,
      access: null,
      tokens: storedTokens,
      sessionId: storedTokens.sessionId,
    });

    syncAuthQueries(restoredState);
    commitState(restoredState, false);

    if (shouldRefreshAccessToken(storedTokens)) {
      await rotateSessionTokens(storedTokens);
      return;
    }

    try {
      const response = await getMe(storedTokens.accessToken);
      applyResolvedSession(response, storedTokens);
    } catch (error) {
      if (isApiError(error) && error.status === 401) {
        await rotateSessionTokens(storedTokens);
        return;
      }

      clearResolvedSession();
    }
  }

  async function ensureAccessToken() {
    const activeTokens =
      stateRef.current.tokens ?? readAuthTokenBundle();

    if (!activeTokens) {
      return null;
    }

    if (!shouldRefreshAccessToken(activeTokens)) {
      return activeTokens.accessToken;
    }

    const refreshedSession = await rotateSessionTokens(activeTokens);
    return refreshedSession?.tokens.accessToken ?? null;
  }

  function setSession(input: {
    user?: UserIdentity | null;
    access?: UserAccess | null;
    tokens?: AuthTokenBundle | null;
    sessionId?: string | null;
  }) {
    const nextTokens =
      input.tokens === undefined ? stateRef.current.tokens : input.tokens;
    const nextUser =
      input.user === undefined ? stateRef.current.user : input.user;
    const nextAccess =
      input.access === undefined ? stateRef.current.access : input.access;
    const nextSessionId =
      input.sessionId === undefined
        ? nextTokens?.sessionId ?? stateRef.current.sessionId
        : input.sessionId;

    if (nextTokens) {
      writeAuthTokenBundle(nextTokens);
    } else {
      clearAuthTokenBundle();
    }

    const nextState = buildState({
      isReady: true,
      user: nextUser,
      access: nextAccess,
      tokens: nextTokens,
      sessionId: nextSessionId,
    });

    syncAuthQueries(nextState);
    commitState(nextState, true);
  }

  async function login(payload: LoginPayload) {
    setIsReady(false);

    try {
      const response = await loginRequest(payload);
      applyResolvedSession(response, response.tokens);
      return response;
    } catch (error) {
      setIsReady(true);
      throw error;
    }
  }

  async function logout() {
    try {
      const accessToken = await ensureAccessToken();

      if (accessToken) {
        await logoutRequest(accessToken);
      }
    } catch {
      // A failing logout request should still clear the local session.
    } finally {
      clearResolvedSession();
    }
  }

  async function reloadSession() {
    await bootstrapSession(
      stateRef.current.tokens ?? readAuthTokenBundle(),
    );
  }

  useEffect(() => {
    void bootstrapSession();
    // The provider should bootstrap exactly once from the persisted snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preferredHomeHref = state.user
    ? getDefaultHomeHrefForUserType(state.user.userType)
    : null;

  const value: AuthSessionContextValue = {
    ...state,
    isReady,
    isAdmin: state.user?.userType === "ADMIN",
    isAuthenticated: Boolean(
      isReady && state.tokens && state.user && state.access,
    ),
    isStudent: state.user?.userType === "STUDENT",
    preferredHomeHref,
    clearSession: clearResolvedSession,
    ensureAccessToken,
    hasPermission: (permissionKey) =>
      hasPermission(state.access, permissionKey),
    login,
    logout,
    refreshSession: () =>
      rotateSessionTokens(stateRef.current.tokens ?? readAuthTokenBundle()),
    reloadSession,
    setSession,
  };

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error(
      "useAuthSession must be used within an AuthSessionProvider.",
    );
  }

  return context;
}
