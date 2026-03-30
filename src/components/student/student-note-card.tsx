import Link from "next/link";
import {
  buildNoteProgressLabel,
  getNoteAccessDescriptor,
  getOptionalNumber,
} from "@/lib/notes";
import { getOptionalText } from "@/lib/student";
import type { NoteSummary } from "@/lib/notes";

function getAccessBadgeClasses(
  tone: ReturnType<typeof getNoteAccessDescriptor>["tone"],
) {
  switch (tone) {
    case "full":
      return "bg-[rgba(0,51,102,0.12)] text-[color:var(--accent-student)]";
    case "preview":
      return "bg-[rgba(255,184,111,0.22)] text-[color:var(--cta-surface)]";
    default:
      return "bg-[rgba(0,30,64,0.08)] text-[color:var(--muted)]";
  }
}

export function StudentNoteCard({
  href,
  note,
}: Readonly<{
  href: string;
  note: NoteSummary;
}>) {
  const accessDescriptor = getNoteAccessDescriptor(note.access);
  const previewPageCount = getOptionalNumber(note.access.previewPageCount);
  const topicNames = note.topics.slice(0, 2).map((topic) => topic.name);
  const hasMoreTopics = note.topics.length > topicNames.length;
  const ctaLabel =
    note.access.mode === "LOCKED"
      ? "View access details"
      : note.progress?.lastPageViewed
        ? "Resume reading"
        : note.access.mode === "PREVIEW"
          ? "Start preview"
          : "Start reading";

  return (
    <article className="tc-student-card rounded-[28px] p-5 transition-transform duration-200 hover:-translate-y-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tc-code-chip">{note.subject.name}</span>
            <span
              className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] ${getAccessBadgeClasses(accessDescriptor.tone)}`}
            >
              {accessDescriptor.label}
            </span>
          </div>
          <h2 className="tc-display text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
            {note.title}
          </h2>
        </div>

        <div className="tc-student-card-muted rounded-[20px] px-4 py-3 text-right">
          <p className="tc-overline">Pages</p>
          <p className="mt-2 text-2xl font-semibold text-[color:var(--brand)]">
            {note.pageCount}
          </p>
        </div>
      </div>

      <p className="tc-muted mt-4 text-sm leading-6">
        {getOptionalText(note.shortDescription) ??
          getOptionalText(note.description) ??
          accessDescriptor.description}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {topicNames.map((topicName) => (
          <span key={topicName} className="tc-filter-chip px-3 py-2 text-xs">
            {topicName}
          </span>
        ))}
        {hasMoreTopics ? (
          <span className="tc-code-chip">+{note.topics.length - topicNames.length} more</span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="tc-student-card-muted rounded-[22px] px-4 py-3">
          <p className="tc-overline">Reader progress</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--brand)]">
            {buildNoteProgressLabel(note)}
          </p>
        </div>
        <div className="tc-student-card-muted rounded-[22px] px-4 py-3">
          <p className="tc-overline">Entitlement state</p>
          <p className="mt-2 text-sm font-semibold text-[color:var(--brand)]">
            {previewPageCount
              ? `${previewPageCount} preview pages available`
              : accessDescriptor.description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[color:var(--muted)]">
          {note.progress?.updatedAt
            ? `Last synced ${new Intl.DateTimeFormat("en-IN", {
                dateStyle: "medium",
              }).format(new Date(note.progress.updatedAt))}`
            : "Progress starts syncing after the first opened page."}
        </p>
        <Link href={href} className="tc-button-primary">
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
