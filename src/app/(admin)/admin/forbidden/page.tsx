import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Access Required",
  description:
    "This route belongs to the permission-aware Topper's Choice admin surface.",
};

export default function AdminForbiddenPage() {
  return (
    <section className="tc-card mx-auto w-full max-w-3xl rounded-[32px] p-6 md:p-8">
      <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
        Admin route
      </p>
      <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
        Your current session cannot open this admin route.
      </h1>
      <p className="tc-muted mt-4 max-w-2xl text-base leading-7">
        The backend permission model is active for the admin surface. Sign in
        with an admin account that has the required role access, or switch back
        to the student workspace if you signed into the wrong surface.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/admin/login" className="tc-button-primary">
          Admin login
        </Link>
        <Link href="/student/login" className="tc-button-secondary">
          Student login
        </Link>
      </div>
    </section>
  );
}
