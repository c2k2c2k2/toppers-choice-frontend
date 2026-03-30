"use client";

import { useMemo } from "react";
import {
  applyMarathiHtmlFontHint,
  resolveMarathiTextPresentation,
} from "@/lib/marathi";
import {
  extractQuestionHtml,
  extractQuestionText,
} from "@/lib/questions/rich-content";

function joinClasses(...values: Array<string | null | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function QuestionRichTextRenderer({
  className,
  fallbackText,
  html,
}: Readonly<{
  className?: string;
  fallbackText?: string | null;
  html?: string | null;
}>) {
  const renderedHtml = useMemo(
    () => (html ? applyMarathiHtmlFontHint(html) : null),
    [html],
  );
  const normalizedFallbackText = fallbackText?.trim() ?? "";
  const fallbackPresentation = useMemo(
    () =>
      normalizedFallbackText
        ? resolveMarathiTextPresentation(normalizedFallbackText)
        : null,
    [normalizedFallbackText],
  );

  if (renderedHtml?.html.trim()) {
    return (
      <div
        className={joinClasses(
          "tc-rich-html",
          renderedHtml.className,
          className,
        )}
        data-marathi-font={renderedHtml.fontKey ?? undefined}
        data-marathi-mode={renderedHtml.mode}
        dangerouslySetInnerHTML={{ __html: renderedHtml.html }}
      />
    );
  }

  if (normalizedFallbackText) {
    return (
      <p
        className={joinClasses(
          "text-sm leading-relaxed",
          fallbackPresentation?.className,
          className,
        )}
        data-marathi-font={fallbackPresentation?.fontKey ?? undefined}
        data-marathi-mode={fallbackPresentation?.mode}
      >
        {normalizedFallbackText}
      </p>
    );
  }

  return null;
}

export function QuestionLocalizedRichTextRenderer({
  className,
  content,
  fallbackText,
  preferredLocaleKeys,
}: Readonly<{
  className?: string;
  content?: unknown;
  fallbackText?: string;
  preferredLocaleKeys?: string[];
}>) {
  const html = extractQuestionHtml(content, preferredLocaleKeys);
  const text =
    extractQuestionText(content, preferredLocaleKeys) || fallbackText || "";

  return (
    <QuestionRichTextRenderer
      className={className}
      fallbackText={text}
      html={html}
    />
  );
}
