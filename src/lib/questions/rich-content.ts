import {
  htmlToPlainText,
  readStructuredDocumentHtml,
} from "@/lib/admin/rich-text";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasStructuredContentShape(value: Record<string, unknown>) {
  return (
    Array.isArray(value.blocks) ||
    typeof value.html === "string" ||
    typeof value.text === "string" ||
    typeof value.contentHtml === "string" ||
    typeof value.content === "string" ||
    typeof value.body === "string"
  );
}

function buildLocaleCandidates(preferredLocaleKeys: string[]) {
  const ordered = new Set<string>();

  preferredLocaleKeys.forEach((key) => {
    const normalized = key.trim();
    if (!normalized) {
      return;
    }

    ordered.add(normalized);
    const shortKey = normalized.split("-")[0];
    if (shortKey) {
      ordered.add(shortKey);
    }
  });

  ["mr-IN", "mr", "en-IN", "en", "default", "content", "body"].forEach(
    (key) => ordered.add(key),
  );

  return Array.from(ordered);
}

function resolveFromContainer(
  container: Record<string, unknown>,
  localeCandidates: string[],
  allowFallback: boolean,
) {
  for (const key of localeCandidates) {
    if (container[key] !== undefined) {
      return container[key];
    }
  }

  if (!allowFallback) {
    return undefined;
  }

  const fallbackKeys = ["mr-IN", "mr", "en-IN", "en"];
  for (const key of fallbackKeys) {
    if (container[key] !== undefined) {
      return container[key];
    }
  }

  return Object.values(container).find((entry) => entry !== undefined);
}

export function resolveQuestionLocalizedValue(
  value: unknown,
  preferredLocaleKeys: string[] = [],
): unknown {
  if (!isRecord(value)) {
    return value;
  }

  if (hasStructuredContentShape(value)) {
    return value;
  }

  const localeCandidates = buildLocaleCandidates(preferredLocaleKeys);
  const directValue = resolveFromContainer(value, localeCandidates, false);
  if (directValue !== undefined) {
    return resolveQuestionLocalizedValue(directValue, preferredLocaleKeys);
  }

  if (isRecord(value.translations)) {
    const translatedValue = resolveFromContainer(
      value.translations,
      localeCandidates,
      true,
    );
    if (translatedValue !== undefined) {
      return resolveQuestionLocalizedValue(
        translatedValue,
        preferredLocaleKeys,
      );
    }
  }

  const fallbackValue = resolveFromContainer(value, localeCandidates, true);
  if (fallbackValue !== undefined && fallbackValue !== value) {
    return resolveQuestionLocalizedValue(fallbackValue, preferredLocaleKeys);
  }

  return value;
}

export function extractQuestionHtml(
  value: unknown,
  preferredLocaleKeys: string[] = [],
) {
  return readStructuredDocumentHtml(
    resolveQuestionLocalizedValue(value, preferredLocaleKeys),
  );
}

export function extractQuestionText(
  value: unknown,
  preferredLocaleKeys: string[] = [],
) {
  return htmlToPlainText(extractQuestionHtml(value, preferredLocaleKeys)).trim();
}

export function hasQuestionRichContent(
  value: unknown,
  preferredLocaleKeys: string[] = [],
) {
  const html = extractQuestionHtml(value, preferredLocaleKeys).trim();
  if (html) {
    return true;
  }

  return extractQuestionText(value, preferredLocaleKeys).length > 0;
}
