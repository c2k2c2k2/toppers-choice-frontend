import Link from "next/link";
import {
  buildStudentPlansHref,
  getPremiumIntentLabel,
  type PremiumIntent,
} from "@/lib/payments";

interface PremiumAccessCardProps {
  badgeLabel?: string;
  description: string;
  hints?: string[];
  intent: PremiumIntent;
  primaryLabel?: string;
  returnTo?: string | null;
  secondaryHref?: string;
  secondaryLabel?: string;
  source: string;
  title: string;
}

export function PremiumAccessCard({
  badgeLabel,
  description,
  hints = [],
  intent,
  primaryLabel = "See plans",
  returnTo,
  secondaryHref,
  secondaryLabel,
  source,
  title,
}: Readonly<PremiumAccessCardProps>) {
  const plansHref = buildStudentPlansHref({
    intent,
    returnTo,
    source,
  });

  return (
    <section className="tc-student-panel rounded-[28px] p-6 md:p-7">
      <p className="tc-kicker" style={{ color: "var(--accent-public)" }}>
        {badgeLabel ?? "Premium access"}
      </p>
      <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="tc-muted mt-3 text-base leading-7">{description}</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="tc-student-chip" data-tone="accent">
          Unlock {getPremiumIntentLabel(intent)}
        </span>
        <span className="tc-student-chip" data-tone="soft">
          Checkout and entitlement refresh live
        </span>
      </div>

      {hints.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {hints.map((hint) => (
            <div
              key={hint}
              className="tc-student-card-muted rounded-[22px] px-4 py-3 text-sm leading-6 text-[color:var(--brand)]"
            >
              {hint}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={plansHref} className="tc-button-primary">
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel ? (
          <Link href={secondaryHref} className="tc-button-secondary">
            {secondaryLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
