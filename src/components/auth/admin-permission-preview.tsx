"use client";

import { Can } from "@/components/auth/route-guards";
import { useAuthSession } from "@/lib/auth";
import { EmptyState } from "@/components/primitives/empty-state";

export function AdminPermissionPreview() {
  const authSession = useAuthSession();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Can
        permission="admin.roles.read"
        fallback={
          <EmptyState
            eyebrow="Permission gate"
            title="Role-management UI is currently hidden."
            description="This session does not include `admin.roles.read`, so the frontend keeps the related admin preview block out of view."
          />
        }
      >
        <section className="tc-card rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Permission gate
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight">
            Roles and access tooling can render.
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            This preview card only renders when the session includes
            `admin.roles.read`, proving the shared permission helpers are now
            active for admin UI decisions.
          </p>
        </section>
      </Can>

      <Can
        anyPermissions={["content.cms.read", "content.notes.read"]}
        fallback={
          <EmptyState
            eyebrow="Content visibility"
            title="Content admin previews stay hidden."
            description="This session does not currently expose content-focused permissions, so the admin dashboard avoids showing misleading controls."
          />
        }
      >
        <section className="tc-panel rounded-[28px] p-6">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            Content visibility
          </p>
          <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
            Content and CMS modules can light up progressively.
          </h2>
          <p className="tc-muted mt-3 text-sm leading-6">
            The current session exposes{" "}
            {authSession.access?.effectivePermissionKeys.length ?? 0} effective
            permissions, and content-facing modules can now decide whether to
            render or hold back without encoding policy logic in page code.
          </p>
        </section>
      </Can>
    </div>
  );
}
