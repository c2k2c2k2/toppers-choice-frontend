import Link from "next/link";
import { EmptyState } from "@/components/primitives/empty-state";

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

export function PublicPageBody({
  bodyJson,
  fallbackSummary,
}: Readonly<{
  bodyJson: Record<string, unknown> | null;
  fallbackSummary: string;
}>) {
  const blocks = readRecordArray(bodyJson?.blocks);

  if (blocks.length === 0) {
    return (
      <EmptyState
        eyebrow="CMS-ready body"
        title="This page is ready for authored public content."
        description={fallbackSummary}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {blocks.map((block, index) => {
        const type = readString(block.type);
        const title = readString(block.title);

        if (type === "prose") {
          const paragraphs = readStringArray(block.paragraphs);

          return (
            <section key={`${type}-${index}`} className="tc-card rounded-[30px] p-6">
              {title ? (
                <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
                  {title}
                </h2>
              ) : null}
              <div className="mt-4 space-y-4">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph} className="tc-muted text-base leading-8">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          );
        }

        if (type === "feature-grid") {
          const items = readRecordArray(block.items);

          return (
            <section key={`${type}-${index}`} className="space-y-4">
              {title ? (
                <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
                  {title}
                </h2>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item, itemIndex) => (
                  <article
                    key={`${title}-${itemIndex}`}
                    className="tc-panel rounded-[28px] p-5"
                  >
                    <h3 className="text-lg font-semibold text-[color:var(--brand)]">
                      {readString(item.title, "Public content block")}
                    </h3>
                    <p className="tc-muted mt-3 text-sm leading-6">
                      {readString(
                        item.description,
                        "Structured feature copy will render here once authored.",
                      )}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (type === "list") {
          const items = readStringArray(block.items);

          return (
            <section key={`${type}-${index}`} className="tc-panel rounded-[30px] p-6">
              {title ? (
                <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
                  {title}
                </h2>
              ) : null}
              <ul className="tc-muted mt-4 list-disc space-y-3 pl-5 text-sm leading-6">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          );
        }

        if (type === "contact") {
          const items = readRecordArray(block.items);

          return (
            <section key={`${type}-${index}`} className="space-y-4">
              {title ? (
                <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
                  {title}
                </h2>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item, itemIndex) => {
                  const value = readString(item.value);
                  const href = readString(item.href);
                  const description = readString(item.description);

                  return (
                    <article
                      key={`${value}-${itemIndex}`}
                      className="tc-card rounded-[28px] p-5"
                    >
                      <p className="tc-overline">{readString(item.label, "Contact")}</p>
                      {href ? (
                        <Link
                          href={href}
                          className="mt-3 block text-xl font-semibold text-[color:var(--brand)]"
                        >
                          {value}
                        </Link>
                      ) : (
                        <p className="mt-3 text-xl font-semibold text-[color:var(--brand)]">
                          {value}
                        </p>
                      )}
                      {description ? (
                        <p className="tc-muted mt-3 text-sm leading-6">
                          {description}
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }

        if (type === "note") {
          return (
            <section key={`${type}-${index}`} className="tc-panel rounded-[30px] p-6">
              {title ? (
                <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
                  {title}
                </h2>
              ) : null}
              <p className="tc-muted mt-4 text-sm leading-7">
                {readString(
                  block.description,
                  "This page is in place and ready for later authored content.",
                )}
              </p>
            </section>
          );
        }

        if (type === "cta") {
          const ctas = readRecordArray(block.ctas);

          return (
            <section key={`${type}-${index}`} className="tc-card rounded-[30px] p-6">
              {title ? (
                <h2 className="tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)]">
                  {title}
                </h2>
              ) : null}
              <p className="tc-muted mt-4 text-sm leading-7">
                {readString(
                  block.description,
                  "This call-to-action group will become richer as public content is authored.",
                )}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {ctas.map((cta, ctaIndex) => {
                  const href = readString(cta.href, "/");
                  const label = readString(cta.label, "Return home");
                  const tone = readString(cta.tone);

                  return (
                    <Link
                      key={`${label}-${ctaIndex}`}
                      href={href}
                      className={
                        tone === "secondary"
                          ? "tc-button-secondary"
                          : "tc-button-primary"
                      }
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        }

        return (
          <section key={`${type}-${index}`} className="tc-panel rounded-[30px] p-6">
            <h2 className="tc-display text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
              {title || "Public content block"}
            </h2>
            <p className="tc-muted mt-3 text-sm leading-6">
              This page block type is not authored yet, but the route is ready to
              accept richer CMS-managed content later.
            </p>
          </section>
        );
      })}
    </div>
  );
}
