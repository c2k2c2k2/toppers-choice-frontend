import Link from "next/link";
import { MarathiText } from "@/components/primitives/marathi-text";
import { TextContent } from "@/components/primitives/text-content";
import type { PublicCtaLink, PublicStat } from "@/lib/public";

interface PublicPageHeroProps {
  actions?: PublicCtaLink[];
  description: string;
  eyebrow?: string;
  kickerColor?: string;
  motto?: string | null;
  aside?: React.ReactNode;
  stats?: PublicStat[];
  title: string;
}

export function PublicPageHero({
  actions = [],
  aside,
  description,
  eyebrow = "Topper's Choice",
  kickerColor = "var(--accent-public)",
  motto,
  stats = [],
  title,
}: Readonly<PublicPageHeroProps>) {
  return (
    <section className="tc-public-hero rounded-[36px] px-6 py-8 md:px-8 md:py-10">
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="space-y-5">
          <p className="tc-kicker" style={{ color: kickerColor }}>
            <TextContent as="span" value={eyebrow} />
          </p>
          <div className="space-y-4">
            <TextContent
              as="h1"
              className="tc-display max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl"
              value={title}
            />
            <TextContent
              as="p"
              className="tc-muted max-w-2xl text-base leading-7 md:text-lg"
              preserveLineBreaks
              value={description}
            />
          </div>

          {motto ? (
            <div className="tc-public-badge" data-tone="hero">
              <MarathiText
                as="p"
                text={motto}
                className="text-xs font-semibold"
              />
            </div>
          ) : null}

          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={
                    action.tone === "secondary"
                      ? "tc-button-secondary"
                      : "tc-button-primary"
                  }
                >
                  <TextContent as="span" value={action.label} />
                </Link>
              ))}
            </div>
          ) : null}

          {stats.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-2">
              {stats.map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="tc-stat-chip">
                  <TextContent
                    as="span"
                    className="text-sm font-semibold"
                    value={stat.value}
                  />
                  <TextContent
                    as="span"
                    className="text-xs text-white/72"
                    value={stat.label}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {aside ? <div className="tc-motion-rise self-stretch">{aside}</div> : null}
      </div>
    </section>
  );
}
