import Link from "next/link";

interface EmptyStateProps {
  eyebrow?: string;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function EmptyState({
  eyebrow = "Placeholder",
  title,
  description,
  ctaHref,
  ctaLabel,
}: Readonly<EmptyStateProps>) {
  return (
    <section
      aria-live="polite"
      className="tc-panel rounded-[28px] p-6"
      role="status"
    >
      <p className="tc-kicker" style={{ color: "var(--muted)" }}>
        {eyebrow}
      </p>
      <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="tc-muted mt-3 max-w-2xl text-sm leading-6">
        {description}
      </p>
      {ctaHref && ctaLabel ? (
        <Link
          aria-label={ctaLabel}
          href={ctaHref}
          className="tc-button-secondary mt-5"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </section>
  );
}
