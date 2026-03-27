"use client";

export function AdminPagination({
  currentPage,
  onPageChange,
  pageSize,
  totalItems,
}: Readonly<{
  currentPage: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  totalItems: number;
}>) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, totalItems);

  return (
    <div className="tc-glass rounded-[22px] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[color:var(--muted)]">
          Showing {startItem}-{endItem} of {totalItems}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="tc-button-secondary"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
          >
            Previous
          </button>
          <span className="tc-code-chip">
            Page {safePage} / {totalPages}
          </span>
          <button
            type="button"
            className="tc-button-secondary"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
