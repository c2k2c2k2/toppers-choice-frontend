"use client";

import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { useAuthSession } from "@/lib/auth/auth-provider";

export class MissingAccessTokenError extends Error {
  constructor() {
    super("An authenticated request was attempted without an access token.");
    this.name = "MissingAccessTokenError";
  }
}

interface AuthenticatedQueryOptions<
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Omit<
    UseQueryOptions<TQueryFnData, Error, TData, TQueryKey>,
    "enabled" | "queryFn"
  > {
  enabled?: boolean;
  queryFn: (accessToken: string) => Promise<TQueryFnData>;
}

interface AuthenticatedMutationOptions<
  TData,
  TVariables,
  TContext = unknown,
> extends Omit<
    UseMutationOptions<TData, Error, TVariables, TContext>,
    "mutationFn"
  > {
  mutationFn: (variables: TVariables, accessToken: string) => Promise<TData>;
}

export function useAuthenticatedQuery<
  TQueryFnData,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  enabled = true,
  queryFn,
  ...options
}: AuthenticatedQueryOptions<TQueryFnData, TData, TQueryKey>) {
  const authSession = useAuthSession();

  return useQuery({
    ...options,
    enabled:
      enabled &&
      authSession.isReady &&
      authSession.isAuthenticated &&
      authSession.status !== "anonymous",
    queryFn: async () => {
      const accessToken = await authSession.ensureAccessToken();

      if (!accessToken) {
        throw new MissingAccessTokenError();
      }

      return queryFn(accessToken);
    },
  });
}

export function useAuthenticatedMutation<
  TData,
  TVariables,
  TContext = unknown,
>({
  mutationFn,
  ...options
}: AuthenticatedMutationOptions<TData, TVariables, TContext>) {
  const authSession = useAuthSession();

  return useMutation({
    ...options,
    mutationFn: async (variables) => {
      const accessToken = await authSession.ensureAccessToken();

      if (!accessToken) {
        throw new MissingAccessTokenError();
      }

      return mutationFn(variables, accessToken);
    },
  });
}
