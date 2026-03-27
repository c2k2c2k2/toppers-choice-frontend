import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Access Required",
  description:
    "This page requires an admin login with the right access.",
};

export default function AdminForbiddenPage() {
  return (
    <section className="tc-card mx-auto w-full max-w-3xl rounded-[32px] p-6 md:p-8">
      <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
        Admin access
      </p>
      <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
        This login cannot open that page.
      </h1>
      <p className="tc-muted mt-4 max-w-2xl text-base leading-7">
        Sign in with an admin account that has the required access, or switch to
        the student login if you opened the wrong panel.
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
