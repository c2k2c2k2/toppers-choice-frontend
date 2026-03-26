interface AdminFilterBarProps {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  resultSummary?: string | null;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
}

export function AdminFilterBar({
  actions,
  children,
  onSearchValueChange,
  resultSummary,
  searchPlaceholder = "Search by title, slug, code, or content",
  searchValue,
}: Readonly<AdminFilterBarProps>) {
  return (
    <section className="tc-glass rounded-[24px] p-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <label className="tc-form-field">
          <span className="tc-form-label">Search</span>
          <input
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="tc-input"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          {children}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[rgba(0,30,64,0.08)] pt-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[color:var(--muted)]">
          {resultSummary ?? "Filter the current CMS collection."}
        </p>
        {actions ? (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
