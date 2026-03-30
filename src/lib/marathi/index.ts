import katex from "katex"

export type MarathiEncodedFontKey = "shree-dev" | "surekh"

export type MarathiRenderMode = "plain" | "unicode" | "legacy-encoded"

export const DEFAULT_MARATHI_ENCODED_FONT: MarathiEncodedFontKey = "shree-dev"
export const QUESTION_MATH_INLINE_ATTR = "data-question-math-inline"
export const QUESTION_MATH_BLOCK_ATTR = "data-question-math-block"
export const LEGACY_QUESTION_EQUATION_ATTR = "data-question-equation"

export const MARATHI_FONT_LABELS: Record<MarathiEncodedFontKey, string> = {
  "shree-dev": "Shree-Dev / Shreelipi-style",
  surekh: "Surekh / Sulekha-style",
}

export const MARATHI_FONT_CLASSES: Record<MarathiEncodedFontKey, string> = {
  "shree-dev":
    "font-marathi-encoded font-marathi-shree-dev font-legacy-marathi",
  surekh: "font-marathi-encoded font-marathi-surekh font-marathi-sulekha",
}

const FONT_HINTS: Record<MarathiEncodedFontKey, readonly string[]> = {
  "shree-dev": [
    "shree dev",
    "shree-dev",
    "shreelipi",
    "s0708892",
    "font-marathi-shree-dev",
    "font-legacy-marathi",
    'data-marathi-font="shree-dev"',
    'data-question-font="shree-dev"',
  ],
  surekh: [
    "surekh",
    "sulekha",
    "ttsurekh",
    "dvbwsr3",
    "dvbw-ttsurekhen",
    "dvbwttsurekhen",
    "web-surekh-en",
    "isfoc-devanagari-bilingual-web-surekh-en-normal",
    "font-marathi-surekh",
    "font-marathi-sulekha",
    'data-marathi-font="surekh"',
    'data-marathi-font="sulekha"',
    'data-question-font="surekh"',
    'data-question-font="sulekha"',
  ],
}

const DEVANAGARI_CHAR_PATTERN = /[\u0900-\u097F]/
const SUREKH_GLYPH_PATTERN =
  /[\u00A1-\u00FF\u0152\u0153\u0160\u0161\u0178\u017D\u017E\u02C6\u02DC\u2013-\u2022\u2026\u2030\u2039\u203A\u20AC]/g
const LEGACY_GLYPH_PATTERN =
  /[À-ÿ†‡•–—…‰‹›€™„‚ƒˆ˜¯±÷×°¼½¾¿¢£¤¥¦§©®µ¶¸¹ºª«»¬]/g

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function joinMarkupAttributes(input: {
  className?: string | null
  dataFont?: string | null
  style?: string | null
}) {
  return [input.className, input.dataFont, input.style].filter(Boolean).join(" ")
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
}

function escapeHtmlAttribute(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function normalizeStoredLatex(raw: string) {
  const decoded = decodeHtmlEntities(String(raw || "")).trim()
  if (!decoded) {
    return ""
  }

  if (decoded.startsWith('"') && decoded.endsWith('"')) {
    try {
      const parsed = JSON.parse(decoded)
      if (typeof parsed === "string") {
        return parsed.trim()
      }
    } catch {
      // Fall back to the normalization below.
    }
  }

  if (
    (decoded.startsWith('"') && decoded.endsWith('"')) ||
    (decoded.startsWith("'") && decoded.endsWith("'"))
  ) {
    return decoded.slice(1, -1).trim()
  }

  return decoded
}

function renderMathNode(
  latexSource: string,
  options: {
    className: string
    displayMode: boolean
    tag: "div" | "span"
  },
) {
  const latex = normalizeStoredLatex(latexSource) || "\\square"
  const rendered = katex.renderToString(latex, {
    displayMode: options.displayMode,
    strict: "ignore",
    throwOnError: false,
  })

  return `<${options.tag} class="${options.className}" data-latex-source="${escapeHtmlAttribute(
    latex,
  )}">${rendered}</${options.tag}>`
}

function renderQuestionMathHtml(html: string) {
  if (!html.trim()) {
    return html
  }

  return html
    .replace(
      /<span\b[^>]*data-question-math-inline=(["'])([\s\S]*?)\1[^>]*>[\s\S]*?<\/span>/gi,
      (_match, _quote, latex) =>
        renderMathNode(latex, {
          className: "tc-question-math-rendered tc-question-math-rendered-inline",
          displayMode: false,
          tag: "span",
        }),
    )
    .replace(
      /<span\b[^>]*data-latex=(["'])([\s\S]*?)\1[^>]*>[\s\S]*?<\/span>/gi,
      (_match, _quote, latex) =>
        renderMathNode(latex, {
          className: "tc-question-math-rendered tc-question-math-rendered-inline",
          displayMode: false,
          tag: "span",
        }),
    )
    .replace(
      /<div\b[^>]*data-question-math-block=(["'])([\s\S]*?)\1[^>]*>[\s\S]*?<\/div>/gi,
      (_match, _quote, latex) =>
        renderMathNode(latex, {
          className: "tc-question-math-rendered tc-question-math-rendered-block",
          displayMode: true,
          tag: "div",
        }),
    )
    .replace(
      /<div\b[^>]*data-latex=(["'])([\s\S]*?)\1[^>]*>[\s\S]*?<\/div>/gi,
      (_match, _quote, latex) =>
        renderMathNode(latex, {
          className: "tc-question-math-rendered tc-question-math-rendered-block",
          displayMode: true,
          tag: "div",
        }),
    )
    .replace(
      /<code\b[^>]*data-question-equation=(["'])true\1[^>]*>([\s\S]*?)<\/code>/gi,
      (_match, _quote, latex) =>
        renderMathNode(latex, {
          className: "tc-question-math-rendered tc-question-math-rendered-inline",
          displayMode: false,
          tag: "span",
        }),
    )
}

function buildMixedLegacySegments(value: string) {
  return value
    .split(/([\u0900-\u097F]+)/g)
    .filter((segment) => segment.length > 0)
    .map((segment) => ({
      fontKey: DEVANAGARI_CHAR_PATTERN.test(segment)
        ? null
        : getLikelyLegacyMarathiFontKey(segment),
      text: segment,
    }))
}

export function decorateMixedLegacyHtmlSegments(html: string) {
  if (!html.trim() || typeof window === "undefined") {
    return html
  }

  try {
    const parser = new DOMParser()
    const document = parser.parseFromString(`<div id="root">${html}</div>`, "text/html")
    const root = document.getElementById("root")
    if (!root) {
      return html
    }

    const walker = document.createTreeWalker(
      root,
      globalThis.NodeFilter.SHOW_TEXT,
    )
    const textNodes: Text[] = []

    while (walker.nextNode()) {
      const currentNode = walker.currentNode
      if (currentNode instanceof Text) {
        textNodes.push(currentNode)
      }
    }

    textNodes.forEach((textNode) => {
      const parentElement = textNode.parentElement
      if (!parentElement) {
        return
      }

      if (
        parentElement.closest(
          [
            "[data-question-font]",
            "[data-marathi-font]",
            ".font-marathi-encoded",
            ".font-marathi-shree-dev",
            ".font-marathi-surekh",
            ".font-marathi-sulekha",
            ".font-legacy-marathi",
            "code",
            "pre",
            "script",
            "style",
            `[${QUESTION_MATH_INLINE_ATTR}]`,
            `[${QUESTION_MATH_BLOCK_ATTR}]`,
          ].join(", "),
        )
      ) {
        return
      }

      const segments = buildMixedLegacySegments(textNode.textContent ?? "")
      if (!segments.some((segment) => segment.fontKey)) {
        return
      }

      const fragment = document.createDocumentFragment()
      segments.forEach((segment) => {
        if (!segment.fontKey) {
          fragment.append(document.createTextNode(segment.text))
          return
        }

        const span = document.createElement("span")
        span.textContent = segment.text
        span.setAttribute("data-question-font", segment.fontKey)
        span.className = MARATHI_FONT_CLASSES[segment.fontKey]
        fragment.append(span)
      })

      textNode.replaceWith(fragment)
    })

    return root.innerHTML
  } catch {
    return html
  }
}

export function extractTextFromHtml(value: string): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(
      /<(?:span|div)\b[^>]*data-question-math-(?:inline|block)=(["'])([\s\S]*?)\1[^>]*>[\s\S]*?<\/(?:span|div)>/gi,
      (_match, _quote, latex) => ` ${normalizeStoredLatex(latex)} `,
    )
    .replace(
      /<code\b[^>]*data-question-equation=(["'])true\1[^>]*>([\s\S]*?)<\/code>/gi,
      (_match, _quote, latex) => ` ${decodeHtmlEntities(latex)} `,
    )
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

export function getMarathiFontKeyFromHint(
  value: string,
): MarathiEncodedFontKey | null {
  const normalized = value.toLowerCase()

  for (const [fontKey, hints] of Object.entries(FONT_HINTS) as Array<
    [MarathiEncodedFontKey, readonly string[]]
  >) {
    if (hints.some((hint) => normalized.includes(hint))) {
      return fontKey
    }
  }

  return null
}

export function getMarathiFontKeyFromElement(
  element: HTMLElement,
): MarathiEncodedFontKey | null {
  const explicitQuestionFont = element.getAttribute("data-question-font")
  if (explicitQuestionFont === "shree-dev") {
    return explicitQuestionFont
  }

  if (explicitQuestionFont === "surekh" || explicitQuestionFont === "sulekha") {
    return "surekh"
  }

  const explicitMarathiFont = element.getAttribute("data-marathi-font")
  if (explicitMarathiFont === "shree-dev") {
    return explicitMarathiFont
  }

  if (explicitMarathiFont === "surekh" || explicitMarathiFont === "sulekha") {
    return "surekh"
  }

  const classes = element.className.toLowerCase().split(/\s+/)
  if (
    classes.includes("font-marathi-surekh") ||
    classes.includes("font-marathi-sulekha")
  ) {
    return "surekh"
  }

  if (
    classes.includes("font-marathi-shree-dev") ||
    classes.includes("font-legacy-marathi")
  ) {
    return "shree-dev"
  }

  const styleValue = `${element.getAttribute("style") || ""} ${
    element.style.fontFamily || ""
  }`
  return getMarathiFontKeyFromHint(styleValue)
}

export function getLikelyLegacyMarathiFontKey(
  value: string | null | undefined,
): MarathiEncodedFontKey | null {
  const text = value?.trim() ?? ""
  if (!text) {
    return null
  }

  const hintedFont = getMarathiFontKeyFromHint(text)
  if (hintedFont) {
    return hintedFont
  }

  if (DEVANAGARI_CHAR_PATTERN.test(text)) {
    return null
  }

  const surekhMatches = text.match(SUREKH_GLYPH_PATTERN)
  if (
    surekhMatches &&
    surekhMatches.length >= Math.max(3, Math.floor(text.length * 0.12))
  ) {
    return "surekh"
  }

  const legacyMatches = text.match(LEGACY_GLYPH_PATTERN)
  if (!legacyMatches) {
    return null
  }

  const ratio = legacyMatches.length / text.length
  return legacyMatches.length >= 3 && ratio >= 0.08
    ? DEFAULT_MARATHI_ENCODED_FONT
    : null
}

function findMarathiFontKey(
  value: unknown,
  detector: (input: string) => MarathiEncodedFontKey | null,
): MarathiEncodedFontKey | null {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    return detector(value)
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const fontKey = findMarathiFontKey(entry, detector)
      if (fontKey) {
        return fontKey
      }
    }

    return null
  }

  if (!isRecord(value)) {
    return null
  }

  for (const entry of Object.values(value)) {
    const fontKey = findMarathiFontKey(entry, detector)
    if (fontKey) {
      return fontKey
    }
  }

  return null
}

export function getMarathiFontKeyFromValue(
  value: unknown,
): MarathiEncodedFontKey | null {
  return (
    findMarathiFontKey(value, getMarathiFontKeyFromHint) ??
    findMarathiFontKey(value, getLikelyLegacyMarathiFontKey)
  )
}

export function hasExplicitMarathiFontHint(value: string): boolean {
  return /(?:data-marathi-font\s*=\s*["'](?:shree-dev|surekh|sulekha)["'])|(?:data-question-font\s*=\s*["'](?:shree-dev|surekh|sulekha)["'])|(?:font-marathi-(?:encoded|legacy-marathi|surekh|sulekha|shree-dev))/i.test(
    value,
  )
}

export function resolveMarathiTextPresentation(
  value: unknown,
  options?: {
    fontHint?: MarathiEncodedFontKey | null
    className?: string | null
    dataFont?: string | null
    style?: string | null
  },
): {
  mode: MarathiRenderMode
  fontKey: MarathiEncodedFontKey | null
  className: string | null
  isUnicodeMarathi: boolean
} {
  const textValue =
    typeof value === "string" ? value : typeof value === "number" ? String(value) : ""
  const explicitFontHint =
    options?.fontHint ??
    getMarathiFontKeyFromHint(
      joinMarkupAttributes({
        className: options?.className,
        dataFont: options?.dataFont,
        style: options?.style,
      }),
    )

  if (explicitFontHint) {
    return {
      mode: "legacy-encoded",
      fontKey: explicitFontHint,
      className: MARATHI_FONT_CLASSES[explicitFontHint],
      isUnicodeMarathi: false,
    }
  }

  const legacyFontKey =
    getMarathiFontKeyFromValue(value) ?? getLikelyLegacyMarathiFontKey(textValue)

  if (legacyFontKey) {
    return {
      mode: "legacy-encoded",
      fontKey: legacyFontKey,
      className: MARATHI_FONT_CLASSES[legacyFontKey],
      isUnicodeMarathi: false,
    }
  }

  const isUnicodeMarathi = DEVANAGARI_CHAR_PATTERN.test(textValue)

  return {
    mode: isUnicodeMarathi ? "unicode" : "plain",
    fontKey: null,
    className: isUnicodeMarathi ? "font-marathi-unicode" : null,
    isUnicodeMarathi,
  }
}

export function applyMarathiHtmlFontHint(
  html: string,
  options?: {
    fontHint?: MarathiEncodedFontKey | null
  },
): {
  html: string
  fontKey: MarathiEncodedFontKey | null
  className: string | null
  mode: MarathiRenderMode
} {
  const normalized = html.trim()
  if (!normalized) {
    return {
      html: normalized,
      fontKey: null,
      className: null,
      mode: "plain",
    }
  }

  const renderedHtml = decorateMixedLegacyHtmlSegments(
    renderQuestionMathHtml(normalized),
  )
  const extractedText = extractTextFromHtml(renderedHtml)
  const hintedFont =
    options?.fontHint ??
    getMarathiFontKeyFromHint(renderedHtml) ??
    getLikelyLegacyMarathiFontKey(extractedText)

  if (hasExplicitMarathiFontHint(renderedHtml)) {
    return {
      html: renderedHtml,
      fontKey: hintedFont,
      className: hintedFont ? MARATHI_FONT_CLASSES[hintedFont] : null,
      mode: hintedFont
        ? "legacy-encoded"
        : DEVANAGARI_CHAR_PATTERN.test(extractedText)
          ? "unicode"
          : "plain",
    }
  }

  if (hintedFont) {
    return {
      html: `<div class="${MARATHI_FONT_CLASSES[hintedFont]}" data-marathi-font="${hintedFont}">${renderedHtml}</div>`,
      fontKey: hintedFont,
      className: MARATHI_FONT_CLASSES[hintedFont],
      mode: "legacy-encoded",
    }
  }

  if (DEVANAGARI_CHAR_PATTERN.test(extractedText)) {
    return {
      html: renderedHtml,
      fontKey: null,
      className: "font-marathi-unicode",
      mode: "unicode",
    }
  }

  return {
    html: renderedHtml,
    fontKey: null,
    className: null,
    mode: "plain",
  }
}
