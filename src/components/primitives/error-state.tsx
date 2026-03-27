interface ErrorStateProps {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong.",
  description = "The shared surface could not complete its current request.",
  retryLabel = "Try again",
  onRetry,
}: Readonly<ErrorStateProps>) {
  return (
    <section
      aria-live="assertive"
      className="rounded-[28px] p-6 shadow-[var(--shadow-soft)]"
      role="alert"
      style={{
        background:
          "linear-gradient(180deg, rgba(255, 245, 240, 0.96) 0%, rgba(255, 250, 246, 0.98) 100%)",
        border: "1px solid rgba(225, 134, 0, 0.18)",
      }}
    >
      <p className="tc-kicker" style={{ color: "var(--accent-public)" }}>
        Error state
      </p>
      <h2 className="tc-display mt-3 text-2xl font-semibold tracking-tight text-[color:var(--brand)]">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          aria-label={retryLabel}
          onClick={onRetry}
          className="tc-button-primary mt-5"
        >
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
