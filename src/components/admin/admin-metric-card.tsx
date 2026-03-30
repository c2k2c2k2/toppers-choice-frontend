export function AdminMetricCard({
  detail,
  label,
  value,
}: Readonly<{
  detail: string;
  label: string;
  value: string | number;
}>) {
  return (
    <section className="tc-admin-frame-subtle rounded-[24px] p-5">
      <p className="tc-overline">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-[color:var(--brand)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[color:var(--muted)]">{detail}</p>
    </section>
  );
}
