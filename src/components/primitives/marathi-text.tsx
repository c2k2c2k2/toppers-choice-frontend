import type { ElementType } from "react"
import {
  applyMarathiHtmlFontHint,
  resolveMarathiTextPresentation,
  type MarathiEncodedFontKey,
} from "@/lib/marathi"

interface MarathiTextProps {
  as?: ElementType
  className?: string
  fontHint?: MarathiEncodedFontKey | null
  html?: string | null
  text?: string | null
}

function joinClasses(...values: Array<string | null | undefined | false>) {
  return values.filter(Boolean).join(" ")
}

export function MarathiText({
  as: Component = "div",
  className,
  fontHint,
  html,
  text,
}: Readonly<MarathiTextProps>) {
  if (html) {
    const renderedHtml = applyMarathiHtmlFontHint(html, {
      fontHint,
    })

    return (
      <Component
        className={joinClasses(renderedHtml.className, className)}
        data-marathi-mode={renderedHtml.mode}
        data-marathi-font={renderedHtml.fontKey ?? undefined}
        dangerouslySetInnerHTML={{ __html: renderedHtml.html }}
      />
    )
  }

  if (!text) {
    return null
  }

  const presentation = resolveMarathiTextPresentation(text, {
    fontHint,
  })

  return (
    <Component
      className={joinClasses(presentation.className, className)}
      data-marathi-mode={presentation.mode}
      data-marathi-font={presentation.fontKey ?? undefined}
    >
      {text}
    </Component>
  )
}
