export function AdminInlineNotice({
  children,
  tone = "info",
}: Readonly<{
  children: React.ReactNode;
  tone?: "info" | "success" | "warning";
}>) {
  const palette =
    tone === "success"
      ? "border-[rgba(0,51,102,0.14)] bg-[rgba(0,51,102,0.06)] text-[color:var(--brand)]"
      : tone === "warning"
        ? "border-[rgba(225,134,0,0.18)] bg-[rgba(255,248,239,0.9)] text-[color:var(--brand)]"
        : "border-[rgba(0,30,64,0.08)] bg-[rgba(255,255,255,0.8)] text-[color:var(--muted)]";

  return (
    <div
      aria-live={tone === "warning" ? "assertive" : "polite"}
      className={["rounded-[20px] border px-4 py-3 text-sm leading-6", palette].join(" ")}
      role={tone === "warning" ? "alert" : "status"}
    >
      {children}
    </div>
  );
}
