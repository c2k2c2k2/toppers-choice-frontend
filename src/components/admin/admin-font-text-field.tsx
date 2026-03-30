"use client"

import { useMemo } from "react"
import { AdminFormField } from "@/components/admin/admin-form-field"
import { TextContent } from "@/components/primitives/text-content"
import {
  deserializeAdminPlainTextValue,
  getAdminRichFontClass,
  serializeAdminPlainTextValue,
  type AdminRichFontChoice,
} from "@/lib/admin/rich-text"

const FONT_OPTIONS: Array<{
  label: string
  value: AdminRichFontChoice
}> = [
  { label: "Auto detect", value: "auto" },
  { label: "Unicode Marathi", value: "unicode" },
  { label: "Shree-Dev", value: "shree-dev" },
  { label: "Surekh", value: "surekh" },
]

export function AdminFontTextField({
  disabled,
  hint,
  label,
  multiline = false,
  onChange,
  preserveParagraphs = false,
  rows = 4,
  storage = "plain",
  value,
}: Readonly<{
  disabled?: boolean
  hint?: string
  label: string
  multiline?: boolean
  onChange: (value: string) => void
  preserveParagraphs?: boolean
  rows?: number
  storage?: "plain" | "html"
  value: string
}>) {
  const deserializedValue = useMemo(() => {
    return deserializeAdminPlainTextValue(value)
  }, [value])
  const fontChoice = deserializedValue.fontChoice
  const textValue = deserializedValue.text

  const fieldClassName = useMemo(() => {
    return [
      "tc-input",
      multiline ? "min-h-28 resize-y" : "",
      getAdminRichFontClass(fontChoice),
    ]
      .filter(Boolean)
      .join(" ")
  }, [fontChoice, multiline])

  function handleValueChange(nextValue: string) {
    if (storage === "html") {
      onChange(
        serializeAdminPlainTextValue(nextValue, {
          fontChoice,
          preserveParagraphs,
          wrapper: multiline ? "div" : "span",
        }),
      )
      return
    }

    onChange(nextValue)
  }

  function handleFontChoiceChange(nextFontChoice: AdminRichFontChoice) {
    if (storage === "html") {
      onChange(
        serializeAdminPlainTextValue(textValue, {
          fontChoice: nextFontChoice,
          preserveParagraphs,
          wrapper: multiline ? "div" : "span",
        }),
      )
    }
  }

  return (
    <AdminFormField
      label={label}
      hint={hint}
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Input mode
          </span>
          <select
            className="tc-input min-h-0 w-full max-w-[14rem] py-2 text-sm"
            disabled={disabled}
            value={fontChoice}
            onChange={(event) =>
              handleFontChoiceChange(event.target.value as AdminRichFontChoice)
            }
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {multiline ? (
          <textarea
            className={fieldClassName}
            disabled={disabled}
            rows={rows}
            value={textValue}
            onChange={(event) => handleValueChange(event.target.value)}
          />
        ) : (
          <input
            className={fieldClassName}
            disabled={disabled}
            value={textValue}
            onChange={(event) => handleValueChange(event.target.value)}
          />
        )}

        {textValue.trim() ? (
          <div className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Preview
            </p>
            <TextContent
              className="mt-3 text-sm leading-6 text-[color:var(--foreground)]"
              preserveLineBreaks
              value={
                storage === "html"
                  ? serializeAdminPlainTextValue(textValue, {
                      fontChoice,
                      preserveParagraphs,
                      wrapper: multiline ? "div" : "span",
                    })
                  : textValue
              }
            />
          </div>
        ) : null}
      </div>
    </AdminFormField>
  )
}
