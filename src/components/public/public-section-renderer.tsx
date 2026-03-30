import Link from "next/link"
import { readStructuredDocumentHtml } from "@/lib/admin/rich-text"
import type { CmsSection } from "@/lib/cms"
import type { PublicPlan } from "@/lib/payments"
import type { PublicPlanPreview, PublicTrackDefinition } from "@/lib/public"
import { TextContent } from "@/components/primitives/text-content"
import {
  PublicPlanCard,
  mapPlanPreviewToCardData,
  mapPlanToCardData,
} from "@/components/public/public-plan-card"

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function readString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    : []
}

function readRecordArray(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildParagraphHtml(value: unknown) {
  return readStringArray(value).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")
}

function getSectionEyebrow(section: CmsSection, fallback: string) {
  return readString(section.configJson?.eyebrow, fallback)
}

function readSectionRichHtml(section: CmsSection) {
  const structuredHtml = readStructuredDocumentHtml(section.bodyJson)
  if (structuredHtml) {
    return structuredHtml
  }

  return buildParagraphHtml(section.bodyJson?.paragraphs)
}

function renderRichTextSection(section: CmsSection) {
  const richHtml = readSectionRichHtml(section)
  const stats = readRecordArray(section.bodyJson?.stats)

  return (
    <section
      key={section.id}
      className="tc-public-surface tc-motion-rise rounded-[32px] p-6 md:p-8"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <TextContent as="p" className="tc-overline" value={getSectionEyebrow(section, "Overview")} />
          <TextContent
            as="h2"
            className="tc-display mt-3 text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl"
            value={section.title}
          />
          {section.subtitle ? (
            <TextContent
              as="p"
              className="tc-muted mt-3 text-base leading-7"
              preserveLineBreaks
              value={section.subtitle}
            />
          ) : null}
          {richHtml ? (
            <TextContent
              className="tc-rich-html mt-5 text-sm leading-7 text-[color:var(--foreground)] md:text-base"
              value={richHtml}
            />
          ) : null}
        </div>
        <aside className="tc-public-surface-muted rounded-[28px] p-5">
          <p className="tc-overline">Highlights</p>
          <div className="mt-4 grid gap-3">
            {stats.map((stat, index) => (
              <div
                key={`${section.id}-stat-${index}`}
                className="tc-public-surface rounded-[22px] p-4"
              >
                <TextContent
                  as="p"
                  className="text-2xl font-semibold text-[color:var(--brand)]"
                  value={readString(stat.value, "Available")}
                />
                <TextContent
                  as="p"
                  className="tc-muted mt-1 text-sm"
                  value={readString(stat.label, "Highlight")}
                />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  )
}

function renderContentFeedSection(
  section: CmsSection,
  trackDefinitions: PublicTrackDefinition[],
) {
  const items = readRecordArray(section.bodyJson?.items)
  const fallbackTrackItems = section.code.includes("track")
    ? trackDefinitions.map((track) => ({
        description: track.summary,
        href: `/tracks/${track.slug}`,
        label: track.eyebrow,
        meta: track.audience,
        title: track.title,
      }))
    : []
  const displayItems = items.length > 0 ? items : fallbackTrackItems
  const columnClass =
    Number(section.configJson?.columns) >= 3 ? "xl:grid-cols-3" : "xl:grid-cols-2"

  return (
    <section key={section.id} className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <TextContent as="p" className="tc-overline" value={getSectionEyebrow(section, "Highlights")} />
        <TextContent
          as="h2"
          className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl"
          value={section.title}
        />
        {section.subtitle ? (
          <TextContent
            as="p"
            className="tc-muted text-base leading-7"
            preserveLineBreaks
            value={section.subtitle}
          />
        ) : null}
      </div>

      <div className={`grid gap-4 md:grid-cols-2 ${columnClass}`}>
        {displayItems.map((item, index) => {
          const href = readString(item.href)
          const card = (
            <article className="tc-public-surface-muted tc-motion-rise rounded-[28px] p-5">
              <TextContent
                as="p"
                className="tc-overline"
                value={readString(item.label, "Highlight")}
              />
              <TextContent
                as="h3"
                className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
                value={readString(item.title, "More information")}
              />
              <TextContent
                as="p"
                className="tc-muted mt-3 text-sm leading-6"
                preserveLineBreaks
                value={readString(item.description, "Details will be updated soon.")}
              />
              {readString(item.meta) ? (
                <TextContent
                  as="p"
                  className="tc-muted mt-4 text-xs uppercase tracking-[0.18em]"
                  value={readString(item.meta)}
                />
              ) : null}
            </article>
          )

          return href ? (
            <Link key={`${section.id}-${index}`} href={href}>
              {card}
            </Link>
          ) : (
            <div key={`${section.id}-${index}`}>{card}</div>
          )
        })}
      </div>
    </section>
  )
}

function renderPlanHighlightsSection(
  section: CmsSection,
  plans: PublicPlan[],
  planPreviews: PublicPlanPreview[],
) {
  const cards =
    plans.length > 0 ? plans.map(mapPlanToCardData) : planPreviews.map(mapPlanPreviewToCardData)
  const note = readString(section.configJson?.note, "Fee details and plan options will appear here.")

  return (
    <section key={section.id} className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <TextContent
          as="p"
          className="tc-overline"
          value={readString(section.configJson?.eyebrow, "Plans")}
        />
        <TextContent
          as="h2"
          className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl"
          value={section.title}
        />
        {section.subtitle ? (
          <TextContent
            as="p"
            className="tc-muted text-base leading-7"
            preserveLineBreaks
            value={section.subtitle}
          />
        ) : null}
        <TextContent
          as="p"
          className="tc-muted text-sm leading-6"
          preserveLineBreaks
          value={note}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {cards.map((card) => (
          <PublicPlanCard key={`${card.title}-${card.priceLabel}`} card={card} />
        ))}
      </div>
    </section>
  )
}

function renderCtaGroupSection(section: CmsSection) {
  const items = readRecordArray(section.bodyJson?.items)

  return (
    <section key={section.id} className="space-y-4">
      <div className="max-w-3xl space-y-3">
        <TextContent as="p" className="tc-overline" value={getSectionEyebrow(section, "Next step")} />
        <TextContent
          as="h2"
          className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl"
          value={section.title}
        />
        {section.subtitle ? (
          <TextContent
            as="p"
            className="tc-muted text-base leading-7"
            preserveLineBreaks
            value={section.subtitle}
          />
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {items.map((item, index) => {
          const href = readString(item.href, "/")
          const tone = readString(item.tone)

          return (
            <article
              key={`${section.id}-${index}`}
              className="tc-public-surface tc-motion-rise rounded-[28px] p-5"
            >
              <TextContent
                as="p"
                className="tc-overline"
                value={readString(item.label, "Call to action")}
              />
              <TextContent
                as="h3"
                className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
                value={readString(item.title, "Continue browsing")}
              />
              <TextContent
                as="p"
                className="tc-muted mt-3 text-sm leading-6"
                preserveLineBreaks
                value={readString(item.description, "Open this section for more information.")}
              />
              <Link
                href={href}
                className={tone === "secondary" ? "tc-button-secondary mt-5" : "tc-button-primary mt-5"}
              >
                <TextContent as="span" value={readString(item.label, "Open route")} />
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export function PublicSectionRenderer({
  planPreviews,
  plans,
  sections,
  trackDefinitions,
}: Readonly<{
  planPreviews: PublicPlanPreview[]
  plans: PublicPlan[]
  sections: CmsSection[]
  trackDefinitions: PublicTrackDefinition[]
}>) {
  return (
    <div className="flex flex-col gap-8">
      {sections.map((section) => {
        if (section.type === "RICH_TEXT") {
          return renderRichTextSection(section)
        }

        if (section.type === "CONTENT_FEED") {
          return renderContentFeedSection(section, trackDefinitions)
        }

        if (section.type === "PLAN_HIGHLIGHTS") {
          return renderPlanHighlightsSection(section, plans, planPreviews)
        }

        if (section.type === "CTA_GROUP") {
          return renderCtaGroupSection(section)
        }

        return (
          <section
            key={section.id}
            className="tc-public-surface-muted rounded-[28px] p-6 text-sm text-[color:var(--muted)]"
          >
            <TextContent as="span" value={section.title} /> will be updated soon.
          </section>
        )
      })}
    </div>
  )
}
