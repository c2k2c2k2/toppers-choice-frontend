import { AssetImage } from "@/components/primitives/asset-image";
import { QuestionLocalizedRichTextRenderer } from "@/components/questions/question-rich-text-renderer";
import {
  getAssessmentPreferredLocaleKeys,
  getAssessmentQuestionMediaReferences,
  type AssessmentDocument,
  type AssessmentQuestion,
} from "@/lib/assessment";

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

export function AssessmentReviewPanel({
  correctAnswerJson,
  explanationJson,
  question,
}: Readonly<{
  correctAnswerJson: Record<string, unknown> | null;
  explanationJson: AssessmentDocument | null;
  question: AssessmentQuestion;
}>) {
  const localeKeys = getAssessmentPreferredLocaleKeys(question.medium?.name);
  const correctOptionKeys = normalizeStringList(correctAnswerJson?.optionKeys);
  const acceptedAnswers = normalizeStringList(correctAnswerJson?.acceptedAnswers);
  const correctOptions = question.options.filter((option) =>
    correctOptionKeys.includes(option.optionKey),
  );
  const explanationMedia = getAssessmentQuestionMediaReferences(question, {
    usage: "EXPLANATION",
  });

  return (
    <section className="tc-student-card rounded-[24px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="tc-kicker" style={{ color: "var(--accent-student)" }}>
            Review
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[color:var(--brand)]">
            Correct answer and explanation
          </h3>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/76 p-4">
          <p className="tc-overline">Correct answer</p>
          {correctOptions.length > 0 ? (
            <div className="mt-3 grid gap-3">
              {correctOptions.map((option) => {
                const optionMedia = getAssessmentQuestionMediaReferences(question, {
                  optionKey: option.optionKey,
                  usage: "OPTION",
                });

                return (
                  <div
                    key={option.id}
                    className="rounded-[20px] border border-emerald-200 bg-emerald-50/70 px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="tc-code-chip">{option.optionKey}</span>
                      <div className="min-w-0 flex-1 text-[color:var(--brand)]">
                        <QuestionLocalizedRichTextRenderer
                          content={option.contentJson}
                          preferredLocaleKeys={localeKeys}
                        />
                        {optionMedia.length > 0 ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {optionMedia.map((reference) => (
                              <AssetImage
                                key={reference.id}
                                alt={`Correct option ${option.optionKey} media`}
                                asset={reference.fileAsset}
                                className="max-h-52 w-full rounded-[18px] border border-emerald-200 bg-white object-contain"
                              />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : acceptedAnswers.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {acceptedAnswers.map((answer) => (
                <span
                  key={answer}
                  className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700"
                >
                  {answer}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              The backend did not include a structured correct-answer payload for
              this review item.
            </p>
          )}
        </div>

        {explanationJson || explanationMedia.length > 0 ? (
          <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/76 p-4">
            <p className="tc-overline">Explanation</p>
            {explanationJson ? (
              <div className="mt-3 text-[color:var(--brand)]">
                <QuestionLocalizedRichTextRenderer
                  content={explanationJson}
                  preferredLocaleKeys={localeKeys}
                />
              </div>
            ) : null}
            {explanationMedia.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {explanationMedia.map((reference) => (
                  <AssetImage
                    key={reference.id}
                    alt="Explanation media"
                    asset={reference.fileAsset}
                    className="max-h-60 w-full rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white object-contain"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
