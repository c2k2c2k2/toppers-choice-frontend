import type { UpsertEnglishSpeakingSentenceInput } from "@/lib/english-speaking";

export interface ImportedEnglishSpeakingTopicDraft {
  sentences: UpsertEnglishSpeakingSentenceInput[];
  title: string;
}

export function parseImportedEnglishSpeakingTopicDraft(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Paste a topic JSON object or array before importing.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error("Import data must be valid JSON.");
  }

  const source =
    Array.isArray(parsed)
      ? {
          data: parsed,
          document_title: undefined,
        }
      : typeof parsed === "object" && parsed !== null
        ? parsed
        : null;

  if (!source || !("data" in source) || !Array.isArray(source.data)) {
    throw new Error(
      "Import JSON must be an array or an object with a data array.",
    );
  }

  const sentences = source.data.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error("Each imported sentence must be an object.");
    }

    const hindiText =
      typeof item.hindi === "string" ? item.hindi.trim() : "";
    const marathiText =
      typeof item.marathi === "string" ? item.marathi.trim() : "";
    const englishText =
      typeof item.english === "string" ? item.english.trim() : "";

    if (!hindiText || !marathiText || !englishText) {
      throw new Error(
        `Imported sentence ${index + 1} must include hindi, marathi, and english text.`,
      );
    }

    return {
      englishText,
      hindiText,
      marathiText,
      orderIndex: (index + 1) * 10,
    } satisfies UpsertEnglishSpeakingSentenceInput;
  });

  const title =
    "document_title" in source && typeof source.document_title === "string"
      ? source.document_title.trim()
      : "";

  return {
    sentences,
    title,
  } satisfies ImportedEnglishSpeakingTopicDraft;
}
