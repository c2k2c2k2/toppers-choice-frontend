import type { Metadata } from "next";
import type { PublicBootstrapResponse } from "@/lib/api/site";
import type {
  CmsAnnouncement,
  CmsBanner,
  CmsPage,
  CmsResolveResponse,
  CmsSection,
} from "@/lib/cms/types";
import type {
  PublicPlanPreview,
  PublicStandalonePageFallback,
  PublicTrackDefinition,
} from "@/lib/public/types";

const FALLBACK_TIMESTAMP = "2026-03-26T00:00:00.000Z";

function buildFallbackBanner(
  input: Pick<CmsBanner, "title"> &
    Partial<CmsBanner> & {
      metaJson?: Record<string, unknown> | null;
    },
): CmsBanner {
  return {
    id: input.id ?? `fallback-banner-${input.title.toLowerCase().replace(/\s+/g, "-")}`,
    placement: input.placement ?? "LANDING_HOME",
    title: input.title,
    subtitle: input.subtitle ?? null,
    body: input.body ?? null,
    ctaLabel: input.ctaLabel ?? null,
    ctaHref: input.ctaHref ?? null,
    imageAssetId: null,
    visibility: "PUBLIC",
    orderIndex: input.orderIndex ?? 0,
    startsAt: null,
    endsAt: null,
    metaJson: input.metaJson ?? null,
    status: "PUBLISHED",
    publishedAt: FALLBACK_TIMESTAMP,
    image: null,
  };
}

function buildFallbackAnnouncement(
  input: Pick<CmsAnnouncement, "title" | "body"> &
    Partial<CmsAnnouncement>,
): CmsAnnouncement {
  return {
    id:
      input.id ??
      `fallback-announcement-${input.title.toLowerCase().replace(/\s+/g, "-")}`,
    title: input.title,
    body: input.body,
    linkLabel: input.linkLabel ?? null,
    linkHref: input.linkHref ?? null,
    level: input.level ?? "INFO",
    visibility: "PUBLIC",
    isPinned: input.isPinned ?? false,
    orderIndex: input.orderIndex ?? 0,
    startsAt: null,
    endsAt: null,
    metaJson: input.metaJson ?? null,
    status: "PUBLISHED",
    publishedAt: FALLBACK_TIMESTAMP,
  };
}

function buildFallbackSection(
  input: Pick<CmsSection, "code" | "title" | "type"> &
    Partial<CmsSection>,
): CmsSection {
  return {
    id: input.id ?? `fallback-section-${input.code}`,
    surface: input.surface ?? "LANDING_HOME",
    code: input.code,
    title: input.title,
    subtitle: input.subtitle ?? null,
    type: input.type,
    bodyJson: input.bodyJson ?? null,
    configJson: input.configJson ?? null,
    imageAssetId: null,
    visibility: "PUBLIC",
    orderIndex: input.orderIndex ?? 0,
    status: "PUBLISHED",
    publishedAt: FALLBACK_TIMESTAMP,
    image: null,
  };
}

function buildFallbackPage(input: PublicStandalonePageFallback): CmsPage {
  return {
    id: `fallback-page-${input.slug}`,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    bodyJson: input.bodyJson,
    seoJson: input.seoJson as Record<string, unknown>,
    visibility: "PUBLIC",
    coverImageAssetId: null,
    orderIndex: 0,
    status: "PUBLISHED",
    publishedAt: FALLBACK_TIMESTAMP,
    archivedAt: null,
    createdAt: FALLBACK_TIMESTAMP,
    updatedAt: FALLBACK_TIMESTAMP,
    coverImage: null,
  };
}

export const FALLBACK_PUBLIC_BOOTSTRAP: PublicBootstrapResponse = {
  site: {
    code: "toppers-choice",
    slug: "toppers-choice",
    name: "Topper's Choice",
    primaryDomain: null,
    defaultLocale: "mr-IN",
    timezone: "Asia/Kolkata",
  },
  publicConfig: {
    site: {
      branding: {
        displayName: "Topper's Choice",
        tagline: "One stop solution for all by M.D. madam",
        motto: "आपल्या सूचना, आमची बांधिलकी",
        description:
          "35+ years of notes, guidance, mock practice, and academic clarity in one admin-driven platform.",
        proprietorName: "Madhuri Anil Deulkar",
        address: "Near Motibag, Motinagar, Amravati",
        supportWhatsapp: "9822229998",
        supportNote: "Messages only. Avoid phone calls for support.",
      },
    },
    platform: {
      features: {
        notes: true,
        practice: true,
        tests: true,
        careerGuidance: true,
        interviewGuidance: true,
        englishSpeaking: true,
      },
    },
  },
  runtime: {
    appBaseUrl: null,
    apiBasePath: "/api/v1",
  },
  versions: [],
  resolvedAt: FALLBACK_TIMESTAMP,
  stale: true,
};

export const PUBLIC_TRACK_DEFINITIONS: PublicTrackDefinition[] = [
  {
    slug: "mpsc-allied",
    eyebrow: "Track 01",
    title: "MPSC & allied exam preparation",
    summary:
      "Subject-wise notes, mix-format mocks, and disciplined study flow for Marathi and English medium aspirants.",
    audience: "Students preparing for MPSC state services and closely related exams.",
    modules: [
      "25+ core subjects with topic-wise note structure",
      "Subject-wise papers and mixed-format practice",
      "Monthly updates and exam-relevant current affairs",
      "Career and interview guidance when students move to later stages",
    ],
    outcomes: [
      "Build strong basics without juggling multiple books.",
      "Move from subject revision to timed assessment on one platform.",
      "Keep premium notes, tests, and guidance aligned under one track.",
    ],
    stats: [
      { value: "25+", label: "Subjects covered" },
      { value: "50 / 100", label: "Practice paper patterns" },
      { value: "Marathi + English", label: "Medium coverage" },
    ],
    ctas: [
      { label: "View public plans", href: "/pricing", tone: "primary" },
      { label: "Read about the platform", href: "/about", tone: "secondary" },
    ],
  },
  {
    slug: "bank-staff-railway",
    eyebrow: "Track 02",
    title: "Bank, staff, and railway exam support",
    summary:
      "Focused aptitude, reasoning, and grammar preparation built for fast-moving, practice-heavy exam cycles.",
    audience: "Students targeting bank, staff, railway, and adjacent aptitude-led exams.",
    modules: [
      "Quantitative aptitude and number-system coverage",
      "Reasoning practice with repeatable drilling",
      "English grammar and accuracy-focused revision",
      "Topic clusters that can later map to taxonomy and tests",
    ],
    outcomes: [
      "Reduce scattered prep material into one structured plan.",
      "Pair concept refresh with repeatable timed practice.",
      "Keep fast-cycle exam preparation lightweight but rigorous.",
    ],
    stats: [
      { value: "Aptitude-first", label: "Preparation rhythm" },
      { value: "Topic-wise", label: "Module structure" },
      { value: "Practice-heavy", label: "Assessment style" },
    ],
    ctas: [
      { label: "Compare plan structure", href: "/pricing", tone: "primary" },
      { label: "Message support", href: "/contact", tone: "secondary" },
    ],
  },
  {
    slug: "career-and-interview-guidance",
    eyebrow: "Track 03",
    title: "Career and interview guidance",
    summary:
      "A public-facing path for advertisement updates, interview readiness, and clearer decision-making beyond notes alone.",
    audience: "Students who need exam updates, decision support, and interview-oriented preparation.",
    modules: [
      "Career guidance linked to current openings and opportunity signals",
      "Interview preparation for post-specific readiness",
      "Guided next-step framing instead of generic motivational content",
      "Expandable CMS-authored update blocks for timely communication",
    ],
    outcomes: [
      "See the opportunity path, not just the study path.",
      "Prepare for interviews with topic-aware support content.",
      "Keep late-stage preparation connected to the same platform.",
    ],
    stats: [
      { value: "Guidance-led", label: "Content style" },
      { value: "Update-ready", label: "CMS fit" },
      { value: "Interview support", label: "Late-stage coverage" },
    ],
    ctas: [
      { label: "Browse contact route", href: "/contact", tone: "primary" },
      { label: "Return home", href: "/", tone: "secondary" },
    ],
  },
  {
    slug: "english-speaking",
    eyebrow: "Track 04",
    title: "English speaking support",
    summary:
      "Practical Hindi-English and Marathi-English speaking modules for everyday confidence, scenarios, and vocabulary growth.",
    audience: "Learners building speaking confidence alongside exam preparation.",
    modules: [
      "Scenario-led vocabulary and speaking drills",
      "Marathi-English and Hindi-English pathways",
      "Daily-use conversation themes",
      "Expandable lesson and CMS section support for later structured content",
    ],
    outcomes: [
      "Improve speaking confidence with scenario-based repetition.",
      "Use the same platform for academic prep and communication growth.",
      "Prepare for interview and professional interaction more confidently.",
    ],
    stats: [
      { value: "2 pathways", label: "Language bridges" },
      { value: "Daily scenarios", label: "Conversation style" },
      { value: "Confidence-led", label: "Learning focus" },
    ],
    ctas: [
      { label: "See available plans", href: "/pricing", tone: "primary" },
      { label: "Read platform overview", href: "/about", tone: "secondary" },
    ],
  },
];

export const FALLBACK_PLAN_PREVIEWS: PublicPlanPreview[] = [
  {
    name: "Foundation access",
    summary:
      "A starter plan card shape for when the public plans API has not published live plan rows yet.",
    priceLabel: "Admin-managed pricing",
    durationLabel: "Duration comes from backend",
    features: [
      "Plan copy and entitlements stay backend-driven",
      "Pricing page structure is ready for live records",
      "CTA flow can point students toward checkout later",
    ],
    ctaLabel: "Talk to support",
    ctaHref: "/contact",
    badge: "Preview structure",
  },
  {
    name: "Guided preparation",
    summary:
      "A mid-tier card shape for notes, guidance, and practice-heavy flows once public plans are active.",
    priceLabel: "Public plans sync here",
    durationLabel: "Order and duration stay dynamic",
    features: [
      "Supports rich short descriptions and detailed copy",
      "Can reflect entitlement combinations from backend",
      "Designed to slot into later checkout flows",
    ],
    ctaLabel: "View preparation tracks",
    ctaHref: "/tracks/mpsc-allied",
  },
  {
    name: "Full premium access",
    summary:
      "A premium-tier preview card for broad access without baking final business numbers into the frontend.",
    priceLabel: "Configured in admin",
    durationLabel: "Future checkout-ready",
    features: [
      "Later checkout and entitlement prompts can reuse this card",
      "Preview keeps the route production-shaped without fake pricing",
      "Works for MPSC, practice, tests, and guidance combinations",
    ],
    ctaLabel: "Open pricing route",
    ctaHref: "/pricing",
  },
];

export const FALLBACK_STANDALONE_PAGES: Record<
  string,
  PublicStandalonePageFallback
> = {
  about: {
    slug: "about",
    title: "About Topper's Choice",
    summary:
      "An academic platform shaped around clarity, disciplined preparation, and admin-managed learning content.",
    description:
      "Learn what Topper's Choice stands for, how the platform helps students, and why the public landing is built to stay dynamic.",
    bodyJson: {
      blocks: [
        {
          type: "prose",
          title: "Why this platform exists",
          paragraphs: [
            "Topper's Choice is designed to reduce scattered preparation across books, coaching classes, notes, and practice sources into one clear academic system.",
            "The platform centers structured notes, practice papers, guidance modules, and communication-building content so students can move through preparation with fewer disconnected tools.",
          ],
        },
        {
          type: "feature-grid",
          title: "What the public surface promises",
          items: [
            {
              title: "Admin-managed content",
              description:
                "Landing copy, public pages, and pricing are meant to evolve from backend-managed content instead of hardcoded page rewrites.",
            },
            {
              title: "Student-first structure",
              description:
                "The same frontend foundation later powers notes, practice, tests, guidance, and payments inside the student shell.",
            },
            {
              title: "Academic tone",
              description:
                "The experience follows the stitch-led editorial direction instead of defaulting to a generic SaaS dashboard look.",
            },
          ],
        },
        {
          type: "cta",
          title: "See how the public routes are taking shape",
          description:
            "Pricing, track highlights, contact, and legal placeholders are already mounted so later CMS and backend data can slot in cleanly.",
          ctas: [
            { label: "Open pricing", href: "/pricing", tone: "primary" },
            { label: "Browse tracks", href: "/tracks/mpsc-allied", tone: "secondary" },
          ],
        },
      ],
    },
    seoJson: {
      description:
        "About Topper's Choice, the academic preparation platform built for structured notes, practice, guidance, and student-first delivery.",
    } as Metadata,
  },
  contact: {
    slug: "contact",
    title: "Contact & support",
    summary:
      "Support details, WhatsApp-first contact guidance, and public contact placeholders ready for CMS authorship.",
    description:
      "Reach Topper's Choice support, view contact expectations, and use the current public support channels.",
    bodyJson: {
      blocks: [
        {
          type: "contact",
          title: "Current public contact route",
          items: [
            {
              label: "WhatsApp",
              value: "9822229998",
              description: "Messages only. Please avoid phone calls for support.",
              href: "https://wa.me/919822229998",
            },
            {
              label: "Address",
              value: "Near Motibag, Motinagar, Amravati",
              description: "Public-facing location placeholder until richer CMS contact content is authored.",
            },
            {
              label: "Proprietor",
              value: "Madhuri Anil Deulkar",
              description: "Brand ownership reference from the provided PRD.",
            },
          ],
        },
        {
          type: "prose",
          title: "Why this page is placeholder-ready",
          paragraphs: [
            "The contact route is already mounted so support details, timings, FAQ copy, and additional communication channels can later come from the CMS without changing route structure.",
            "This keeps the public surface realistic now while preserving the backend-driven content strategy for later prompts.",
          ],
        },
      ],
    },
    seoJson: {
      description:
        "Contact Topper's Choice support through the current public-facing channels, with the route ready for later CMS-managed updates.",
    } as Metadata,
  },
  privacy: {
    slug: "privacy",
    title: "Privacy policy placeholder",
    summary:
      "A clean legal placeholder that keeps route structure stable while final policy copy remains to be authored.",
    description:
      "Review the current privacy placeholder for Topper's Choice while final legal copy is prepared for CMS publication.",
    bodyJson: {
      blocks: [
        {
          type: "note",
          title: "Policy drafting still pending",
          description:
            "Final legal copy is intentionally not hardcoded into the app. This route is here so future CMS-authored privacy content can publish without route changes.",
        },
        {
          type: "list",
          title: "What this placeholder already communicates",
          items: [
            "Public and student routes are separated from protected content handling.",
            "Premium content remains outside unsafe offline caching assumptions.",
            "Future policy updates should flow from admin-managed public pages.",
          ],
        },
      ],
    },
    seoJson: {
      robots: {
        index: false,
        follow: true,
      },
      description:
        "Privacy policy placeholder for Topper's Choice while final legal content is being prepared.",
    } as Metadata,
  },
  terms: {
    slug: "terms",
    title: "Terms & conditions placeholder",
    summary:
      "A stable legal route for future authored terms, available now so navigation and SEO structure do not have to change later.",
    description:
      "Read the current Topper's Choice terms placeholder while the final authored legal page is pending.",
    bodyJson: {
      blocks: [
        {
          type: "note",
          title: "Final legal copy is still pending",
          description:
            "This route exists now to avoid future routing churn. The long-form terms page should be published through the CMS when approved content is ready.",
        },
        {
          type: "list",
          title: "Current public assumptions",
          items: [
            "Plans, pricing, and featured public content are expected to be admin-managed.",
            "Student and admin access rules remain backend-driven.",
            "Protected study content will continue following safe access-control rules.",
          ],
        },
      ],
    },
    seoJson: {
      robots: {
        index: false,
        follow: true,
      },
      description:
        "Terms and conditions placeholder for Topper's Choice while final legal content is being prepared.",
    } as Metadata,
  },
};

const fallbackPages = Object.values(FALLBACK_STANDALONE_PAGES).map((page) =>
  buildFallbackPage(page),
);

const trackCards = PUBLIC_TRACK_DEFINITIONS.map((track) => ({
  label: track.eyebrow,
  title: track.title,
  description: track.summary,
  href: `/tracks/${track.slug}`,
  meta: track.audience,
}));

export const FALLBACK_PUBLIC_CMS_RESOLVE: CmsResolveResponse = {
  pages: fallbackPages.map((page, index) => ({
    ...page,
    bodyJson: null,
    seoJson: null,
    orderIndex: index,
  })),
  banners: [
    buildFallbackBanner({
      title: "Achieve your exam goals with 35+ years of academic clarity.",
      subtitle: "One stop solution for all by M.D. madam",
      body:
        "Get subject-wise notes, practice papers, guidance, interview support, and speaking pathways from one admin-managed public surface.",
      ctaLabel: "Explore preparation tracks",
      ctaHref: "/tracks/mpsc-allied",
      metaJson: {
        secondaryCtaLabel: "View pricing structure",
        secondaryCtaHref: "/pricing",
        stats: [
          { value: "35+", label: "Years of expertise" },
          { value: "4", label: "Preparation pathways highlighted" },
          { value: "1", label: "Shared public surface" },
        ],
      },
    }),
  ],
  announcements: [
    buildFallbackAnnouncement({
      title: "Monthly updates stay part of the public promise",
      body:
        "The landing foundation is ready for CMS-authored updates, announcements, and campaign copy without route rewrites.",
      linkLabel: "See contact route",
      linkHref: "/contact",
      level: "SUCCESS",
      isPinned: true,
    }),
    buildFallbackAnnouncement({
      title: "Student installability is already in place",
      body:
        "Public pages stay server-first while the shared shell continues to support the later student PWA experience.",
      linkLabel: "Open pricing route",
      linkHref: "/pricing",
      level: "INFO",
      isPinned: false,
      orderIndex: 1,
    }),
  ],
  sections: [
    buildFallbackSection({
      code: "landing-editorial-intro",
      title: "A disciplined preparation system, not a content dump.",
      subtitle:
        "The landing surface now speaks in the same editorial voice as the stitch references while staying ready for CMS-authored changes.",
      type: "RICH_TEXT",
      orderIndex: 0,
      bodyJson: {
        paragraphs: [
          "Topper's Choice is built to remove the usual friction of scattered notes, disconnected coaching inputs, and ad hoc mock-practice sources.",
          "The public foundation is intentionally modular: brand copy, banners, sections, pricing, and legal content can all move toward backend-managed publishing without changing the route structure again.",
        ],
        stats: [
          { value: "Server-first", label: "Public rendering" },
          { value: "CMS-ready", label: "Section architecture" },
          { value: "Mobile-considered", label: "CTA density" },
        ],
      },
      configJson: {
        variant: "editorial",
      },
    }),
    buildFallbackSection({
      code: "landing-core-offerings",
      title: "Comprehensive learning ecosystem",
      subtitle:
        "The same platform foundation is meant to support notes, guidance, practice, tests, and communication skills without visual drift.",
      type: "CONTENT_FEED",
      orderIndex: 1,
      bodyJson: {
        items: [
          {
            label: "Notes",
            title: "Structured learning",
            description:
              "Subject-wise and topic-wise notes organized for focused preparation and strong basic concepts.",
          },
          {
            label: "Practice",
            title: "Smart assessment",
            description:
              "Subject-wise and mixed-format practice papers to test readiness, retention, and exam rhythm.",
          },
          {
            label: "Guidance",
            title: "Career and interview support",
            description:
              "Guidance modules that extend the platform beyond static reading into clearer next-step preparation.",
          },
          {
            label: "Speaking",
            title: "English speaking pathways",
            description:
              "Practical scenario-based modules for Marathi-English and Hindi-English speaking improvement.",
          },
        ],
      },
      configJson: {
        columns: 2,
      },
    }),
    buildFallbackSection({
      code: "landing-track-highlights",
      title: "Choose your preparation path",
      subtitle:
        "Track pages are mounted now so later taxonomy and CMS work can enrich them without changing navigation.",
      type: "CONTENT_FEED",
      orderIndex: 2,
      bodyJson: {
        items: trackCards,
      },
      configJson: {
        columns: 2,
        emphasis: "track-grid",
      },
    }),
    buildFallbackSection({
      code: "landing-plan-highlights",
      title: "Pricing structure is ready for public plan data",
      subtitle:
        "The route and cards are real now, while final plan pricing and entitlement bundles continue to stay backend-managed.",
      type: "PLAN_HIGHLIGHTS",
      orderIndex: 3,
      configJson: {
        eyebrow: "Plans",
        note: "Public plans sync into this section when backend data is available.",
      },
    }),
    buildFallbackSection({
      code: "landing-call-to-action",
      title: "Start from the public surface, move toward the student app.",
      subtitle:
        "This keeps public discovery, pricing, and support aligned before auth, guards, and student flows land in later prompts.",
      type: "CTA_GROUP",
      orderIndex: 4,
      bodyJson: {
        items: [
          {
            title: "Open pricing route",
            description:
              "See the plan card architecture that is ready for backend-managed public plans.",
            href: "/pricing",
            label: "Pricing",
            tone: "primary",
          },
          {
            title: "Read about the platform",
            description:
              "Understand the academic positioning and why the public surface is built around CMS-driven content.",
            href: "/about",
            label: "About",
            tone: "secondary",
          },
          {
            title: "Message support",
            description:
              "Use the contact route while richer public contact content remains to be authored.",
            href: "/contact",
            label: "Contact",
            tone: "secondary",
          },
        ],
      },
    }),
  ],
};
