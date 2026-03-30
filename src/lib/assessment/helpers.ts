import type {
  AssessmentAnswerDraft,
  AssessmentAssetSummary,
  AssessmentDifficulty,
  AssessmentDocument,
  AssessmentQuestion,
  AssessmentQuestionMediaReference,
  AssessmentQuestionOption,
  AssessmentQuestionType,
  AssessmentTaxonomySummary,
} from "@/lib/assessment/types";

function normalizeOptionKeys(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return Array.from(
    new Set(
      input.filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      ),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeAssessmentDraft(
  value: unknown,
): AssessmentAnswerDraft {
  if (!isRecord(value)) {
    return {};
  }

  const text =
    typeof value.text === "string" && value.text.trim().length > 0
      ? value.text.trim()
      : undefined;
  const optionKeys = normalizeOptionKeys(value.optionKeys);

  return {
    optionKeys: optionKeys.length > 0 ? optionKeys : undefined,
    text,
  };
}

export function hasAssessmentDraft(value: AssessmentAnswerDraft | null | undefined) {
  if (!value) {
    return false;
  }

  return Boolean(
    (Array.isArray(value.optionKeys) && value.optionKeys.length > 0) ||
      (typeof value.text === "string" && value.text.trim().length > 0),
  );
}

export function areAssessmentDraftsEqual(
  left: AssessmentAnswerDraft | null | undefined,
  right: AssessmentAnswerDraft | null | undefined,
) {
  const normalizedLeft = normalizeAssessmentDraft(left);
  const normalizedRight = normalizeAssessmentDraft(right);

  return (
    (normalizedLeft.text ?? "") === (normalizedRight.text ?? "") &&
    (normalizedLeft.optionKeys ?? []).join("|") ===
      (normalizedRight.optionKeys ?? []).join("|")
  );
}

export function buildEmptyAssessmentDraft(
  questionType: AssessmentQuestionType,
): AssessmentAnswerDraft {
  if (questionType === "TEXT_INPUT") {
    return {
      text: "",
    };
  }

  return {
    optionKeys: [],
  };
}

function readTaxonomySummary(value: unknown): AssessmentTaxonomySummary | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.code !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.name !== "string"
  ) {
    return null;
  }

  return {
    code: value.code,
    id: value.id,
    name: value.name,
    slug: value.slug,
  };
}

function readQuestionOptions(value: unknown): AssessmentQuestionOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    if (
      typeof item.id !== "string" ||
      typeof item.optionKey !== "string" ||
      typeof item.orderIndex !== "number" ||
      typeof item.createdAt !== "string" ||
      typeof item.updatedAt !== "string"
    ) {
      return [];
    }

    return [
      {
        contentJson: (item.contentJson ?? null) as AssessmentDocument,
        createdAt: item.createdAt,
        id: item.id,
        metaJson: isRecord(item.metaJson) ? item.metaJson : null,
        optionKey: item.optionKey,
        orderIndex: item.orderIndex,
        updatedAt: item.updatedAt,
      },
    ];
  });
}

function readAssessmentAssetSummary(value: unknown): AssessmentAssetSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    typeof value.accessLevel !== "string" ||
    typeof value.contentType !== "string" ||
    typeof value.originalFileName !== "string" ||
    typeof value.protectedDeliveryPath !== "string" ||
    typeof value.publicDeliveryPath !== "string" ||
    typeof value.purpose !== "string" ||
    typeof value.status !== "string"
  ) {
    return null;
  }

  return {
    accessLevel: value.accessLevel as AssessmentAssetSummary["accessLevel"],
    contentType: value.contentType,
    id: value.id,
    originalFileName: value.originalFileName,
    protectedDeliveryPath: value.protectedDeliveryPath,
    publicDeliveryPath: value.publicDeliveryPath,
    purpose: value.purpose as AssessmentAssetSummary["purpose"],
    sizeBytes: typeof value.sizeBytes === "number" ? value.sizeBytes : null,
    status: value.status as AssessmentAssetSummary["status"],
  };
}

function readQuestionMediaReferences(value: unknown): AssessmentQuestionMediaReference[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const fileAsset = readAssessmentAssetSummary(item.fileAsset);
    if (
      typeof item.id !== "string" ||
      typeof item.fileAssetId !== "string" ||
      typeof item.orderIndex !== "number" ||
      typeof item.usage !== "string" ||
      !fileAsset
    ) {
      return [];
    }

    return [
      {
        fileAsset,
        fileAssetId: item.fileAssetId,
        id: item.id,
        localeCode: typeof item.localeCode === "string" ? item.localeCode : null,
        optionKey: typeof item.optionKey === "string" ? item.optionKey : null,
        orderIndex: item.orderIndex,
        usage: item.usage as AssessmentQuestionMediaReference["usage"],
      },
    ];
  });
}

export function readAssessmentQuestion(
  value: unknown,
): AssessmentQuestion | null {
  if (!isRecord(value)) {
    return null;
  }

  const examTrack = readTaxonomySummary(value.examTrack);
  const subject = readTaxonomySummary(value.subject);
  if (
    typeof value.id !== "string" ||
    typeof value.type !== "string" ||
    typeof value.difficulty !== "string" ||
    !examTrack ||
    !subject
  ) {
    return null;
  }

  return {
    code: typeof value.code === "string" ? value.code : null,
    difficulty: value.difficulty as AssessmentDifficulty,
    examTrack,
    id: value.id,
    mediaReferences: readQuestionMediaReferences(value.mediaReferences),
    medium: readTaxonomySummary(value.medium),
    metadataJson: isRecord(value.metadataJson) ? value.metadataJson : null,
    options: readQuestionOptions(value.options),
    statementJson: (value.statementJson ?? null) as AssessmentDocument,
    subject,
    topic: readTaxonomySummary(value.topic),
    type: value.type as AssessmentQuestionType,
  };
}

export function getAssessmentQuestionMediaReferences(
  question: AssessmentQuestion,
  input: {
    optionKey?: string | null;
    usage: AssessmentQuestionMediaReference["usage"];
  },
) {
  return question.mediaReferences
    .filter((reference) => {
      if (reference.usage !== input.usage) {
        return false;
      }

      if (input.usage === "OPTION") {
        return reference.optionKey === (input.optionKey ?? null);
      }

      return true;
    })
    .sort((left, right) => left.orderIndex - right.orderIndex);
}

export function getAssessmentPreferredLocaleKeys(mediumName?: string | null) {
  const normalized = mediumName?.trim().toLowerCase() ?? "";

  if (normalized.includes("english")) {
    return ["en-IN", "en", "mr-IN", "mr"];
  }

  if (normalized.includes("marathi")) {
    return ["mr-IN", "mr", "en-IN", "en"];
  }

  return ["mr-IN", "en-IN", "mr", "en"];
}

export function getAssessmentQuestionStatusTone(
  input: {
    answeredAt?: string | null;
    isCorrect?: boolean | null;
    revealedAt?: string | null;
  } | null,
) {
  if (!input) {
    return {
      chipLabel: "New question",
      tone: "idle" as const,
    };
  }

  if (input.revealedAt) {
    return {
      chipLabel: "Answer revealed",
      tone: "warning" as const,
    };
  }

  if (!input.answeredAt) {
    return {
      chipLabel: "Draft in progress",
      tone: "idle" as const,
    };
  }

  return {
    chipLabel: input.isCorrect ? "Answered correctly" : "Needs revision",
    tone: input.isCorrect ? "success" as const : "danger" as const,
  };
}

export function formatAssessmentDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

export function formatAssessmentDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getAssessmentAnswerDraftLabel(draft: AssessmentAnswerDraft) {
  if (typeof draft.text === "string" && draft.text.trim().length > 0) {
    return draft.text.trim();
  }

  if (Array.isArray(draft.optionKeys) && draft.optionKeys.length > 0) {
    return draft.optionKeys.join(", ");
  }

  return "Not answered";
}
