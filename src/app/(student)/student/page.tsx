import { FoundationStatusCard } from "@/components/foundation/foundation-status-card";
import { PwaReadinessCard } from "@/components/foundation/pwa-readiness-card";
import { ProgressRing } from "@/components/primitives/progress-ring";
import { EmptyState } from "@/components/primitives/empty-state";

export default function StudentHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="tc-hero rounded-[32px] p-6 md:p-7">
        <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
          Student shell foundation
        </p>
        <div className="mt-4 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="tc-display text-3xl font-semibold tracking-tight md:text-4xl">
              The student surface now carries a protected installable shell.
            </h1>
            <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
              F04 keeps the stitch-inspired dashboard rhythm from the earlier
              foundation work, but adds the real session bootstrap and guarded
              student routing that later notes, practice, tests, and payments
              will sit behind.
            </p>
          </div>
          <div className="tc-glass rounded-[28px] p-5">
            <p className="tc-overline" style={{ color: "rgba(248, 249, 250, 0.76)" }}>
              Dashboard cues
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <ProgressRing
                value={68}
                label="Resume flows"
                detail="Hero-ready"
                accent="var(--accent-glow)"
              />
              <ProgressRing
                value={84}
                label="Touch targets"
                detail="48px+"
                accent="var(--accent-student)"
              />
              <ProgressRing
                value={76}
                label="Install path"
                detail="Student-first"
                accent="var(--accent-public)"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <FoundationStatusCard surface="student" />
        <PwaReadinessCard surface="student" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <EmptyState
          eyebrow="Upcoming student work"
          title="Dashboard, catalog, and announcements start in F05."
          description="The mobile-first shell now boots behind student-only auth so we can layer server-state queries and entitlements without revisiting the route architecture."
        />
        <EmptyState
          eyebrow="Auth milestone"
          title="Guarded routing is live before the real learning modules arrive."
          description="That keeps notes, practice, tests, and payments ready to plug into a stable student-only surface instead of bolting auth onto feature routes later."
        />
      </div>
    </div>
  );
}
