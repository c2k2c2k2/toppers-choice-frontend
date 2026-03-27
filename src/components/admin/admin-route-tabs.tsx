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
    <section className="tc-glass rounded-[24px] p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-none xl:grid-flow-col">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-[22px] border px-4 py-4 transition"
            style={{
              background:
                activeHref === item.href
                  ? "rgba(0, 51, 102, 0.1)"
                  : "rgba(255, 255, 255, 0.76)",
              borderColor:
                activeHref === item.href
                  ? "rgba(0, 51, 102, 0.16)"
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
