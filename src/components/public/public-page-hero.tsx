import Link from "next/link";
import { MarathiText } from "@/components/primitives/marathi-text";
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
    <section className="tc-hero rounded-[34px] px-6 py-8 md:px-8 md:py-10">
      <div className="grid gap-8 xl:grid-cols-[1.08fr_0.92fr] xl:items-start">
        <div className="space-y-5">
          <p className="tc-kicker" style={{ color: kickerColor }}>
            {eyebrow}
          </p>
          <div className="space-y-4">
            <h1 className="tc-display max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              {title}
            </h1>
            <p className="tc-muted max-w-2xl text-base leading-7 md:text-lg">
              {description}
            </p>
          </div>

          {motto ? (
            <div className="tc-glass inline-flex rounded-full px-4 py-2">
              <MarathiText
                as="p"
                text={motto}
                className="text-sm font-medium text-white/88"
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
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}

          {stats.length > 0 ? (
            <div className="flex flex-wrap gap-3 pt-2">
              {stats.map((stat) => (
                <div key={`${stat.label}-${stat.value}`} className="tc-stat-chip">
                  <span className="text-sm font-semibold">{stat.value}</span>
                  <span className="text-xs text-[color:rgba(0,30,64,0.72)]">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {aside ? <div className="tc-motion-rise">{aside}</div> : null}
      </div>
    </section>
  );
}
