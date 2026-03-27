interface AdminTableColumn<Row> {
  className?: string;
  header: string;
  render: (row: Row) => React.ReactNode;
}

export function AdminDataTable<Row>({
  columns,
  emptyState,
  getRowId,
  onRowClick,
  rows,
  selectedRowId,
}: Readonly<{
  columns: AdminTableColumn<Row>[];
  emptyState: React.ReactNode;
  getRowId: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  rows: Row[];
  selectedRowId?: string | null;
}>) {
  if (rows.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/88 shadow-[var(--shadow-soft)]">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[rgba(0,30,64,0.03)] text-left">
              {columns.map((column) => (
                <th
                  key={column.header}
                  className={[
                    "px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--muted)]",
                    column.className ?? "",
                  ].join(" ")}
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const rowId = getRowId(row);

              return (
                <tr
                  key={rowId}
                  aria-selected={selectedRowId === rowId}
                  className={[
                    "border-t border-[rgba(0,30,64,0.06)] align-top transition-colors hover:bg-[rgba(255,255,255,0.86)]",
                    onRowClick ? "cursor-pointer focus-within:bg-[rgba(0,51,102,0.06)]" : "",
                  ].join(" ")}
                  data-selected={selectedRowId === rowId}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onRowClick(row);
                          }
                        }
                      : undefined
                  }
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((column, index) => (
                    <td
                      key={`${rowId}-${column.header}`}
                      className={[
                        "px-4 py-4 text-sm text-[color:var(--foreground)]",
                        onRowClick && index === 0 ? "font-medium" : "",
                        selectedRowId === rowId ? "bg-[rgba(0,51,102,0.04)]" : "",
                        column.className ?? "",
                      ].join(" ")}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
