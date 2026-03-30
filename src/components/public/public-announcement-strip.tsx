import Link from "next/link";
import { TextContent } from "@/components/primitives/text-content";
import type { CmsAnnouncement } from "@/lib/cms";

const levelAccentMap: Record<string, string> = {
  CRITICAL: "var(--accent-public)",
  INFO: "var(--brand)",
  SUCCESS: "var(--accent-student)",
  WARNING: "var(--accent-public)",
};

export function PublicAnnouncementStrip({
  announcements,
}: Readonly<{
  announcements: CmsAnnouncement[];
}>) {
  if (announcements.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {announcements.slice(0, 3).map((announcement) => (
        <article
          key={announcement.id}
          className="tc-public-surface-muted tc-motion-rise rounded-[28px] p-5"
        >
          <p
            className="tc-overline"
            style={{
              color:
                levelAccentMap[announcement.level] ?? "var(--accent-public)",
            }}
          >
            {announcement.level.toLowerCase()}
          </p>
          <TextContent
            as="h2"
            className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
            value={announcement.title}
          />
          <TextContent
            as="p"
            className="tc-muted mt-3 text-sm leading-6"
            preserveLineBreaks
            value={announcement.body}
          />
          {announcement.linkHref && announcement.linkLabel ? (
            <Link href={announcement.linkHref} className="tc-button-secondary mt-5">
              <TextContent as="span" value={announcement.linkLabel} />
            </Link>
          ) : null}
        </article>
      ))}
    </section>
  );
}
