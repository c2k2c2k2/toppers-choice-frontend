import {
  MARATHI_FONT_CLASSES,
  extractTextFromHtml,
  getLikelyLegacyMarathiFontKey,
  getMarathiFontKeyFromHint,
  type MarathiEncodedFontKey,
} from "@/lib/marathi"

export type AdminRichFontChoice =
  | "auto"
  | "unicode"
  | MarathiEncodedFontKey

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function hasHtmlMarkup(value: string | null | undefined) {
  if (!value) {
    return false
  }

  return /<[^>]+>/.test(value)
}

export function htmlToPlainText(value: string | null | undefined) {
  if (!value) {
    return ""
  }

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, "\n")
    .replace(/<script[\s\S]*?<\/script>/gi, "\n")
    .replace(
      /<(?:span|div)\b[^>]*data-question-math-(?:inline|block)=(["'])([\s\S]*?)\1[^>]*>[\s\S]*?<\/(?:span|div)>/gi,
      (_match, _quote, latex) => latex,
    )
    .replace(/<(?:br|hr)\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|section|article|li|blockquote|h1|h2|h3|h4|h5|h6)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function inferAdminRichFontChoice(
  value: string | null | undefined,
): AdminRichFontChoice {
  const normalized = value?.trim() ?? ""
  if (!normalized) {
    return "auto"
  }

  const hintedFont = getMarathiFontKeyFromHint(normalized)
  if (hintedFont) {
    return hintedFont
  }

  const fontHint = getLikelyLegacyMarathiFontKey(
    hasHtmlMarkup(normalized) ? extractTextFromHtml(normalized) : normalized,
  )

  return fontHint ?? "auto"
}

export function getAdminRichFontClass(fontChoice: AdminRichFontChoice) {
  if (fontChoice === "unicode") {
    return "font-marathi-unicode"
  }

  if (fontChoice === "auto") {
    return null
  }

  return MARATHI_FONT_CLASSES[fontChoice]
}

function buildParagraphHtml(value: string) {
  const paragraphs = value
    .replace(/\r/g, "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) {
    return ""
  }

  return paragraphs
    .map((paragraph) => {
      return `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`
    })
    .join("")
}

function buildWrappedHtml(
  innerHtml: string,
  fontChoice: AdminRichFontChoice,
  wrapper: "div" | "span" = "div",
) {
  if (!innerHtml.trim()) {
    return ""
  }

  if (fontChoice === "auto" || fontChoice === "unicode") {
    return innerHtml
  }

  const fontClass = MARATHI_FONT_CLASSES[fontChoice]
  return `<${wrapper} class="${fontClass}" data-marathi-font="${fontChoice}">${innerHtml}</${wrapper}>`
}

export function serializeAdminPlainTextValue(
  value: string,
  options?: {
    fontChoice?: AdminRichFontChoice
    preserveParagraphs?: boolean
    wrapper?: "div" | "span"
  },
) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  const fontChoice = options?.fontChoice ?? "auto"
  if (fontChoice === "auto" && !options?.preserveParagraphs) {
    return trimmed
  }

  const html = options?.preserveParagraphs
    ? buildParagraphHtml(trimmed)
    : escapeHtml(trimmed)

  return buildWrappedHtml(html, fontChoice, options?.wrapper ?? "div")
}

function unwrapRichFontWrapper(
  value: string,
): {
  fontChoice: AdminRichFontChoice
  innerHtml: string
} {
  const matchedWrapper = value.match(
    /^<(div|span)\b[^>]*data-marathi-font=["'](shree-dev|surekh|sulekha)["'][^>]*>([\s\S]*)<\/\1>$/i,
  )

  if (!matchedWrapper) {
    return {
      fontChoice: inferAdminRichFontChoice(value),
      innerHtml: value,
    }
  }

  const [, , rawFontChoice, innerHtml] = matchedWrapper

  return {
    fontChoice:
      (rawFontChoice === "sulekha" ? "surekh" : rawFontChoice) as AdminRichFontChoice,
    innerHtml,
  }
}

export function deserializeAdminPlainTextValue(
  value: string | null | undefined,
): {
  fontChoice: AdminRichFontChoice
  text: string
} {
  const normalized = value?.trim() ?? ""
  if (!normalized) {
    return {
      fontChoice: "auto",
      text: "",
    }
  }

  const unwrapped = unwrapRichFontWrapper(normalized)
  return {
    fontChoice: unwrapped.fontChoice,
    text: hasHtmlMarkup(unwrapped.innerHtml)
      ? htmlToPlainText(unwrapped.innerHtml)
      : unwrapped.innerHtml,
  }
}

export function serializeAdminHtmlValue(
  html: string,
  fontChoice: AdminRichFontChoice,
) {
  const normalized = html.trim()
  if (!normalized) {
    return ""
  }

  return buildWrappedHtml(normalized, fontChoice, "div")
}

export function deserializeAdminHtmlValue(
  value: string | null | undefined,
): {
  fontChoice: AdminRichFontChoice
  html: string
} {
  const normalized = value?.trim() ?? ""
  if (!normalized) {
    return {
      fontChoice: "auto",
      html: "",
    }
  }

  const unwrapped = unwrapRichFontWrapper(normalized)

  if (hasHtmlMarkup(unwrapped.innerHtml)) {
    return {
      fontChoice: unwrapped.fontChoice,
      html: unwrapped.innerHtml,
    }
  }

  return {
    fontChoice:
      unwrapped.fontChoice === "auto"
        ? getLikelyLegacyMarathiFontKey(unwrapped.innerHtml) ?? "auto"
        : unwrapped.fontChoice,
    html: buildParagraphHtml(unwrapped.innerHtml),
  }
}

export function readStructuredDocumentHtml(value: unknown): string {
  if (!value) {
    return ""
  }

  if (typeof value === "string") {
    return buildParagraphHtml(value)
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => readStructuredDocumentHtml(entry))
      .filter(Boolean)
      .join("")
  }

  if (!isRecord(value)) {
    return ""
  }

  if (typeof value.html === "string" && value.html.trim()) {
    return value.html
  }

  if (typeof value.text === "string" && value.text.trim()) {
    return buildParagraphHtml(value.text)
  }

  if (Array.isArray(value.blocks)) {
    return value.blocks
      .map((block) => {
        if (typeof block === "string") {
          return `<p>${escapeHtml(block)}</p>`
        }

        if (!isRecord(block)) {
          return ""
        }

        const blockType =
          typeof block.type === "string" ? block.type.toLowerCase() : "paragraph"
        const title = typeof block.title === "string" ? block.title.trim() : ""
        const text =
          typeof block.text === "string"
            ? block.text.trim()
            : typeof block.content === "string"
              ? block.content.trim()
              : typeof block.body === "string"
                ? block.body.trim()
                : ""
        const html =
          typeof block.html === "string"
            ? block.html.trim()
            : typeof block.contentHtml === "string"
              ? block.contentHtml.trim()
              : ""

        if (html) {
          return html
        }

        if (blockType === "divider") {
          return "<hr />"
        }

        if (
          blockType === "list" ||
          blockType === "bullets" ||
          blockType === "ordered-list" ||
          blockType === "steps"
        ) {
          const items = Array.isArray(block.items)
            ? block.items
                .map((item) => {
                  if (typeof item === "string") {
                    return item.trim()
                  }

                  if (!isRecord(item)) {
                    return ""
                  }

                  if (typeof item.text === "string") {
                    return item.text.trim()
                  }

                  if (typeof item.title === "string") {
                    return item.title.trim()
                  }

                  return ""
                })
                .filter(Boolean)
            : []

          const listTag = blockType === "ordered-list" ? "ol" : "ul"
          return items.length > 0
            ? `<${listTag}>${items
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}</${listTag}>`
            : ""
        }

        if (
          blockType === "heading" ||
          blockType === "title" ||
          blockType === "h1" ||
          blockType === "h2" ||
          blockType === "h3"
        ) {
          const level =
            blockType === "h1"
              ? "h1"
              : blockType === "h3"
                ? "h3"
                : "h2"
          const headingText = title || text
          return headingText ? `<${level}>${escapeHtml(headingText)}</${level}>` : ""
        }

        const combined = [title, text].filter(Boolean).join("\n\n")
        return combined ? buildParagraphHtml(combined) : ""
      })
      .filter(Boolean)
      .join("")
  }

  const localizedValue =
    value["mr-IN"] ??
    value["en-IN"] ??
    value.mr ??
    value.en ??
    value.default ??
    value.content ??
    value.body

  if (localizedValue) {
    return readStructuredDocumentHtml(localizedValue)
  }

  return ""
}

export function buildStructuredDocumentFromHtml(html: string) {
  const normalized = normalizeHtmlForDocument(html)

  if (!normalized) {
    return undefined
  }

  return {
    blocks: [
      {
        type: "rich-text",
        html: normalized,
      },
    ],
  }
}

function normalizeHtmlForDocument(value: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  if (
    /<(?:p|div|section|article|ul|ol|blockquote|h1|h2|h3|h4|h5|h6|table|thead|tbody|tfoot|tr|td|th|hr|pre|span|code)\b/i.test(
      trimmed,
    ) ||
    /data-question-math-(?:inline|block)|data-question-equation=/i.test(trimmed)
  ) {
    return trimmed
  }

  return buildParagraphHtml(htmlToPlainText(trimmed))
}

export function readObjectTextValue(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  const candidate = value?.[key]
  return typeof candidate === "string" ? candidate : ""
}

export function readObjectBooleanValue(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  return typeof value?.[key] === "boolean" ? (value[key] as boolean) : false
}

export function readObjectNumberValue(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  return typeof value?.[key] === "number" && Number.isFinite(value[key])
    ? (value[key] as number)
    : null
}

export function readObjectStringArray(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  const candidate = value?.[key]

  if (!Array.isArray(candidate)) {
    return []
  }

  return candidate.filter((entry): entry is string => typeof entry === "string")
}

export function readObjectRecordArray(
  value: Record<string, unknown> | null | undefined,
  key: string,
) {
  const candidate = value?.[key]

  if (!Array.isArray(candidate)) {
    return []
  }

  return candidate.filter(isRecord)
}
