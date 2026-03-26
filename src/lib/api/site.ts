import { queryOptions } from "@tanstack/react-query";
import type { ApiRequestOptions } from "@/lib/api/client";
import { apiRequest } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { apiRoutes } from "@/lib/api/routes";
import { withQuery } from "@/lib/api/config";

export interface PublicSiteSummary {
  id?: string;
  code?: string;
  slug?: string;
  name?: string;
  primaryDomain?: string | null;
  defaultLocale?: string;
  timezone?: string;
}

export interface SiteBrandingConfig {
  displayName?: string;
  tagline?: string;
  motto?: string;
  description?: string;
  proprietorName?: string;
  address?: string;
  supportWhatsapp?: string;
  supportNote?: string;
}

export interface PlatformFeatureFlags {
  notes?: boolean;
  practice?: boolean;
  tests?: boolean;
  careerGuidance?: boolean;
  interviewGuidance?: boolean;
  englishSpeaking?: boolean;
}

export interface PublicBootstrapResponse {
  site: PublicSiteSummary;
  publicConfig: {
    site?: Record<string, unknown> & {
      branding?: SiteBrandingConfig;
    };
    platform?: Record<string, unknown> & {
      features?: PlatformFeatureFlags;
    };
  };
  runtime: {
    appBaseUrl?: string | null;
    apiBasePath?: string | null;
    [key: string]: unknown;
  };
  versions: Array<Record<string, unknown>>;
  resolvedAt: string;
  stale: boolean;
}

export interface PublicBootstrapParams {
  siteCode?: string | null;
}

export function fetchPublicBootstrap(
  params: PublicBootstrapParams = {},
  options: ApiRequestOptions = {},
) {
  return apiRequest<PublicBootstrapResponse>(
    withQuery(apiRoutes.public.bootstrap, { siteCode: params.siteCode }),
    options,
  );
}

export function publicBootstrapQueryOptions(
  params: PublicBootstrapParams = {},
) {
  return queryOptions({
    queryKey: queryKeys.publicBootstrap(params.siteCode),
    queryFn: () => fetchPublicBootstrap(params),
    staleTime: 60_000,
  });
}
