import { AdminPermissionPreview } from "@/components/auth/admin-permission-preview";
import { MarathiFoundationCard } from "@/components/foundation/marathi-foundation-card";
import { FoundationStatusCard } from "@/components/foundation/foundation-status-card";
import { EmptyState } from "@/components/primitives/empty-state";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="tc-card rounded-[28px] p-6">
        <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
          Admin shell foundation
        </p>
        <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Admin routes now share the same tonal system and Marathi content rules.
        </h1>
        <p className="tc-muted mt-4 max-w-3xl text-base leading-7">
          The admin surface still stays intentionally lightweight, but it now
          runs behind the shared auth bootstrap, route guards, and
          permission-aware UI gates that later CRUD modules will rely on.
        </p>
      </section>

      <FoundationStatusCard surface="admin" />
      <AdminPermissionPreview />
      <MarathiFoundationCard />

      <div className="grid gap-6 xl:grid-cols-2">
        <EmptyState
          eyebrow="Upcoming admin work"
          title="Shared CRUD scaffolding begins in F10."
          description="The shell is already segmented for content, users, analytics, and operations so later admin routes can slot in without a rewrite."
        />
        <EmptyState
          eyebrow="Contract-first note"
          title="Permission gating stays backend-driven."
          description="The frontend now restores admin sessions and hides gated UI from insufficient sessions, while the backend remains the source of truth for the actual permission model."
        />
      </div>
    </div>
  );
}
