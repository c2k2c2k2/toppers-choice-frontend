interface LoadingStateProps {
  title?: string;
  description?: string;
}

export function LoadingState({
  title = "Preparing the application shell",
  description = "Shared providers, route groups, and placeholder surfaces are loading.",
}: Readonly<LoadingStateProps>) {
  return (
    <section className="tc-glass rounded-[28px] p-6">
      <div className="flex items-start gap-4">
        <div className="tc-panel flex h-12 w-12 items-center justify-center rounded-2xl">
          <span className="h-5 w-5 animate-pulse rounded-full bg-[color:var(--brand)]" />
        </div>
        <div className="space-y-2">
          <p className="tc-kicker" style={{ color: "var(--brand)" }}>
            Loading
          </p>
          <h2 className="tc-display text-2xl font-semibold tracking-tight">
            {title}
          </h2>
          <p className="tc-muted max-w-2xl text-sm leading-6">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
