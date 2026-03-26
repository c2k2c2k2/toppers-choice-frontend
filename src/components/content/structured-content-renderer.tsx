import { Fragment } from "react";
import type { MarathiEncodedFontKey } from "@/lib/marathi";
import { MarathiText } from "@/components/primitives/marathi-text";
import {
  resolveStructuredContentFontHint,
  type StructuredContentDocument,
} from "@/lib/content";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStringValue(
  value: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const candidate = value[key];

    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

function getNumericValue(
  value: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const candidate = value[key];

    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getArrayValue(
  value: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    const candidate = value[key];

    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return null;
}

function resolveDocumentVariant(
  document: StructuredContentDocument,
  preferredLocaleKeys: string[],
): {
  document: StructuredContentDocument;
  fontHint: MarathiEncodedFontKey | null;
  locale: string | null;
} {
  if (!isRecord(document)) {
    return {
      document,
      fontHint: resolveStructuredContentFontHint(document),
      locale: null,
    };
  }

  const directFontHint = resolveStructuredContentFontHint(document);

  if (
    Array.isArray(document.blocks) ||
    typeof document.html === "string" ||
    typeof document.text === "string"
  ) {
    return {
      document,
      fontHint: directFontHint,
      locale: null,
    };
  }

  const keysToTry = [
    ...preferredLocaleKeys,
    "default",
    "content",
    "body",
    "fallback",
  ];

  for (const key of keysToTry) {
    const candidate = document[key];

    if (
      Array.isArray(candidate) ||
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "boolean" ||
      (isRecord(candidate) &&
        (Array.isArray(candidate.blocks) ||
          typeof candidate.html === "string" ||
          typeof candidate.text === "string"))
    ) {
      return {
        document: candidate as StructuredContentDocument,
        fontHint:
          resolveStructuredContentFontHint(
            candidate as StructuredContentDocument,
          ) ?? directFontHint,
        locale: key,
      };
    }
  }

  const localeEntry = Object.entries(document).find(([, value]) => {
    return (
      Array.isArray(value) ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      (isRecord(value) &&
        (Array.isArray(value.blocks) ||
          typeof value.html === "string" ||
          typeof value.text === "string"))
    );
  });

  if (localeEntry) {
    const [locale, value] = localeEntry;

    return {
      document: value as StructuredContentDocument,
      fontHint:
        resolveStructuredContentFontHint(value as StructuredContentDocument) ??
        directFontHint,
      locale,
    };
  }

  return {
    document,
    fontHint: directFontHint,
    locale: null,
  };
}

function normalizeBlocks(document: StructuredContentDocument) {
  if (document === null || document === undefined) {
    return [];
  }

  if (Array.isArray(document)) {
    return document;
  }

  if (
    typeof document === "string" ||
    typeof document === "number" ||
    typeof document === "boolean"
  ) {
    return [
      {
        text: String(document),
        type: "paragraph",
      },
    ];
  }

  if (isRecord(document)) {
    if (Array.isArray(document.blocks)) {
      return document.blocks;
    }

    if (typeof document.html === "string" || typeof document.text === "string") {
      return [document];
    }

    return [
      {
        content: document,
        type: "unknown",
      },
    ];
  }

  return [];
}

function renderInlineValue(
  value: unknown,
  options: {
    as?: "div" | "span";
    className?: string;
    fallbackFontHint: MarathiEncodedFontKey | null;
    key: string;
  },
) {
  if (typeof value === "string" || typeof value === "number") {
    return (
      <MarathiText
        key={options.key}
        as={options.as ?? "div"}
        className={options.className}
        fontHint={options.fallbackFontHint}
        text={String(value)}
      />
    );
  }

  if (!isRecord(value)) {
    return null;
  }

  const html = getStringValue(value, ["html", "contentHtml", "bodyHtml"]);
  const text = getStringValue(value, ["text", "content", "body", "label"]);
  const fontHint =
    resolveStructuredContentFontHint(value) ?? options.fallbackFontHint;

  if (html) {
    return (
      <MarathiText
        key={options.key}
        as={options.as ?? "div"}
        className={options.className}
        fontHint={fontHint}
        html={html}
      />
    );
  }

  if (!text) {
    return null;
  }

  return (
    <MarathiText
      key={options.key}
      as={options.as ?? "div"}
      className={options.className}
      fontHint={fontHint}
      text={text}
    />
  );
}

function renderBlock(
  block: unknown,
  index: number,
  fallbackFontHint: MarathiEncodedFontKey | null,
) {
  if (
    typeof block === "string" ||
    typeof block === "number" ||
    typeof block === "boolean"
  ) {
    return (
      <MarathiText
        key={`block-${index}`}
        className="text-base leading-8 text-[color:var(--brand)]"
        fontHint={fallbackFontHint}
        text={String(block)}
      />
    );
  }

  if (!isRecord(block)) {
    return null;
  }

  const type = getStringValue(block, ["type", "kind", "variant"]) ?? "paragraph";
  const blockFontHint =
    resolveStructuredContentFontHint(block) ?? fallbackFontHint;
  const title = getStringValue(block, ["title", "heading", "label", "name"]);
  const text = getStringValue(block, ["text", "content", "body", "value"]);
  const html = getStringValue(block, ["html", "contentHtml", "bodyHtml"]);
  const items = getArrayValue(block, ["items", "children", "points"]);

  switch (type) {
    case "heading":
    case "title":
    case "h1":
    case "h2":
    case "h3":
    case "subheading": {
      const headingText = title ?? text ?? html;
      const requestedLevel = getNumericValue(block, ["level"]);
      const level =
        requestedLevel ?? (type === "h1" ? 1 : type === "h3" ? 3 : 2);
      const className =
        level <= 1
          ? "tc-display text-3xl font-semibold tracking-tight text-[color:var(--brand)] md:text-4xl"
          : level === 2
            ? "tc-display text-2xl font-semibold tracking-tight text-[color:var(--brand)]"
            : "tc-display text-xl font-semibold tracking-tight text-[color:var(--brand)]";

      return renderInlineValue(
        html && !title && !text ? { html } : headingText,
        {
          className,
          fallbackFontHint: blockFontHint,
          key: `heading-${index}`,
        },
      );
    }

    case "html":
    case "richText":
    case "rich-text":
      return html
        ? renderInlineValue(
            { html },
            {
              className: "tc-rich-html text-base leading-8 text-[color:var(--brand)]",
              fallbackFontHint: blockFontHint,
              key: `html-${index}`,
            },
          )
        : null;

    case "quote":
    case "pullquote":
      return (
        <blockquote
          key={`quote-${index}`}
          className="rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-[rgba(0,51,102,0.05)] px-5 py-4"
        >
          {renderInlineValue(
            html && !text ? { html } : text,
            {
              className:
                "text-lg font-medium leading-8 text-[color:var(--brand)]",
              fallbackFontHint: blockFontHint,
              key: `quote-body-${index}`,
            },
          )}
          {title ? (
            <MarathiText
              className="mt-3 text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]"
              fontHint={blockFontHint}
              text={title}
            />
          ) : null}
        </blockquote>
      );

    case "list":
    case "bullets":
    case "ordered-list":
    case "checklist":
    case "steps": {
      const isOrdered =
        type === "ordered-list" ||
        Boolean(block.ordered) ||
        Boolean(block.numbered);
      const ListTag = isOrdered ? "ol" : "ul";

      return (
        <ListTag
          key={`list-${index}`}
          className={`ml-5 flex flex-col gap-3 text-base leading-8 text-[color:var(--brand)] ${
            isOrdered ? "list-decimal" : "list-disc"
          }`}
        >
          {(items ?? []).map((item, itemIndex) => (
            <li key={`list-item-${index}-${itemIndex}`} className="pl-1">
              {renderInlineValue(item, {
                as: "span",
                className: "inline text-base leading-8 text-[color:var(--brand)]",
                fallbackFontHint: blockFontHint,
                key: `list-item-value-${index}-${itemIndex}`,
              }) ?? (
                <span className="text-base leading-8 text-[color:var(--brand)]">
                  {JSON.stringify(item)}
                </span>
              )}
            </li>
          ))}
        </ListTag>
      );
    }

    case "callout":
    case "note":
    case "tip":
    case "warning":
    case "highlight":
    case "summary":
      return (
        <section
          key={`callout-${index}`}
          className="rounded-[24px] border border-[rgba(225,134,0,0.14)] bg-[rgba(255,184,111,0.12)] p-5"
        >
          {title ? (
            <MarathiText
              className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--brand)]"
              fontHint={blockFontHint}
              text={title}
            />
          ) : null}
          {renderInlineValue(
            html && !text ? { html } : text,
            {
              className: title
                ? "mt-3 text-base leading-8 text-[color:var(--brand)]"
                : "text-base leading-8 text-[color:var(--brand)]",
              fallbackFontHint: blockFontHint,
              key: `callout-body-${index}`,
            },
          )}
        </section>
      );

    case "divider":
      return (
        <hr
          key={`divider-${index}`}
          className="border-none border-t border-[rgba(0,30,64,0.08)]"
        />
      );

    case "image":
    case "photo":
    case "illustration": {
      const src = getStringValue(block, ["src", "url"]);
      const alt = getStringValue(block, ["alt", "caption", "title"]) ?? "Content image";
      const caption = getStringValue(block, ["caption"]);

      if (!src) {
        return null;
      }

      return (
        <figure key={`image-${index}`} className="overflow-hidden rounded-[24px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={alt}
            className="w-full rounded-[24px] object-cover"
            src={src}
          />
          {caption ? (
            <MarathiText
              className="mt-3 text-sm leading-6 text-[color:var(--muted)]"
              fontHint={blockFontHint}
              text={caption}
            />
          ) : null}
        </figure>
      );
    }

    case "unknown":
      return (
        <pre
          key={`unknown-${index}`}
          className="overflow-x-auto rounded-[24px] bg-[rgba(0,30,64,0.06)] p-4 text-xs leading-6 text-[color:var(--brand)]"
        >
          {JSON.stringify(block.content ?? block, null, 2)}
        </pre>
      );

    default:
      if (html) {
        return renderInlineValue(
          { html },
          {
            className: "tc-rich-html text-base leading-8 text-[color:var(--brand)]",
            fallbackFontHint: blockFontHint,
            key: `fallback-html-${index}`,
          },
        );
      }

      return renderInlineValue(
        text ?? title ?? block,
        {
          className: "text-base leading-8 text-[color:var(--brand)]",
          fallbackFontHint: blockFontHint,
          key: `fallback-${index}`,
        },
      );
  }
}

export function StructuredContentRenderer({
  bodyJson,
  fallbackFontHint = null,
  preferredLocaleKeys = [],
  showLocaleBadge = true,
}: Readonly<{
  bodyJson: StructuredContentDocument;
  fallbackFontHint?: MarathiEncodedFontKey | null;
  preferredLocaleKeys?: string[];
  showLocaleBadge?: boolean;
}>) {
  const resolvedVariant = resolveDocumentVariant(bodyJson, preferredLocaleKeys);
  const blocks = normalizeBlocks(resolvedVariant.document);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="tc-rich-content">
      {showLocaleBadge && resolvedVariant.locale ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="tc-code-chip">Locale</span>
          <span className="tc-code-chip">{resolvedVariant.locale}</span>
        </div>
      ) : null}

      {blocks.map((block, index) => (
        <Fragment key={`fragment-${index}`}>
          {renderBlock(
            block,
            index,
            resolvedVariant.fontHint ?? fallbackFontHint,
          )}
        </Fragment>
      ))}
    </div>
  );
}
