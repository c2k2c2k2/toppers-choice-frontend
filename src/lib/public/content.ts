import { cache } from "react";
import type { Metadata } from "next";
import {
  fetchPublicBootstrap,
  type PublicBootstrapResponse,
} from "@/lib/api/site";
import { isApiError } from "@/lib/api/errors";
import { getPublicCmsPage, resolvePublicCms } from "@/lib/cms";
import type { CmsBanner, CmsPage, CmsResolveResponse } from "@/lib/cms/types";
import { listPublicPlans } from "@/lib/payments";
import type { PublicPlan } from "@/lib/payments/types";
import {
  FALLBACK_PLAN_PREVIEWS,
  FALLBACK_PUBLIC_BOOTSTRAP,
  FALLBACK_PUBLIC_CMS_RESOLVE,
  FALLBACK_STANDALONE_PAGES,
  PUBLIC_TRACK_DEFINITIONS,
} from "@/lib/public/fallback-content";
import type {
  PublicBootstrapLoadResult,
  PublicBranding,
  PublicHomeContent,
  PublicShellChrome,
  PublicStandalonePageResult,
  PublicTrackDefinition,
  PublicTrackPageContent,
} from "@/lib/public/types";

export const PUBLIC_ROUTE_REVALIDATE_SECONDS = 300;

const PUBLIC_FOOTER_LINKS = [
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getNestedValue(value: unknown, path: string[]) {
  return path.reduce<unknown>((currentValue, segment) => {
    if (!isRecord(currentValue)) {
      return undefined;
    }

    return currentValue[segment];
  }, value);
}

function readString(value: unknown, path: string[], fallback = "") {
  const resolved = getNestedValue(value, path);
  return typeof resolved === "string" && resolved.trim().length > 0
    ? resolved.trim()
    : fallback;
}

function readStringOrNull(value: unknown, path: string[]) {
  const resolved = getNestedValue(value, path);
  return typeof resolved === "string" && resolved.trim().length > 0
    ? resolved.trim()
    : null;
}

function hasMeaningfulCmsContent(input: CmsResolveResponse) {
  return (
    input.banners.some((banner) => banner.placement === "LANDING_HOME") ||
    input.announcements.length > 0 ||
    input.sections.some((section) => section.surface === "LANDING_HOME")
  );
}

function buildPublicRequestOptions(tags: string[]) {
  return {
    next: {
      revalidate: PUBLIC_ROUTE_REVALIDATE_SECONDS,
      tags,
    },
  } as const;
}

const getBootstrapSnapshot = cache(
  async (): Promise<PublicBootstrapLoadResult> => {
    try {
      return {
        data: await fetchPublicBootstrap(
          {},
          buildPublicRequestOptions(["public-bootstrap", "public-shell"]),
        ),
        isFallback: false,
      };
    } catch {
      return {
        data: FALLBACK_PUBLIC_BOOTSTRAP,
        isFallback: true,
      };
    }
  },
);

const getResolvedPublicCms = cache(async () => {
  try {
    const data = await resolvePublicCms(
      buildPublicRequestOptions(["public-cms", "public-home"]),
    );

    return hasMeaningfulCmsContent(data)
      ? { data, isFallback: false }
      : {
          data: FALLBACK_PUBLIC_CMS_RESOLVE,
          isFallback: true,
        };
  } catch {
    return {
      data: FALLBACK_PUBLIC_CMS_RESOLVE,
      isFallback: true,
    };
  }
});

const getPublicPlansSnapshot = cache(async () => {
  try {
    const response = await listPublicPlans(
      buildPublicRequestOptions(["public-plans", "public-pricing"]),
    );

    return {
      items: response.items,
      isFallback: false,
    };
  } catch {
    return {
      items: [] as PublicPlan[],
      isFallback: true,
    };
  }
});

const getOptionalCmsPage = cache(async (slug: string) => {
  try {
    return await getPublicCmsPage(
      slug,
      buildPublicRequestOptions([`public-page:${slug}`, "public-cms"]),
    );
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return null;
    }

    return null;
  }
});

export function extractPublicBranding(
  bootstrap: PublicBootstrapResponse,
): PublicBranding {
  const fallbackBranding = FALLBACK_PUBLIC_BOOTSTRAP.publicConfig.site?.branding ?? {};

  return {
    address:
      readString(bootstrap, ["publicConfig", "site", "branding", "address"]) ||
      fallbackBranding.address ||
      "Near Motibag, Motinagar, Amravati",
    defaultLocale: bootstrap.site.defaultLocale ?? "mr-IN",
    description:
      readString(bootstrap, ["publicConfig", "site", "branding", "description"]) ||
      fallbackBranding.description ||
      "Structured notes, practice, guidance, and exam preparation on one public-facing platform.",
    displayName:
      readString(bootstrap, ["publicConfig", "site", "branding", "displayName"]) ||
      bootstrap.site.name ||
      fallbackBranding.displayName ||
      "Topper's Choice",
    motto:
      readString(bootstrap, ["publicConfig", "site", "branding", "motto"]) ||
      fallbackBranding.motto ||
      "आपल्या सूचना, आमची बांधिलकी",
    primaryDomain: bootstrap.site.primaryDomain ?? null,
    proprietorName:
      readString(
        bootstrap,
        ["publicConfig", "site", "branding", "proprietorName"],
      ) ||
      fallbackBranding.proprietorName ||
      "Madhuri Anil Deulkar",
    supportNote:
      readString(bootstrap, ["publicConfig", "site", "branding", "supportNote"]) ||
      fallbackBranding.supportNote ||
      "Messages only. Avoid phone calls for support.",
    supportWhatsapp:
      readString(
        bootstrap,
        ["publicConfig", "site", "branding", "supportWhatsapp"],
      ) ||
      fallbackBranding.supportWhatsapp ||
      "9822229998",
    tagline:
      readString(bootstrap, ["publicConfig", "site", "branding", "tagline"]) ||
      fallbackBranding.tagline ||
      "One stop solution for all by M.D. madam",
    timezone: bootstrap.site.timezone ?? "Asia/Kolkata",
  };
}

function resolveHomeBanner(bundle: CmsResolveResponse): CmsBanner | null {
  return (
    bundle.banners.find((banner) => banner.placement === "LANDING_HOME") ??
    bundle.banners.find((banner) => banner.placement === "COMMON") ??
    null
  );
}

function resolveHomeSections(bundle: CmsResolveResponse) {
  return bundle.sections
    .filter((section) => section.surface === "LANDING_HOME")
    .sort((left, right) => left.orderIndex - right.orderIndex);
}

export const getPublicShellChrome = cache(
  async (): Promise<PublicShellChrome> => {
    const bootstrap = await getBootstrapSnapshot();
    const branding = extractPublicBranding(bootstrap.data);
    const supportHref = `https://wa.me/91${branding.supportWhatsapp.replace(/\D/g, "")}`;

    return {
      branding,
      footerLinks: [...PUBLIC_FOOTER_LINKS],
      supportHref,
    };
  },
);

export const getPublicHomeContent = cache(async (): Promise<PublicHomeContent> => {
  const [bootstrapResult, cmsResult, plansResult] = await Promise.all([
    getBootstrapSnapshot(),
    getResolvedPublicCms(),
    getPublicPlansSnapshot(),
  ]);

  return {
    announcements: cmsResult.data.announcements,
    banner: resolveHomeBanner(cmsResult.data),
    branding: extractPublicBranding(bootstrapResult.data),
    cmsPages: cmsResult.data.pages,
    hasLiveBootstrap: !bootstrapResult.isFallback,
    hasLiveCms: !cmsResult.isFallback,
    hasLivePlans: !plansResult.isFallback && plansResult.items.length > 0,
    plans: plansResult.items,
    planPreviews: FALLBACK_PLAN_PREVIEWS,
    sections: resolveHomeSections(cmsResult.data),
    trackDefinitions: PUBLIC_TRACK_DEFINITIONS,
  };
});

function buildFallbackPageResult(
  slug: string,
): PublicStandalonePageResult | null {
  const fallbackPage = FALLBACK_STANDALONE_PAGES[slug];

  if (!fallbackPage) {
    return null;
  }

  return {
    page: {
      id: `fallback-page-${fallbackPage.slug}`,
      slug: fallbackPage.slug,
      title: fallbackPage.title,
      summary: fallbackPage.summary,
      bodyJson: fallbackPage.bodyJson,
      seoJson: fallbackPage.seoJson as Record<string, unknown>,
      visibility: "PUBLIC",
      coverImageAssetId: null,
      orderIndex: 0,
      status: "PUBLISHED",
      publishedAt: FALLBACK_PUBLIC_BOOTSTRAP.resolvedAt,
      archivedAt: null,
      createdAt: FALLBACK_PUBLIC_BOOTSTRAP.resolvedAt,
      updatedAt: FALLBACK_PUBLIC_BOOTSTRAP.resolvedAt,
      coverImage: null,
    },
    source: "fallback",
    isPlaceholder: true,
  };
}

export const getPublicStandalonePage = cache(
  async (slug: string): Promise<PublicStandalonePageResult | null> => {
    const livePage = await getOptionalCmsPage(slug);

    if (livePage) {
      return {
        page: livePage,
        source: "cms",
        isPlaceholder: false,
      };
    }

    return buildFallbackPageResult(slug);
  },
);

export function getTrackDefinitionBySlug(
  slug: string,
): PublicTrackDefinition | null {
  return (
    PUBLIC_TRACK_DEFINITIONS.find((track) => track.slug === slug) ?? null
  );
}

export const getPublicTrackPageContent = cache(
  async (trackSlug: string): Promise<PublicTrackPageContent | null> => {
    const track = getTrackDefinitionBySlug(trackSlug);

    if (!track) {
      return null;
    }

    const [plansResult, cmsPage] = await Promise.all([
      getPublicPlansSnapshot(),
      getOptionalCmsPage(`track-${trackSlug}`),
    ]);

    return {
      cmsPage,
      plans: plansResult.items,
      planPreviews: FALLBACK_PLAN_PREVIEWS,
      track,
    };
  },
);

function resolveMetadataBase(branding: PublicBranding, appBaseUrl: string | null) {
  const source =
    appBaseUrl ||
    (branding.primaryDomain ? `https://${branding.primaryDomain}` : null);

  if (!source) {
    return undefined;
  }

  try {
    return new URL(source);
  } catch {
    return undefined;
  }
}

export async function buildPublicMetadata(input: {
  description: string;
  noIndex?: boolean;
  path: string;
  title: string;
}): Promise<Metadata> {
  const bootstrap = await getBootstrapSnapshot();
  const branding = extractPublicBranding(bootstrap.data);
  const metadataBase = resolveMetadataBase(
    branding,
    readStringOrNull(bootstrap.data.runtime, ["appBaseUrl"]),
  );
  const absoluteTitle =
    input.title === branding.displayName
      ? {
          absolute: input.title,
        }
      : input.title;

  return {
    metadataBase,
    title: absoluteTitle,
    description: input.description,
    alternates: {
      canonical: input.path,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      type: "website",
      siteName: branding.displayName,
      url: input.path,
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  };
}

export function extractPageDescription(page: CmsPage | null, fallback: string) {
  if (!page) {
    return fallback;
  }

  if (typeof page.summary === "string" && page.summary.trim().length > 0) {
    return page.summary.trim();
  }

  const seoDescription = readString(page.seoJson, ["description"]);
  return seoDescription || fallback;
}
