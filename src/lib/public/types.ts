import type { Metadata } from "next";
import type { PublicBootstrapResponse } from "@/lib/api/site";
import type { CmsPage, CmsResolveResponse } from "@/lib/cms/types";
import type { PublicPlan } from "@/lib/payments/types";

export interface PublicBranding {
  address: string;
  defaultLocale: string;
  description: string;
  displayName: string;
  motto: string;
  primaryDomain: string | null;
  proprietorName: string;
  supportNote: string;
  supportWhatsapp: string;
  tagline: string;
  timezone: string;
}

export interface PublicCtaLink {
  description?: string;
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}

export interface PublicStat {
  label: string;
  value: string;
}

export interface PublicTrackDefinition {
  audience: string;
  ctas: PublicCtaLink[];
  eyebrow: string;
  modules: string[];
  outcomes: string[];
  slug: string;
  stats: PublicStat[];
  summary: string;
  title: string;
}

export interface PublicPlanPreview {
  badge?: string;
  ctaHref: string;
  ctaLabel: string;
  durationLabel: string;
  features: string[];
  name: string;
  priceLabel: string;
  summary: string;
}

export interface PublicStandalonePageFallback {
  bodyJson: Record<string, unknown>;
  description: string;
  seoJson: Metadata;
  slug: string;
  summary: string;
  title: string;
}

export interface PublicHomeContent {
  announcements: CmsResolveResponse["announcements"];
  banner: CmsResolveResponse["banners"][number] | null;
  branding: PublicBranding;
  cmsPages: CmsResolveResponse["pages"];
  hasLiveBootstrap: boolean;
  hasLiveCms: boolean;
  hasLivePlans: boolean;
  plans: PublicPlan[];
  planPreviews: PublicPlanPreview[];
  sections: CmsResolveResponse["sections"];
  trackDefinitions: PublicTrackDefinition[];
}

export interface PublicShellChrome {
  branding: PublicBranding;
  footerLinks: Array<{
    href: string;
    label: string;
  }>;
  supportHref: string;
}

export interface PublicStandalonePageResult {
  isPlaceholder: boolean;
  page: CmsPage;
  source: "cms" | "fallback";
}

export interface PublicTrackPageContent {
  cmsPage: CmsPage | null;
  plans: PublicPlan[];
  planPreviews: PublicPlanPreview[];
  track: PublicTrackDefinition;
}

export interface PublicBootstrapLoadResult {
  data: PublicBootstrapResponse;
  isFallback: boolean;
}
