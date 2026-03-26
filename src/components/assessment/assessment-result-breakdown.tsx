import { isRecord } from "@/lib/assessment";

interface BreakdownRow {
  answeredCount: number;
  correctCount: number;
  label: string;
  maxScore: number;
  percentage: number;
  questionCount: number;
  score: number;
  skippedCount: number;
  wrongCount: number;
}

function readBreakdownRows(
  value: Record<string, unknown> | null,
  key: string,
): BreakdownRow[] {
  const candidate = value?.[key];

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const label =
      typeof entry.label === "string"
        ? entry.label
        : isRecord(entry.item) && typeof entry.item.name === "string"
          ? entry.item.name
          : null;

    if (!label) {
      return [];
    }

    return [
      {
        answeredCount:
          typeof entry.answeredCount === "number" ? entry.answeredCount : 0,
        correctCount:
          typeof entry.correctCount === "number" ? entry.correctCount : 0,
        label,
        maxScore: typeof entry.maxScore === "number" ? entry.maxScore : 0,
        percentage: typeof entry.percentage === "number" ? entry.percentage : 0,
        questionCount:
          typeof entry.questionCount === "number" ? entry.questionCount : 0,
        score: typeof entry.score === "number" ? entry.score : 0,
        skippedCount:
          typeof entry.skippedCount === "number" ? entry.skippedCount : 0,
        wrongCount: typeof entry.wrongCount === "number" ? entry.wrongCount : 0,
      },
    ];
  });
}

function BreakdownSection({
  rows,
  title,
}: Readonly<{
  rows: BreakdownRow[];
  title: string;
}>) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/76 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="tc-overline">{title}</p>
          <h3 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
            Performance split
          </h3>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-[20px] border border-[rgba(0,30,64,0.08)] bg-[rgba(247,249,250,0.86)] px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[color:var(--brand)]">{row.label}</p>
                <p className="mt-1 text-sm text-[color:var(--muted)]">
                  {row.correctCount} correct, {row.wrongCount} wrong,{" "}
                  {row.skippedCount} skipped
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-[color:var(--brand)]">
                  {row.percentage}%
                </p>
                <p className="text-sm text-[color:var(--muted)]">
                  {row.score}/{row.maxScore} marks
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AssessmentResultBreakdown({
  breakdown,
}: Readonly<{
  breakdown: Record<string, unknown> | null;
}>) {
  const bySubject = readBreakdownRows(breakdown, "bySubject");
  const byTopic = readBreakdownRows(breakdown, "byTopic");
  const byDifficulty = readBreakdownRows(breakdown, "byDifficulty");
  const byQuestionType = readBreakdownRows(breakdown, "byQuestionType");

  if (
    bySubject.length === 0 &&
    byTopic.length === 0 &&
    byDifficulty.length === 0 &&
    byQuestionType.length === 0
  ) {
    return null;
  }

  return (
    <div className="grid gap-4">
      <BreakdownSection rows={bySubject} title="By subject" />
      <BreakdownSection rows={byTopic} title="By topic" />
      <BreakdownSection rows={byDifficulty} title="By difficulty" />
      <BreakdownSection rows={byQuestionType} title="By question type" />
    </div>
  );
}
