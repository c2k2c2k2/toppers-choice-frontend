import Link from "next/link";
import type { CmsSection } from "@/lib/cms";
import type { PublicPlan } from "@/lib/payments";
import type { PublicPlanPreview, PublicTrackDefinition } from "@/lib/public";
import {
  PublicPlanCard,
  mapPlanPreviewToCardData,
  mapPlanToCardData,
} from "@/components/public/public-plan-card";

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

function renderRichTextSection(section: CmsSection) {
  const paragraphs = readStringArray(section.bodyJson?.paragraphs);
  const stats = readRecordArray(section.bodyJson?.stats);

  return (
    <section key={section.id} className="tc-card tc-motion-rise rounded-[32px] p-6 md:p-8">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="tc-overline">{section.code.replace(/-/g, " ")}</p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
            {section.title}
          </h2>
          {section.subtitle ? (
            <p className="tc-muted mt-3 text-base leading-7">{section.subtitle}</p>
          ) : null}
          <div className="mt-5 space-y-4">
            {paragraphs.map((paragraph) => (
              <p key={paragraph} className="tc-muted text-sm leading-7 md:text-base">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <aside className="tc-panel rounded-[28px] p-5">
          <p className="tc-overline">Section rhythm</p>
          <div className="mt-4 grid gap-3">
            {stats.map((stat, index) => (
              <div key={`${section.id}-stat-${index}`} className="tc-card rounded-[22px] p-4">
                <p className="text-2xl font-semibold text-[color:var(--brand)]">
                  {readString(stat.value, "Live")}
                </p>
                <p className="tc-muted mt-1 text-sm">{readString(stat.label, "Public section metric")}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function renderContentFeedSection(
  section: CmsSection,
  trackDefinitions: PublicTrackDefinition[],
) {
  const items = readRecordArray(section.bodyJson?.items);
  const fallbackTrackItems = section.code.includes("track")
    ? trackDefinitions.map((track) => ({
        label: track.eyebrow,
        title: track.title,
        description: track.summary,
        href: `/tracks/${track.slug}`,
        meta: track.audience,
      }))
    : [];
  const displayItems = items.length > 0 ? items : fallbackTrackItems;
  const columnClass =
    Number(section.configJson?.columns) >= 3
      ? "xl:grid-cols-3"
      : "xl:grid-cols-2";

  return (
    <section key={section.id} className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <p className="tc-overline">{section.code.replace(/-/g, " ")}</p>
        <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
          {section.title}
        </h2>
        {section.subtitle ? (
          <p className="tc-muted text-base leading-7">{section.subtitle}</p>
        ) : null}
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${columnClass}`}>
        {displayItems.map((item, index) => {
          const href = readString(item.href);
          const card = (
            <article className="tc-panel tc-motion-rise rounded-[28px] p-5">
              <p className="tc-overline">{readString(item.label, "Highlight")}</p>
              <h3 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
                {readString(item.title, "Public content card")}
              </h3>
              <p className="tc-muted mt-3 text-sm leading-6">
                {readString(
                  item.description,
                  "Structured card copy will render here once authored.",
                )}
              </p>
              {readString(item.meta) ? (
                <p className="tc-muted mt-4 text-xs uppercase tracking-[0.18em]">
                  {readString(item.meta)}
                </p>
              ) : null}
            </article>
          );

          return href ? (
            <Link key={`${section.id}-${index}`} href={href}>
              {card}
            </Link>
          ) : (
            <div key={`${section.id}-${index}`}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}

function renderPlanHighlightsSection(
  section: CmsSection,
  plans: PublicPlan[],
  planPreviews: PublicPlanPreview[],
) {
  const cards =
    plans.length > 0
      ? plans.map(mapPlanToCardData)
      : planPreviews.map(mapPlanPreviewToCardData);
  const note = readString(
    section.configJson?.note,
    "Public plans will slot into this grid when the backend publishes active plans.",
  );

  return (
    <section key={section.id} className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <p className="tc-overline">
          {readString(section.configJson?.eyebrow, "Plans")}
        </p>
        <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
          {section.title}
        </h2>
        {section.subtitle ? (
          <p className="tc-muted text-base leading-7">{section.subtitle}</p>
        ) : null}
        <p className="tc-muted text-sm leading-6">{note}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <PublicPlanCard key={`${card.title}-${card.priceLabel}`} card={card} />
        ))}
      </div>
    </section>
  );
}

function renderCtaGroupSection(section: CmsSection) {
  const items = readRecordArray(section.bodyJson?.items);

  return (
    <section key={section.id} className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <p className="tc-overline">{section.code.replace(/-/g, " ")}</p>
        <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
          {section.title}
        </h2>
        {section.subtitle ? (
          <p className="tc-muted text-base leading-7">{section.subtitle}</p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {items.map((item, index) => {
          const href = readString(item.href, "/");
          const tone = readString(item.tone);

          return (
            <article
              key={`${section.id}-${index}`}
              className="tc-card tc-motion-rise rounded-[28px] p-5"
            >
              <p className="tc-overline">{readString(item.label, "Call to action")}</p>
              <h3 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
                {readString(item.title, "Continue browsing")}
              </h3>
              <p className="tc-muted mt-3 text-sm leading-6">
                {readString(
                  item.description,
                  "This route is mounted now and will become richer in later prompts.",
                )}
              </p>
              <Link
                href={href}
                className={
                  tone === "secondary"
                    ? "tc-button-secondary mt-5"
                    : "tc-button-primary mt-5"
                }
              >
                {readString(item.label, "Open route")}
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function PublicSectionRenderer({
  planPreviews,
  plans,
  sections,
  trackDefinitions,
}: Readonly<{
  planPreviews: PublicPlanPreview[];
  plans: PublicPlan[];
  sections: CmsSection[];
  trackDefinitions: PublicTrackDefinition[];
}>) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => {
        if (section.type === "RICH_TEXT") {
          return renderRichTextSection(section);
        }

        if (section.type === "CONTENT_FEED") {
          return renderContentFeedSection(section, trackDefinitions);
        }

        if (section.type === "PLAN_HIGHLIGHTS") {
          return renderPlanHighlightsSection(section, plans, planPreviews);
        }

        if (section.type === "CTA_GROUP") {
          return renderCtaGroupSection(section);
        }

        return (
          <section
            key={section.id}
            className="tc-panel rounded-[28px] p-6 text-sm text-[color:var(--muted)]"
          >
            {section.title} is wired as a CMS section, but its renderer is not
            authored yet.
          </section>
        );
      })}
    </div>
  );
}
