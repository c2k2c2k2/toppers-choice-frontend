import Link from "next/link"
import { readStructuredDocumentHtml } from "@/lib/admin/rich-text"
import { TextContent } from "@/components/primitives/text-content"
import { EmptyState } from "@/components/primitives/empty-state"

const LEGACY_PAGE_BLOCK_TYPES = new Set([
  "prose",
  "feature-grid",
  "list",
  "contact",
  "note",
  "cta",
])

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

export function PublicPageBody({
  bodyJson,
  fallbackSummary,
}: Readonly<{
  bodyJson: Record<string, unknown> | null
  fallbackSummary: string
}>) {
  const blocks = readRecordArray(bodyJson?.blocks)
  const hasLegacyBlocks = blocks.some((block) =>
    LEGACY_PAGE_BLOCK_TYPES.has(readString(block.type).toLowerCase()),
  )
  const richHtml = readStructuredDocumentHtml(bodyJson)

  if (!hasLegacyBlocks && richHtml) {
    return (
      <section className="tc-public-surface rounded-[30px] p-6">
        <TextContent
          className="tc-rich-html text-base leading-8 text-[color:var(--foreground)]"
          value={richHtml}
        />
      </section>
    )
  }

  if (blocks.length === 0) {
    return (
      <EmptyState
        eyebrow="Coming soon"
        title="This page will be updated soon."
        description={fallbackSummary}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, index) => {
        const type = readString(block.type).toLowerCase()
        const title = readString(block.title)

        if (type === "prose") {
          const paragraphs = readStringArray(block.paragraphs)

          return (
            <section key={`${type}-${index}`} className="tc-public-surface rounded-[30px] p-6">
              {title ? (
                <TextContent
                  as="h2"
                  className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]"
                  value={title}
                />
              ) : null}
              <div className="mt-4 space-y-4">
                {paragraphs.map((paragraph) => (
                  <TextContent
                    key={paragraph}
                    as="p"
                    className="tc-muted text-base leading-8"
                    preserveLineBreaks
                    value={paragraph}
                  />
                ))}
              </div>
            </section>
          )
        }

        if (type === "feature-grid") {
          const items = readRecordArray(block.items)

          return (
            <section key={`${type}-${index}`} className="space-y-4">
              {title ? (
                <TextContent
                  as="h2"
                  className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]"
                  value={title}
                />
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item, itemIndex) => (
                  <article
                    key={`${title}-${itemIndex}`}
                    className="tc-public-surface-muted rounded-[28px] p-5"
                  >
                    <TextContent
                      as="h3"
                      className="text-lg font-semibold text-[color:var(--brand)]"
                      value={readString(item.title, "More information")}
                    />
                    <TextContent
                      as="p"
                      className="tc-muted mt-3 text-sm leading-6"
                      preserveLineBreaks
                      value={readString(item.description, "Details will be updated soon.")}
                    />
                  </article>
                ))}
              </div>
            </section>
          )
        }

        if (type === "list") {
          const items = readStringArray(block.items)

          return (
            <section key={`${type}-${index}`} className="tc-public-surface-muted rounded-[30px] p-6">
              {title ? (
                <TextContent
                  as="h2"
                  className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]"
                  value={title}
                />
              ) : null}
              <ul className="tc-muted mt-4 list-disc space-y-3 pl-5 text-sm leading-6">
                {items.map((item) => (
                  <TextContent key={item} as="li" value={item} />
                ))}
              </ul>
            </section>
          )
        }

        if (type === "contact") {
          const items = readRecordArray(block.items)

          return (
            <section key={`${type}-${index}`} className="space-y-4">
              {title ? (
                <TextContent
                  as="h2"
                  className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]"
                  value={title}
                />
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item, itemIndex) => {
                  const value = readString(item.value)
                  const href = readString(item.href)
                  const description = readString(item.description)

                  return (
                    <article
                      key={`${value}-${itemIndex}`}
                      className="tc-public-surface rounded-[28px] p-5"
                    >
                      <TextContent as="p" className="tc-overline" value={readString(item.label, "Contact")} />
                      {href ? (
                        <Link href={href} className="mt-3 block text-xl font-semibold text-[color:var(--brand)]">
                          <TextContent as="span" value={value} />
                        </Link>
                      ) : (
                        <TextContent
                          as="p"
                          className="mt-3 text-xl font-semibold text-[color:var(--brand)]"
                          value={value}
                        />
                      )}
                      {description ? (
                        <TextContent
                          as="p"
                          className="tc-muted mt-3 text-sm leading-6"
                          preserveLineBreaks
                          value={description}
                        />
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          )
        }

        if (type === "note") {
          return (
            <section key={`${type}-${index}`} className="tc-public-surface-muted rounded-[30px] p-6">
              {title ? (
                <TextContent
                  as="h2"
                  className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]"
                  value={title}
                />
              ) : null}
              <TextContent
                as="p"
                className="tc-muted mt-4 text-sm leading-7"
                preserveLineBreaks
                value={readString(block.description, "This information will be updated soon.")}
              />
            </section>
          )
        }

        if (type === "cta") {
          const ctas = readRecordArray(block.ctas)

          return (
            <section key={`${type}-${index}`} className="tc-public-surface rounded-[30px] p-6">
              {title ? (
                <TextContent
                  as="h2"
                  className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]"
                  value={title}
                />
              ) : null}
              <TextContent
                as="p"
                className="tc-muted mt-4 text-sm leading-7"
                preserveLineBreaks
                value={readString(block.description, "Choose one of the options below.")}
              />
              <div className="mt-5 flex flex-wrap gap-3">
                {ctas.map((cta, ctaIndex) => {
                  const href = readString(cta.href, "/")
                  const label = readString(cta.label, "Return home")
                  const tone = readString(cta.tone)

                  return (
                    <Link
                      key={`${label}-${ctaIndex}`}
                      href={href}
                      className={tone === "secondary" ? "tc-button-secondary" : "tc-button-primary"}
                    >
                      <TextContent as="span" value={label} />
                    </Link>
                  )
                })}
              </div>
            </section>
          )
        }

        return (
          <section key={`${type}-${index}`} className="tc-public-surface-muted rounded-[30px] p-6">
            <TextContent
              as="h2"
              className="tc-display text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
              value={title || "Public content block"}
            />
            <p className="tc-muted mt-3 text-sm leading-6">
              More information for this section will be added soon.
            </p>
          </section>
        )
      })}
    </div>
  )
}
