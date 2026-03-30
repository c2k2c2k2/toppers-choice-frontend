import Link from "next/link";

interface AdminRouteTabItem {
  description?: string;
  href: string;
  label: string;
}

export function AdminRouteTabs({
  activeHref,
  items,
}: Readonly<{
  activeHref: string;
  items: AdminRouteTabItem[];
}>) {
  return (
    <section className="tc-admin-frame-subtle rounded-[24px] p-2">
      <div className="grid gap-2 md:grid-cols-2 xl:max-w-[34rem]">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[20px] border px-4 py-4 transition"
            style={{
              background:
                activeHref === item.href
                  ? "rgba(0, 51, 102, 0.08)"
                  : "rgba(255, 255, 255, 0.88)",
              borderColor:
                activeHref === item.href
                  ? "rgba(0, 51, 102, 0.14)"
                  : "rgba(0, 30, 64, 0.08)",
              color: "var(--brand)",
            }}
          >
            <p className="font-semibold">{item.label}</p>
            {item.description ? (
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                {item.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
