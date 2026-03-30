import Link from "next/link";
import { MarathiText } from "@/components/primitives/marathi-text";
import { TextContent } from "@/components/primitives/text-content";
import { PublicSectionRenderer } from "@/components/public/public-section-renderer";
import {
  buildPublicMetadata,
  getPublicHomeContent,
  type PublicHomeContent,
} from "@/lib/public";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function readRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function findSection(content: PublicHomeContent, code: string) {
  return content.sections.find((section) => section.code === code) ?? null;
}

function LandingIcon({
  name,
  tone = "default",
}: Readonly<{
  name:
    | "bank"
    | "career"
    | "discipline"
    | "english"
    | "foundation"
    | "interview"
    | "mpsc"
    | "notes"
    | "practice"
    | "privacy";
  tone?: "default" | "hero";
}>) {
  return (
    <span className="tc-public-icon" data-tone={tone === "hero" ? "hero" : undefined}>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {name === "notes" ? (
          <>
            <path d="M7 4.5h7l3 3V19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1Z" />
            <path d="M14 4.5V8h3.5" />
            <path d="M9 12h6" />
            <path d="M9 15.5h4.5" />
          </>
        ) : null}
        {name === "foundation" ? (
          <>
            <path d="M12 3.5 5.5 9.5 12 21l6.5-11.5L12 3.5Z" />
            <path d="M9.5 12h5" />
            <path d="M12 9.5v5" />
          </>
        ) : null}
        {name === "discipline" ? (
          <>
            <path d="M6 18.5h12" />
            <path d="M7.5 14.5 10 12l2 2 4.5-5" />
            <path d="M6 6.5h12" />
          </>
        ) : null}
        {name === "privacy" ? (
          <>
            <path d="m12 3.5 7 3v5c0 4.2-2.6 7.8-7 9-4.4-1.2-7-4.8-7-9v-5l7-3Z" />
            <path d="M9.5 11.5h5" />
            <path d="M12 9v5" />
          </>
        ) : null}
        {name === "mpsc" ? (
          <>
            <path d="M4 9.5 12 4l8 5.5" />
            <path d="M6.5 10.5v7" />
            <path d="M11 10.5v7" />
            <path d="M15.5 10.5v7" />
            <path d="M4.5 18.5h15" />
          </>
        ) : null}
        {name === "bank" ? (
          <>
            <path d="M4.5 8.5 12 4l7.5 4.5" />
            <path d="M6.5 9.5v7.5" />
            <path d="M12 9.5v7.5" />
            <path d="M17.5 9.5v7.5" />
            <path d="M4.5 18.5h15" />
          </>
        ) : null}
        {name === "practice" ? (
          <>
            <path d="M7 5.5h10a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z" />
            <path d="M9 9.5h6" />
            <path d="M9 13h4" />
            <path d="m8 17 2-2 2 2" />
          </>
        ) : null}
        {name === "career" ? (
          <>
            <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" />
            <path d="m12 9 2.5 2.5" />
            <path d="M12 12 8 14" />
          </>
        ) : null}
        {name === "interview" ? (
          <>
            <path d="M8.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            <path d="M15.5 11.5a2 2 0 1 0 0-4" />
            <path d="M4.5 18c.5-2 2.2-3.5 4-3.5s3.5 1.5 4 3.5" />
            <path d="M14 17.5c.3-1.4 1.4-2.5 2.8-2.9" />
          </>
        ) : null}
        {name === "english" ? (
          <>
            <path d="M4.5 6.5h9" />
            <path d="M9 6.5c0 5.5-2.2 9-4.5 11" />
            <path d="M9 6.5c0 5.5 2.2 9 4.5 11" />
            <path d="M14 10.5h5.5" />
            <path d="M16.75 8v5" />
            <path d="m14 13 2.75 3L19.5 13" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

function HomeSectionHeading({
  action,
  description,
  title,
}: Readonly<{
  action?: React.ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl space-y-3">
        <h2 className="tc-display text-3xl font-extrabold tracking-tight text-[color:var(--brand)] md:text-4xl">
          {title}
        </h2>
        <p className="tc-muted text-base leading-7">{description}</p>
      </div>
      {action}
    </div>
  );
}

export async function generateMetadata() {
  const content = await getPublicHomeContent();

  return buildPublicMetadata({
    title: content.branding.displayName,
    description: content.branding.description,
    path: "/",
  });
}

export default async function PublicHomePage() {
  const content = await getPublicHomeContent();
  const supportHref = `https://wa.me/91${content.branding.supportWhatsapp.replace(/\D/g, "")}`;
  const heroStats = readRecordArray(content.banner?.metaJson?.stats)
    .map((stat) => ({
      label: readString(stat.label, "Highlight"),
      value: readString(stat.value, "Live"),
    }))
    .slice(0, 3);
  const heroActions = [
    {
      label: content.banner?.ctaLabel ?? "Explore Study Materials",
      href: content.banner?.ctaHref ?? "/tracks/mpsc-allied",
      tone: "primary" as const,
    },
    {
      label: readString(
        content.banner?.metaJson?.secondaryCtaLabel,
        "Take a Free Practice Test",
      ),
      href: readString(
        content.banner?.metaJson?.secondaryCtaHref,
        "/student/login",
      ),
      tone: "secondary" as const,
    },
  ];

  const introSection = findSection(content, "landing-editorial-intro");
  const offeringsSection = findSection(content, "landing-core-offerings");
  const trackSection = findSection(content, "landing-track-highlights");
  const ctaSection = findSection(content, "landing-call-to-action");

  const introParagraphs = readStringArray(introSection?.bodyJson?.paragraphs).slice(0, 2);
  const ctaItems = readRecordArray(ctaSection?.bodyJson?.items).slice(0, 2);
  const livePlans = content.plans.length > 0 ? content.plans : [];
  const planLabels =
    livePlans.length > 0
      ? livePlans.slice(0, 3).map((plan) => plan.name)
      : content.planPreviews.slice(0, 3).map((preview) => preview.name);

  const mpscTrack =
    content.trackDefinitions.find((track) => track.slug === "mpsc-allied") ??
    content.trackDefinitions[0] ??
    null;
  const bankTrack =
    content.trackDefinitions.find((track) => track.slug === "bank-staff-railway") ??
    content.trackDefinitions[1] ??
    null;
  const guidanceTrack =
    content.trackDefinitions.find(
      (track) => track.slug === "career-and-interview-guidance",
    ) ?? null;
  const englishTrack =
    content.trackDefinitions.find((track) => track.slug === "english-speaking") ??
    null;

  const advantageCards = [
    {
      description:
        "Subject-wise and topic-wise material shaped for quick revision and exam relevance.",
      icon: "notes" as const,
      title: "Precision Notes",
    },
    {
      description:
        "Concept-first preparation that makes long-term study easier to hold and revise.",
      icon: "foundation" as const,
      title: "Strong Foundations",
    },
    {
      description:
        "A structured path that keeps notes, practice, and timed testing in one rhythm.",
      icon: "discipline" as const,
      title: "Disciplined Study",
    },
    {
      description:
        "Progress, scores, and protected learning routes stay tied to the signed-in student.",
      icon: "privacy" as const,
      title: "Secured Privacy",
    },
  ];

  const programCards = [
    {
      cta: "Explore",
      description:
        mpscTrack?.summary ??
        "Detailed study support for MPSC and closely related exams.",
      href: mpscTrack ? `/tracks/${mpscTrack.slug}` : "/tracks/mpsc-allied",
      icon: "mpsc" as const,
      title: "MPSC & Allied Exams",
    },
    {
      cta: "Explore",
      description:
        bankTrack?.summary ??
        "Practice-focused coverage for bank, staff, railway, and aptitude-heavy paths.",
      href: bankTrack
        ? `/tracks/${bankTrack.slug}`
        : "/tracks/bank-staff-railway",
      icon: "bank" as const,
      title: "Bank, Staff & Railway",
    },
    {
      cta: "Start",
      description:
        "Timed mock tests and guided practice sessions that help students sharpen speed and accuracy.",
      href: "/student/login",
      icon: "practice" as const,
      title: "Practice Papers",
    },
    {
      cta: "Explore",
      description:
        "Preparation advice that helps students choose the right exam path with more confidence.",
      href: guidanceTrack
        ? `/tracks/${guidanceTrack.slug}`
        : "/contact",
      icon: "career" as const,
      title: "Career Guidance",
    },
    {
      cta: "Explore",
      description:
        "Interview-oriented preparation and next-step support once students move beyond basic study.",
      href: guidanceTrack
        ? `/tracks/${guidanceTrack.slug}`
        : "/contact",
      icon: "interview" as const,
      title: "Interview Guidance",
    },
    {
      cta: "Explore",
      description:
        englishTrack?.summary ??
        "Communication-focused learning support for speaking confidence and interviews.",
      href: englishTrack
        ? `/tracks/${englishTrack.slug}`
        : "/student/login",
      icon: "english" as const,
      title: "English Speaking",
    },
  ];

  const consumedSectionCodes = new Set([
    "landing-editorial-intro",
    "landing-core-offerings",
    "landing-track-highlights",
    "landing-plan-highlights",
    "landing-call-to-action",
  ]);
  const extraSections = content.sections.filter(
    (section) => !consumedSectionCodes.has(section.code),
  );

  return (
    <div className="flex flex-col gap-10 md:gap-14">
      <section className="tc-public-hero min-h-[min(56rem,calc(100dvh-7rem))] rounded-[38px] px-6 py-8 md:px-8 md:py-10 xl:px-12 xl:py-14">
        <div className="grid gap-10 lg:min-h-[44rem] lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="flex flex-col justify-center">
            <div className="tc-public-badge w-fit gap-3" data-tone="hero">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--accent-glow)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent-glow)]" />
              </span>
              <TextContent
                as="span"
                value={
                  content.banner?.subtitle ??
                  content.branding.tagline
                }
              />
            </div>

            <TextContent
              as="h1"
              className="tc-display mt-8 max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-tight text-balance md:text-6xl xl:text-7xl"
              value={
                content.banner?.title ??
                "Achieve Your Exam Goals with 35+ Years of Proven Expertise"
              }
            />

            <TextContent
              as="p"
              className="tc-muted mt-6 max-w-2xl text-lg leading-8 md:text-xl"
              preserveLineBreaks
              value={
                content.banner?.body ??
                content.branding.description
              }
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {heroActions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.tone === "secondary"
                      ? "tc-button-secondary"
                      : "tc-button-primary"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>

            {heroStats.length > 0 ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {heroStats.map((stat) => (
                  <div key={`${stat.label}-${stat.value}`} className="tc-stat-chip">
                    <span className="text-sm font-semibold">{stat.value}</span>
                    <span className="text-xs text-white/72">{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative mx-auto hidden w-full max-w-[36rem] lg:block">
            <div className="tc-public-hero-surface absolute -left-6 top-6 z-20 rounded-[1.5rem] p-4">
              <div className="flex items-center gap-4">
                <LandingIcon name="career" tone="hero" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/56">
                    Enroll now
                  </p>
                  <p className="mt-1 text-base font-semibold text-white">
                    New batch starting
                  </p>
                </div>
              </div>
            </div>

            <div className="relative ml-auto w-[88%] rounded-[2.5rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] p-4 shadow-[0_30px_70px_rgba(0,14,32,0.24)]">
              <div className="relative min-h-[31rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,#1b3e68_0%,#0d1e35_100%)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,184,111,0.18),transparent_24%)]" />
                <div className="absolute inset-x-6 top-6 flex items-center justify-between gap-4">
                  <span className="tc-public-badge" data-tone="hero">
                    Notes + Tests
                  </span>
                  <span className="tc-public-badge" data-tone="hero">
                    Marathi + English
                  </span>
                </div>
                <div className="absolute inset-x-10 top-24 rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_100%)] px-8 py-10">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="h-24 rounded-[1.4rem] bg-white/10" />
                    <div className="h-24 rounded-[1.4rem] bg-white/6" />
                    <div className="h-20 rounded-[1.4rem] bg-white/8 sm:col-span-2" />
                  </div>
                </div>
                <div className="absolute inset-x-6 bottom-6 grid gap-3">
                  <div className="tc-public-hero-surface rounded-[1.4rem] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/56">
                      One platform
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {["Subject-wise notes", "Practice drills", "Mock tests"].map((item) => (
                        <div
                          key={item}
                          className="rounded-[1rem] border border-white/10 bg-white/8 px-3 py-3 text-sm font-medium text-white/84"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="tc-public-surface absolute right-0 top-32 z-20 w-60 rounded-[1.75rem] p-5">
              <p className="text-3xl font-extrabold tracking-tight text-[color:var(--brand)]">
                {heroStats[0]?.value ?? "35+"}
              </p>
              <p className="mt-2 text-sm font-medium text-[color:var(--muted)]">
                {heroStats[0]?.label ?? "Years of guidance"}
              </p>
              <div className="mt-4 flex -space-x-2">
                {["A", "B", "C"].map((item, index) => (
                  <span
                    key={item}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[rgba(0,51,102,0.06)] text-sm font-bold text-[color:var(--brand)]"
                    style={{ zIndex: 3 - index }}
                  >
                    {item}
                  </span>
                ))}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[color:var(--accent-soft)] text-sm font-bold text-[color:var(--cta-surface)]">
                  +9k
                </span>
              </div>
            </div>

            <div className="tc-public-surface absolute bottom-2 left-4 z-20 rounded-[1.6rem] px-5 py-4">
              <div className="flex items-center gap-3">
                <LandingIcon name="notes" />
                <div>
                  <p className="text-sm font-bold text-[color:var(--brand)]">
                    Time &amp; Money Saved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {content.announcements.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {content.announcements.slice(0, 2).map((announcement) => (
            <article
              key={announcement.id}
              className="tc-public-surface-muted rounded-[28px] px-5 py-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="tc-overline">{announcement.level.toLowerCase()}</p>
                  <TextContent
                    as="h2"
                    className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
                    value={announcement.title}
                  />
                </div>
                <span className="tc-public-badge" data-tone="accent">
                  Update
                </span>
              </div>
              <TextContent
                as="p"
                className="tc-muted mt-3 text-sm leading-7"
                preserveLineBreaks
                value={announcement.body}
              />
              {announcement.linkHref && announcement.linkLabel ? (
                <Link href={announcement.linkHref} className="tc-button-secondary mt-5">
                  <TextContent as="span" value={announcement.linkLabel} />
                </Link>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      <section className="space-y-8">
        <HomeSectionHeading
          title="The Topper’s Choice Advantage"
          description={
            introSection?.subtitle ??
            "Strategic preparation tailored for students who want clarity, structure, and exam-focused support."
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {advantageCards.map((card) => (
            <article
              key={card.title}
              className="tc-public-surface rounded-[28px] p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              <LandingIcon name={card.icon} />
              <h3 className="tc-display mt-6 text-xl font-bold tracking-tight text-[color:var(--brand)]">
                {card.title}
              </h3>
              <p className="tc-muted mt-3 text-sm leading-7">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <HomeSectionHeading
          title={offeringsSection?.title ?? "Comprehensive Learning Ecosystem"}
          description={
            offeringsSection?.subtitle ??
            "Six preparation modules designed to cover the main steps of a serious exam journey."
          }
          action={
            <Link href="/tracks/mpsc-allied" className="tc-button-secondary w-fit">
              View all programs
            </Link>
          }
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {programCards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="tc-public-surface rounded-[30px] p-6 transition-transform duration-200 hover:-translate-y-1"
            >
              <LandingIcon name={card.icon} />
              <h3 className="tc-display mt-6 text-[1.75rem] font-bold tracking-tight text-[color:var(--brand)]">
                {card.title}
              </h3>
              <p className="tc-muted mt-4 text-sm leading-7">{card.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[color:var(--accent-public)]">
                {card.cta}
                <span aria-hidden="true">›</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <HomeSectionHeading
          title="Unmatched Curriculum Depth"
          description={
            trackSection?.subtitle ??
            "Vast syllabus coverage broken into manageable subject clusters for steady mastery."
          }
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {[mpscTrack, bankTrack].filter(Boolean).map((track) => (
            <article
              key={track?.slug}
              className="tc-public-surface-muted rounded-[32px] p-6 md:p-8"
            >
              <div className="flex items-center gap-4">
                <LandingIcon
                  name={track?.slug === "mpsc-allied" ? "mpsc" : "bank"}
                />
                <div>
                  <p className="tc-overline">{track?.eyebrow ?? "Track"}</p>
                  <h3 className="tc-display mt-2 text-2xl font-bold tracking-tight text-[color:var(--brand)]">
                    {track?.title}
                  </h3>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {(track?.modules ?? []).slice(0, 8).map((module) => (
                  <div key={module} className="flex items-start gap-3 text-sm leading-6 text-[color:var(--muted)]">
                    <span className="mt-2 inline-flex h-2 w-2 rounded-full bg-[color:var(--accent-glow)]" />
                    <span>{module}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-center">
        <div className="tc-public-surface-muted relative overflow-hidden rounded-[36px] px-6 py-8 md:px-8 md:py-10">
          <div className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-[rgba(255,184,111,0.24)] blur-3xl" />
          <div className="absolute -right-10 bottom-8 h-44 w-44 rounded-full bg-[rgba(0,51,102,0.12)] blur-3xl" />
          <div className="relative flex min-h-[28rem] flex-col justify-between">
            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full bg-[linear-gradient(180deg,#1a3f6c_0%,#071b35_100%)] text-6xl font-extrabold tracking-tight text-white shadow-[0_26px_60px_rgba(0,30,64,0.18)] md:h-60 md:w-60 md:text-7xl">
              TC
            </div>
            <div className="tc-public-surface w-fit rounded-[1.4rem] px-5 py-4">
              <div className="flex items-center gap-3">
                <LandingIcon name="career" />
                <div>
                  <p className="text-sm font-bold text-[color:var(--brand)]">
                    Time &amp; money saved
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="tc-display text-3xl font-extrabold tracking-tight text-[color:var(--brand)] md:text-5xl">
              The Vision Behind Topper’s Choice
            </h2>
            <p className="tc-muted text-base leading-8 md:text-lg">
              {content.branding.proprietorName} shaped Topper&apos;s Choice around
              one simple idea: students should not have to chase scattered
              books, coaching notes, and disconnected tests just to prepare
              seriously.
            </p>
            <p className="tc-muted text-base leading-8 md:text-lg">
              {introParagraphs[0] ??
                "The platform is designed to keep notes, practice, tests, and guidance together so preparation stays focused and affordable."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-l-4 border-[color:var(--accent-glow)] pl-4">
              <p className="tc-display text-3xl font-extrabold tracking-tight text-[color:var(--brand)]">
                {heroStats[0]?.value ?? "35+"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                {heroStats[0]?.label ?? "Years of guidance"}
              </p>
            </div>
            <div className="border-l-4 border-[color:var(--accent-glow)] pl-4">
              <p className="tc-display text-3xl font-extrabold tracking-tight text-[color:var(--brand)]">
                {programCards.length}+
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Learning modules
              </p>
            </div>
          </div>

          <div className="tc-public-surface rounded-[30px] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(0,51,102,0.08)] text-lg font-extrabold text-[color:var(--brand)]">
                TC
              </div>
              <div>
                <p className="text-lg font-bold text-[color:var(--brand)]">
                  {content.branding.proprietorName}
                </p>
                <p className="tc-muted text-sm">
                  {content.branding.displayName} leadership
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {extraSections.length > 0 ? (
        <PublicSectionRenderer
          plans={content.plans}
          planPreviews={content.planPreviews}
          sections={extraSections}
          trackDefinitions={content.trackDefinitions}
        />
      ) : null}

      <section className="tc-public-cta-band rounded-[36px] px-6 py-10 text-center md:px-10 md:py-14">
        <div className="mx-auto max-w-4xl">
          <h2 className="tc-display text-3xl font-extrabold tracking-tight md:text-5xl">
            {ctaSection?.title ?? "Ready to Start Your Journey?"}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/68 md:text-lg">
            {ctaSection?.subtitle ??
              "Join a structured preparation flow that keeps notes, tests, guidance, and admissions moving in one direction."}
          </p>

          {planLabels.length > 0 ? (
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {planLabels.map((label) => (
                <span key={label} className="tc-public-badge" data-tone="hero">
                  {label}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            {(ctaItems.length > 0
              ? ctaItems
              : [
                  {
                    href: "/pricing",
                    label: "Compare plans",
                  },
                  {
                    href: "/student/login",
                    label: "Open student app",
                  },
                ]
            ).map((item, index) => (
              <Link
                key={`${readString(item.href, "/")}-${readString(item.label, "Continue")}`}
                href={readString(item.href, "/")}
                className={index === 0 ? "tc-button-primary" : "tc-button-secondary"}
              >
                {readString(item.label, "Continue")}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/72">
            <Link href={supportHref} className="underline underline-offset-4">
              WhatsApp support
            </Link>
            <span className="h-1 w-1 rounded-full bg-white/32" />
            <MarathiText
              as="span"
              text={content.branding.motto}
              className="font-medium"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
