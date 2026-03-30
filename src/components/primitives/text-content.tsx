import type { ElementType } from "react"
import { MarathiText } from "@/components/primitives/marathi-text"
import { hasHtmlMarkup } from "@/lib/admin/rich-text"

function joinClasses(...values: Array<string | null | undefined | false>) {
  return values.filter(Boolean).join(" ")
}

export function TextContent({
  as,
  className,
  preserveLineBreaks = false,
  value,
}: Readonly<{
  as?: ElementType
  className?: string
  preserveLineBreaks?: boolean
  value: string | null | undefined
}>) {
  const normalized = value?.trim() ?? ""

  if (!normalized) {
    return null
  }

  if (hasHtmlMarkup(normalized)) {
    return <MarathiText as={as} className={className} html={normalized} />
  }

  return (
    <MarathiText
      as={as}
      className={joinClasses(preserveLineBreaks && "whitespace-pre-wrap", className)}
      text={normalized}
    />
  )
}
