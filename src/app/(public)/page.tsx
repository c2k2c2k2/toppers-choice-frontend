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
  const supportHref = `https://wa.me/91${content.branding.supportWhatsapp.replace(/\D/g, "")}`;
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
        eyebrow={content.banner?.subtitle ?? content.branding.displayName}
        title={
          content.banner?.title ??
          "Prepare with clear notes, practice, tests, and guidance."
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
              Admissions and support
            </p>
            <div className="mt-4 grid gap-3">
              <div className="tc-panel rounded-[24px] p-4">
                <p className="text-sm font-semibold text-[color:var(--brand)]">
                  Talk to the academy
                </p>
                <p className="tc-muted mt-2 text-sm">
                  {content.branding.supportNote}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={supportHref} className="tc-button-primary">
                    WhatsApp support
                  </Link>
                  <Link href="/pricing" className="tc-button-secondary">
                    View plans
                  </Link>
                </div>
              </div>
              <div className="tc-panel rounded-[24px] p-4">
                <p className="text-sm font-semibold text-[color:var(--brand)]">
                  Academy address
                </p>
                <p className="tc-muted mt-2 text-sm">
                  {content.branding.address}
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
            label: "Plans",
            title: "Choose a plan",
            description:
              "Compare plan options and continue to the student app when you are ready to enroll.",
          },
          {
            href: "/about",
            label: "About",
            title: "About the academy",
            description:
              "Learn about Topper's Choice, the teaching approach, and the main learning areas.",
          },
          {
            href: "/contact",
            label: "Support",
            title: "Contact the team",
            description:
              "Message the academy for fee details, batches, and general support.",
          },
          {
            href: "/tracks/mpsc-allied",
            label: "Tracks",
            title: "Explore preparation paths",
            description:
              "See the main exam paths, learning focus, and who each path is meant for.",
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
