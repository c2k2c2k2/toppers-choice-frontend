import Link from "next/link";
import {
  buildNoteProgressLabel,
  getNoteAccessDescriptor,
  getOptionalNumber,
} from "@/lib/notes";
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
  const ctaLabel =
    note.access.mode === "LOCKED"
      ? "View access details"
      : note.progress?.lastPageViewed
        ? "Resume reading"
        : note.access.mode === "PREVIEW"
          ? "Start preview"
          : "Start reading";

  return (
    <article className="tc-student-card rounded-[20px] p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="tc-code-chip">{note.subject.name}</span>
            {note.medium ? <span className="tc-code-chip">{note.medium.name}</span> : null}
          </div>
          <h2 className="truncate text-xl font-semibold text-[color:var(--brand)]">
            {note.title}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
            <span>{note.pageCount} pages</span>
            <span aria-hidden="true">·</span>
            <span>{buildNoteProgressLabel(note)}</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span
            className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold uppercase tracking-[0.12em] ${getAccessBadgeClasses(accessDescriptor.tone)}`}
          >
            {previewPageCount
              ? `${previewPageCount} preview`
              : accessDescriptor.label}
          </span>
          <Link href={href} className="tc-button-primary">
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
