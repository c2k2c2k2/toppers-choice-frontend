import Link from "next/link";
import { PublicAnnouncementStrip } from "@/components/public/public-announcement-strip";
import { PublicPageHero } from "@/components/public/public-page-hero";
import { PublicSectionRenderer } from "@/components/public/public-section-renderer";
import {
  buildPublicMetadata,
  getPublicHomeContent,
} from "@/lib/public";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function readRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
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
  const heroStats = readRecordArray(content.banner?.metaJson?.stats).map((stat) => ({
    label: readString(stat.label, "Public metric"),
    value: readString(stat.value, "Live"),
  }));
  const heroActions = [
    {
      label: content.banner?.ctaLabel ?? "Explore preparation tracks",
      href: content.banner?.ctaHref ?? "/tracks/mpsc-allied",
      tone: "primary" as const,
    },
    {
      label: readString(content.banner?.metaJson?.secondaryCtaLabel, "Open pricing"),
      href: readString(content.banner?.metaJson?.secondaryCtaHref, "/pricing"),
      tone: "secondary" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PublicPageHero
        eyebrow={content.banner?.subtitle ?? "Public landing"}
        title={
          content.banner?.title ??
          "Structured preparation, guidance, and public discovery on one surface."
        }
        description={
          content.banner?.body ??
          content.branding.description
        }
        motto={content.branding.motto}
        actions={heroActions}
        stats={heroStats}
        aside={
          <div className="tc-glass tc-motion-float rounded-[30px] p-5">
            <p className="tc-overline" style={{ color: "rgba(248,249,250,0.72)" }}>
              Public surface status
            </p>
            <div className="mt-4 grid gap-3">
              <div className="tc-panel rounded-[24px] p-4">
                <p className="text-sm font-semibold text-[color:var(--brand)]">
                  {content.hasLiveCms ? "Live CMS resolve connected" : "Fallback CMS content active"}
                </p>
                <p className="tc-muted mt-2 text-sm">
                  Sections, pages, and banners already flow through the shared
                  CMS-ready renderer instead of hardcoded page branches.
                </p>
              </div>
              <div className="tc-panel rounded-[24px] p-4">
                <p className="text-sm font-semibold text-[color:var(--brand)]">
                  {content.hasLivePlans ? "Public plans available" : "Pricing grid in preview mode"}
                </p>
                <p className="tc-muted mt-2 text-sm">
                  The pricing route and home plan section are ready for backend
                  plan rows without structural rewrites.
                </p>
              </div>
            </div>
          </div>
        }
      />

      <PublicAnnouncementStrip announcements={content.announcements} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/pricing",
            label: "Pricing",
            title: "Plans and CTA architecture",
            description:
              "Public plans render here when backend data is available, with a polished fallback when it is not.",
          },
          {
            href: "/about",
            label: "About",
            title: "CMS-backed public pages",
            description:
              "Static routes are mounted now, but they can resolve authored CMS pages later without route changes.",
          },
          {
            href: "/contact",
            label: "Contact",
            title: "Support path is already public",
            description:
              "Contact expectations, support channels, and future FAQs can all grow from this foundation.",
          },
          {
            href: "/tracks/mpsc-allied",
            label: "Tracks",
            title: "Preparation highlights",
            description:
              "Track pages are present early so future taxonomy and CMS enrichment land on stable public routes.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="tc-card tc-motion-rise rounded-[28px] p-5"
          >
            <p className="tc-overline">{item.label}</p>
            <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
              {item.title}
            </h2>
            <p className="tc-muted mt-3 text-sm leading-6">
              {item.description}
            </p>
          </Link>
        ))}
      </section>

      <PublicSectionRenderer
        plans={content.plans}
        planPreviews={content.planPreviews}
        sections={content.sections}
        trackDefinitions={content.trackDefinitions}
      />
    </div>
  );
}
