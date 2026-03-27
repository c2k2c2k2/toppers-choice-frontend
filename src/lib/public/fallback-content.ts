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
          "Trusted notes, tests, guidance, and study support for competitive exam preparation.",
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
      "Topic-wise notes, tests, and guidance for Marathi and English medium students preparing for MPSC and related exams.",
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
      "Practice-focused preparation for bank, staff, railway, and other aptitude-heavy exams.",
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
      "Career updates, interview guidance, and next-step support beyond classroom notes.",
    audience: "Students who need exam updates, decision support, and interview-oriented preparation.",
    modules: [
      "Career guidance linked to current openings and opportunity signals",
      "Interview preparation for post-specific readiness",
      "Guided next-step framing instead of generic motivational content",
      "Regular updates and communication for important next steps",
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
      "Practical Marathi-English and Hindi-English speaking support for confidence in daily communication and interviews.",
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
    name: "Foundation plan",
    summary:
      "A good fit for students who want organized notes and steady daily study support.",
    priceLabel: "Contact for fees",
    durationLabel: "Flexible duration",
    features: [
      "Organized notes for core subjects",
      "Daily study support",
      "Best for steady foundation building",
    ],
    ctaLabel: "Talk to support",
    ctaHref: "/contact",
    badge: "Starter",
  },
  {
    name: "Practice and test plan",
    summary:
      "Designed for students who want regular practice, mock tests, and stronger exam rhythm.",
    priceLabel: "Contact for fees",
    durationLabel: "Flexible duration",
    features: [
      "Practice sessions and mock tests",
      "Useful for revision and score tracking",
      "Good for students closer to exam mode",
    ],
    ctaLabel: "View preparation tracks",
    ctaHref: "/tracks/mpsc-allied",
  },
  {
    name: "Complete guidance plan",
    summary:
      "For students who want broader access across notes, tests, guidance, and support.",
    priceLabel: "Contact for fees",
    durationLabel: "Flexible duration",
    features: [
      "Broad access across main learning areas",
      "Useful for long-term preparation",
      "Support for notes, tests, and guidance together",
    ],
    ctaLabel: "Talk to support",
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
      "Learn about Topper's Choice, the academy's approach, and how students use the platform.",
    description:
      "Learn what Topper's Choice stands for and how the platform supports students.",
    bodyJson: {
      blocks: [
        {
          type: "prose",
          title: "Why students choose Topper's Choice",
          paragraphs: [
            "Topper's Choice is built to reduce the confusion of scattered books, mixed notes, and disconnected test material.",
            "The goal is to keep notes, practice, tests, and guidance together so students can follow a clearer preparation path.",
          ],
        },
        {
          type: "feature-grid",
          title: "What students get",
          items: [
            {
              title: "Organized study material",
              description:
                "Notes, updates, and learning material are arranged so students can find the right topic quickly.",
            },
            {
              title: "Practice and testing",
              description:
                "Students can move from learning to practice and mock tests without changing platforms.",
            },
            {
              title: "Guidance beyond notes",
              description:
                "Career guidance, interview support, and communication skills can live alongside the main exam material.",
            },
          ],
        },
        {
          type: "cta",
          title: "Explore the main sections",
          description:
            "Start with the preparation path, compare plans, or message the academy for help.",
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
      "Get in touch for batch details, fees, and general support.",
    description:
      "Reach Topper's Choice support through the current contact channels.",
    bodyJson: {
      blocks: [
        {
          type: "contact",
          title: "Contact details",
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
              description: "Visit or message the academy for batch and admission details.",
            },
            {
              label: "Proprietor",
              value: "Madhuri Anil Deulkar",
              description: "Topper's Choice",
            },
          ],
        },
        {
          type: "prose",
          title: "Before you contact us",
          paragraphs: [
            "Message the academy on WhatsApp for batch details, fees, and access questions.",
            "If you are already a student, keep your student login ready so support can help you faster.",
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
    title: "Privacy policy",
    summary:
      "The full privacy policy will be updated here. Please contact support if you need clarification before enrollment.",
    description:
      "Read the current privacy notes for Topper's Choice.",
    bodyJson: {
      blocks: [
        {
          type: "note",
          title: "Policy update in progress",
          description:
            "The full privacy policy text is being prepared. If you have questions before purchase, please contact support first.",
        },
        {
          type: "list",
          title: "Current privacy points",
          items: [
            "Student and admin areas are separated by login.",
            "Account access and study material stay tied to the signed-in user.",
            "Support can help with privacy-related questions before enrollment.",
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
        "Privacy information for Topper's Choice.",
    } as Metadata,
  },
  terms: {
    slug: "terms",
    title: "Terms & conditions",
    summary:
      "The full terms will be updated here. Please contact support if you need clarification before enrollment.",
    description:
      "Read the current terms notes for Topper's Choice.",
    bodyJson: {
      blocks: [
        {
          type: "note",
          title: "Terms update in progress",
          description:
            "The detailed terms are being prepared. If you need clarification before purchase, please contact support first.",
        },
        {
          type: "list",
          title: "Current terms notes",
          items: [
            "Plans and access are linked to the student's account.",
            "Student and admin access remain separate.",
            "Published study material and paid access may change based on the selected plan.",
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
        "Terms and conditions information for Topper's Choice.",
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
      title: "Trusted notes, tests, and guidance for competitive exam preparation.",
      subtitle: "One stop solution for all by M.D. madam",
      body:
        "Study with organized notes, regular practice, mock tests, and focused guidance from Topper's Choice.",
      ctaLabel: "Explore preparation tracks",
      ctaHref: "/tracks/mpsc-allied",
      metaJson: {
        secondaryCtaLabel: "View plans",
        secondaryCtaHref: "/pricing",
        stats: [
          { value: "35+", label: "Years of guidance" },
          { value: "Marathi + English", label: "Study mediums" },
          { value: "Notes + tests + guidance", label: "Learning support" },
        ],
      },
    }),
  ],
  announcements: [
    buildFallbackAnnouncement({
      title: "Need fee or batch details?",
      body:
        "Message the academy on WhatsApp for fee details, batch information, and general support.",
      linkLabel: "Contact support",
      linkHref: "/contact",
      level: "SUCCESS",
      isPinned: true,
    }),
    buildFallbackAnnouncement({
      title: "Stay updated",
      body:
        "New notes, tests, and announcements will be updated here regularly.",
      linkLabel: "Open plans",
      linkHref: "/pricing",
      level: "INFO",
      isPinned: false,
      orderIndex: 1,
    }),
  ],
  sections: [
    buildFallbackSection({
      code: "landing-editorial-intro",
      title: "Study with a clear plan.",
      subtitle:
        "Topper's Choice brings notes, practice, tests, and guidance together in one focused learning experience.",
      type: "RICH_TEXT",
      orderIndex: 0,
      bodyJson: {
        paragraphs: [
          "Students often lose time jumping between notes, coaching material, and random test sources. Topper's Choice keeps the important parts together.",
          "The goal is simple: learn the topic, revise with the right notes, and test yourself regularly.",
        ],
        stats: [
          { value: "35+", label: "Years of guidance" },
          { value: "Marathi + English", label: "Study mediums" },
          { value: "Notes + tests + guidance", label: "Main support" },
        ],
      },
      configJson: {
        eyebrow: "Why Topper's Choice",
        variant: "editorial",
      },
    }),
    buildFallbackSection({
      code: "landing-core-offerings",
      title: "What students can use",
      subtitle:
        "Each section is built to help students move from learning to testing.",
      type: "CONTENT_FEED",
      orderIndex: 1,
      bodyJson: {
        items: [
          {
            label: "Notes",
            title: "Organized notes",
            description:
              "Topic-wise notes arranged for easier study and revision.",
          },
          {
            label: "Practice",
            title: "Practice questions",
            description:
              "Practice sets that help students improve speed and accuracy.",
          },
          {
            label: "Tests",
            title: "Mock tests",
            description:
              "Timed tests that help students move from revision to exam pressure.",
          },
          {
            label: "Guidance",
            title: "Guidance and support",
            description:
              "Career guidance, interview support, and communication-building help.",
          },
        ],
      },
      configJson: {
        columns: 2,
        eyebrow: "Main features",
      },
    }),
    buildFallbackSection({
      code: "landing-track-highlights",
      title: "Choose your preparation path",
      subtitle:
        "Explore the exam path that matches your goal.",
      type: "CONTENT_FEED",
      orderIndex: 2,
      bodyJson: {
        items: trackCards,
      },
      configJson: {
        columns: 2,
        eyebrow: "Preparation paths",
        emphasis: "track-grid",
      },
    }),
    buildFallbackSection({
      code: "landing-plan-highlights",
      title: "Choose the plan that fits your preparation",
      subtitle:
        "Contact support if you need help selecting the right option.",
      type: "PLAN_HIGHLIGHTS",
      orderIndex: 3,
      configJson: {
        eyebrow: "Plans",
        note: "Plan details and fees are shown here.",
      },
    }),
    buildFallbackSection({
      code: "landing-call-to-action",
      title: "Need help before you begin?",
      subtitle:
        "Compare plans, explore tracks, or talk to the academy.",
      type: "CTA_GROUP",
      orderIndex: 4,
      bodyJson: {
        items: [
          {
            title: "Compare plans",
            description:
              "See the available plan options and continue when you are ready to enroll.",
            href: "/pricing",
            label: "Pricing",
            tone: "primary",
          },
          {
            title: "Explore preparation paths",
            description:
              "Open the main preparation tracks and choose the one that matches your goal.",
            href: "/tracks/mpsc-allied",
            label: "Tracks",
            tone: "secondary",
          },
          {
            title: "Talk to support",
            description:
              "Message the academy for fees, batches, and support.",
            href: "/contact",
            label: "Contact",
            tone: "secondary",
          },
        ],
      },
    }),
  ],
};
