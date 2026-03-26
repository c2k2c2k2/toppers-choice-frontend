export function AdminPageHeader({
  actions,
  description,
  eyebrow,
  title,
}: Readonly<{
  actions?: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}>) {
  return (
    <section className="tc-card rounded-[28px] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="tc-kicker" style={{ color: "var(--accent-admin)" }}>
            {eyebrow ?? "Admin workspace"}
          </p>
          <h1 className="tc-display mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="tc-muted mt-3 text-sm leading-7 md:text-base">
            {description}
          </p>
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}
