interface ProgressRingProps {
  accent?: string
  detail?: string
  label: string
  value: number
}

export function ProgressRing({
  accent = "var(--accent-glow)",
  detail,
  label,
  value,
}: Readonly<ProgressRingProps>) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const boundedValue = Math.min(100, Math.max(0, value))
  const strokeOffset =
    circumference - (boundedValue / 100) * circumference

  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="var(--surface-highest)"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={accent}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            fill="transparent"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-[color:var(--brand)]">
          {boundedValue}%
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[color:var(--brand)]">
        {label}
      </p>
      {detail ? (
        <p className="tc-muted mt-1 text-xs leading-5">{detail}</p>
      ) : null}
    </div>
  )
}
