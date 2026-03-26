import type {
  ContentFamily,
  ContentFamilyDefinition,
  StructuredSurfaceLink,
} from "@/lib/content/types";

const CONTENT_FAMILY_DEFINITIONS: ContentFamilyDefinition[] = [
  {
    accentCssVar: "var(--accent-student)",
    collectionHref: "/student/guidance/career",
    detailHref: (slug) => `/student/guidance/career/${encodeURIComponent(slug)}`,
    discoveryDescription:
      "Exam-path explainers, long-term preparation advice, and decision support for aspirants planning their next move.",
    emptyDescription:
      "Career-guidance articles will appear here as soon as they are published from the structured content module.",
    emptyTitle: "Career guidance is about to open.",
    eyebrow: "Career guidance",
    family: "CAREER_GUIDANCE",
    heroDescription:
      "Track-aware guidance for choosing the right exam path, planning preparation timelines, and understanding where each competitive route can lead.",
    heroTitle: "Plan the next academic move before you commit to the study grind.",
    hubHref: "/student/guidance",
    label: "Career Guidance",
    shortLabel: "Career",
  },
  {
    accentCssVar: "var(--accent-student)",
    collectionHref: "/student/guidance/interview",
    detailHref: (slug) =>
      `/student/guidance/interview/${encodeURIComponent(slug)}`,
    discoveryDescription:
      "Interview-stage readiness, communication cues, self-introduction frameworks, and practical confidence-building guides.",
    emptyDescription:
      "Interview-guidance content will appear here once the academic team publishes the first sessions.",
    emptyTitle: "Interview guidance is still being prepared.",
    eyebrow: "Interview guidance",
    family: "INTERVIEW_GUIDANCE",
    heroDescription:
      "Interview preparation in a calmer, more structured format than notes, with room for spoken prompts, mindset coaching, and scenario practice.",
    heroTitle: "Prepare for the interview room with structured, repeatable guidance.",
    hubHref: "/student/guidance",
    label: "Interview Guidance",
    shortLabel: "Interview",
  },
  {
    accentCssVar: "var(--accent-public)",
    collectionHref: "/student/english-speaking",
    detailHref: (slug) => `/student/english-speaking/${encodeURIComponent(slug)}`,
    discoveryDescription:
      "Spoken-English lessons, practical language drills, and mixed-language explanations that can comfortably carry Marathi and English together.",
    emptyDescription:
      "English-speaking lessons will appear here once the first lesson set is published.",
    emptyTitle: "English-speaking lessons are not published yet.",
    eyebrow: "English speaking",
    family: "ENGLISH_SPEAKING",
    heroDescription:
      "A reusable lesson surface for spoken English modules, mixed-language teaching, and content that may need legacy Marathi rendering hints.",
    heroTitle: "Build practical spoken English with lessons that fit the student app.",
    hubHref: "/student/english-speaking",
    label: "English Speaking",
    shortLabel: "English",
  },
  {
    accentCssVar: "var(--accent-public)",
    collectionHref: "/student/current-affairs",
    detailHref: (slug) => `/student/current-affairs/${encodeURIComponent(slug)}`,
    discoveryDescription:
      "Shorter current-affairs explainers, contextual updates, and feed-like reading that sits outside the PDF notes workflow.",
    emptyDescription:
      "Current-affairs items will show up here as soon as they are published from the backend content module.",
    emptyTitle: "Current affairs will appear once updates are published.",
    eyebrow: "Current affairs",
    family: "CURRENT_AFFAIRS",
    heroDescription:
      "Timely affairs content and lighter read flows that work well as articles, explainers, or fast feed items inside the student experience.",
    heroTitle: "Stay current without leaving the structured learning surface.",
    hubHref: "/student/current-affairs",
    label: "Current Affairs",
    shortLabel: "Affairs",
  },
  {
    accentCssVar: "var(--accent-public)",
    collectionHref: "/student/monthly-updates",
    detailHref: (slug) => `/student/monthly-updates/${encodeURIComponent(slug)}`,
    discoveryDescription:
      "Monthly roundups and curated update packs that can group important public-service and exam-relevant developments together.",
    emptyDescription:
      "Monthly update packs will appear here once the content calendar starts publishing them.",
    emptyTitle: "Monthly updates are not published yet.",
    eyebrow: "Monthly updates",
    family: "MONTHLY_UPDATE",
    heroDescription:
      "A dedicated home for monthly issue-style updates, with reusable detail rendering that can later support admin preview and editorial workflows.",
    heroTitle: "Review the month in one focused learning surface.",
    hubHref: "/student/monthly-updates",
    label: "Monthly Updates",
    shortLabel: "Monthly",
  },
];

const CONTENT_FAMILY_DEFINITION_MAP = new Map(
  CONTENT_FAMILY_DEFINITIONS.map((definition) => [definition.family, definition]),
);

export const STUDENT_STRUCTURED_SURFACE_LINKS: StructuredSurfaceLink[] = [
  {
    description:
      "Career direction and interview readiness in one shared guidance hub.",
    href: "/student/guidance",
    label: "Guidance hub",
  },
  {
    description:
      "Spoken-English lessons with mixed-language rendering support.",
    href: "/student/english-speaking",
    label: "English speaking",
  },
  {
    description:
      "Shorter current-affairs explainers and regularly published updates.",
    href: "/student/current-affairs",
    label: "Current affairs",
  },
  {
    description:
      "Monthly update packs for revision-oriented reading sessions.",
    href: "/student/monthly-updates",
    label: "Monthly updates",
  },
];

export function getContentFamilyDefinitions() {
  return CONTENT_FAMILY_DEFINITIONS;
}

export function getContentFamilyDefinition(family: ContentFamily) {
  const definition = CONTENT_FAMILY_DEFINITION_MAP.get(family);

  if (!definition) {
    throw new Error(`Missing content family definition for ${family}.`);
  }

  return definition;
}
