import Link from "next/link";
import { buildNoteProgressLabel } from "@/lib/notes";
import type { NoteSummary } from "@/lib/notes";

export function StudentNoteCard({
  href,
  note,
}: Readonly<{
  href: string;
  note: NoteSummary;
}>) {
  return (
    <article className="tc-student-card rounded-[18px] px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="tc-code-chip">{note.subject.name}</span>
            {note.medium ? <span className="tc-code-chip">{note.medium.name}</span> : null}
          </div>
          <h2 className="line-clamp-2 text-lg font-semibold leading-6 text-[color:var(--brand)]">
            {note.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[color:var(--muted)]">
            <span>{note.pageCount} pages</span>
            <span aria-hidden="true">·</span>
            <span>{buildNoteProgressLabel(note)}</span>
          </div>
        </div>

        <div className="flex shrink-0">
          <Link href={href} className="tc-button-primary px-5 py-2.5">
            Read
          </Link>
        </div>
      </div>
    </article>
  );
}
