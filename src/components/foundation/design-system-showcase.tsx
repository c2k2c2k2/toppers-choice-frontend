import Link from "next/link";
import { ProgressRing } from "@/components/primitives/progress-ring";

const surfaceLayers = [
  {
    title: "Canvas",
    detail: "Breathable editorial background for dense learning content.",
    color: "var(--background)",
  },
  {
    title: "Section layer",
    detail: "Tonal grouping instead of rigid dividers.",
    color: "var(--surface)",
  },
  {
    title: "Component layer",
    detail: "Raised cards with ghost-border restraint.",
    color: "var(--surface-strong)",
  },
] as const;

const practiceSignals = [
  {
    label: "Daily rhythm",
    detail: "Dashboard cadence",
    value: 72,
    accent: "var(--accent-glow)",
  },
  {
    label: "Touch comfort",
    detail: "Student-first targets",
    value: 96,
    accent: "var(--brand-strong)",
  },
  {
    label: "CTA contrast",
    detail: "Amber guidance",
    value: 84,
    accent: "var(--accent-public)",
  },
] as const;

export function DesignSystemShowcase() {
  return (
    <section className="tc-card rounded-[32px] p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="tc-kicker" style={{ color: "var(--brand)" }}>
            Academic atelier
          </p>
          <h2 className="tc-display mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Stitch-led design primitives now define the shared shell.
          </h2>
          <p className="tc-muted mt-3 text-sm leading-7 md:text-base">
            The foundation follows the delivered landing, dashboard, and
            practice-center references: editorial spacing, glass navigation,
            tonal cards, and warm call-to-action contrast instead of a generic
            LMS kit.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/" className="tc-button-primary">
            Explore study materials
          </Link>
          <Link href="/student" className="tc-button-secondary">
            Open the student shell
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-4 md:grid-cols-3">
          {surfaceLayers.map((layer) => (
            <article key={layer.title} className="tc-panel rounded-[24px] p-4">
              <div
                className="tc-swatch"
                style={{ backgroundColor: layer.color }}
              />
              <p className="mt-4 text-lg font-semibold text-[color:var(--brand)]">
                {layer.title}
              </p>
              <p className="tc-muted mt-2 text-sm leading-6">
                {layer.detail}
              </p>
            </article>
          ))}
        </div>

        <aside className="tc-panel rounded-[28px] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="tc-overline">Dashboard utility</p>
              <h3 className="tc-display mt-2 text-2xl font-semibold tracking-tight">
                Practice-center rhythm
              </h3>
            </div>
            <span className="tc-code-chip">glass nav + tonal cards</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {practiceSignals.map((signal) => (
              <ProgressRing
                key={signal.label}
                accent={signal.accent}
                detail={signal.detail}
                label={signal.label}
                value={signal.value}
              />
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
