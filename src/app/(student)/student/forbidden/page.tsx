import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Student Access Required",
  description:
    "This route belongs to the protected Topper's Choice student workspace.",
};

export default function StudentForbiddenPage() {
  return (
    <section className="tc-card mx-auto w-full max-w-3xl rounded-[32px] p-6 md:p-8">
      <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
        Student route
      </p>
      <h1 className="tc-display mt-4 text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl">
        This workspace is reserved for student sessions.
      </h1>
      <p className="tc-muted mt-4 max-w-2xl text-base leading-7">
        If you signed in as a student, return to the student login page and try
        again. If you were trying to access internal tools, use the admin login
        instead.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/student/login" className="tc-button-primary">
          Student login
        </Link>
        <Link href="/admin/login" className="tc-button-secondary">
          Admin login
        </Link>
      </div>
    </section>
  );
}
