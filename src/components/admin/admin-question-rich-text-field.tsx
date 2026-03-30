"use client";

import { Mark, Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Underline from "@tiptap/extension-underline";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import katex from "katex";
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AdminFormField } from "@/components/admin/admin-form-field";
import { QuestionRichTextRenderer } from "@/components/questions/question-rich-text-renderer";
import { htmlToPlainText } from "@/lib/admin/rich-text";
import {
  DEFAULT_MARATHI_ENCODED_FONT,
  decorateMixedLegacyHtmlSegments,
  getLikelyLegacyMarathiFontKey,
  getMarathiFontKeyFromElement,
  getMarathiFontKeyFromHint,
  MARATHI_FONT_CLASSES,
  QUESTION_MATH_BLOCK_ATTR,
  QUESTION_MATH_INLINE_ATTR,
  type MarathiEncodedFontKey,
} from "@/lib/marathi";

type EquationMode = "inline" | "block";
type MarathiTypingMode = "unicode" | MarathiEncodedFontKey;
type TableDraft = {
  cols: number;
  rows: number;
  withHeaderRow: boolean;
};

type MathfieldHandle = HTMLElement & {
  executeCommand?: (command: string | [string, ...unknown[]]) => boolean;
  value: string;
};

const EQUATION_TEMPLATES = [
  { label: "Fraction", value: "\\frac{a}{b}" },
  { label: "Power", value: "x^{2}" },
  { label: "Square Root", value: "\\sqrt{x}" },
  {
    label: "Nested Root",
    value: "\\sqrt{10+\\sqrt{25+\\sqrt{108+\\sqrt{154+\\sqrt{225}}}}}",
  },
  { label: "Sum", value: "\\sum_{i=1}^{n} i" },
  { label: "Integral", value: "\\int_{0}^{1} x^2\\,dx" },
  { label: "Matrix", value: "\\begin{bmatrix}a & b\\\\ c & d\\end{bmatrix}" },
  { label: "Repeating Bar", value: "0.\\overline{36}" },
  { label: "Mixed Fraction", value: "2\\frac{1}{3}" },
] as const;

const DEFAULT_EQUATION = "\\frac{a}{b}";
const DEFAULT_TABLE_DRAFT: TableDraft = {
  cols: 2,
  rows: 2,
  withHeaderRow: true,
};
const MARATHI_TYPING_MODE_STORAGE_KEY =
  "toppers-choice:admin:question-editor:marathi-typing-mode";

function joinClasses(...values: Array<string | null | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ");
}

function normalizeStoredLatex(raw: string) {
  const decoded = decodeHtmlEntities(String(raw || "")).trim();
  if (!decoded) {
    return "";
  }

  if (decoded.startsWith('"') && decoded.endsWith('"')) {
    try {
      const parsed = JSON.parse(decoded);
      if (typeof parsed === "string") {
        return parsed.trim();
      }
    } catch {
      // Keep the fallback normalization below.
    }
  }

  if (
    (decoded.startsWith('"') && decoded.endsWith('"')) ||
    (decoded.startsWith("'") && decoded.endsWith("'"))
  ) {
    return decoded.slice(1, -1).trim();
  }

  return decoded;
}

function normalizeHtmlForCompare(html: string) {
  return html
    .replace(/<p><\/p>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasMeaningfulEditorMarkup(value: string) {
  return /<img\b|<table\b|data-question-math-(?:inline|block)=|data-question-equation=/i.test(
    value,
  );
}

function normalizeEditorHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (
    /^<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>$/i.test(trimmed) &&
    !hasMeaningfulEditorMarkup(trimmed)
  ) {
    return "";
  }

  if (!htmlToPlainText(trimmed).trim() && !hasMeaningfulEditorMarkup(trimmed)) {
    return "";
  }

  return trimmed;
}

function clampTableDimension(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(10, Math.max(1, Math.floor(value)));
}

function readStoredMarathiTypingMode(): MarathiTypingMode | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(MARATHI_TYPING_MODE_STORAGE_KEY);
  if (stored === "unicode" || stored === "shree-dev" || stored === "surekh") {
    return stored;
  }

  return null;
}

function persistMarathiTypingMode(mode: MarathiTypingMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(MARATHI_TYPING_MODE_STORAGE_KEY, mode);
}

function detectEncodedFontFromPlainTextLine(
  line: string,
): MarathiEncodedFontKey | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  return getLikelyLegacyMarathiFontKey(trimmed);
}

function buildDetectedPasteHtml(text: string): string | null {
  const normalized = text.replace(/\r/g, "");

  const html = normalized
    .split(/\n{2,}/)
    .map((paragraph) => {
      const paragraphHtml = paragraph
        .split("\n")
        .map((line) => escapeHtml(line))
        .join("<br />");

      return `<p>${paragraphHtml}</p>`;
    })
    .join("");

  const decoratedHtml = decorateMixedLegacyHtmlSegments(html);
  const detectedEncodedText =
    decoratedHtml !== html || Boolean(detectEncodedFontFromPlainTextLine(text));

  return detectedEncodedText ? decoratedHtml : null;
}

function wrapTextNodesWithFontHint(
  element: HTMLElement,
  fontKey: MarathiEncodedFontKey,
) {
  const document = element.ownerDocument;

  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeType === globalThis.Node.TEXT_NODE) {
      const text = child.textContent ?? "";
      if (!text.trim()) {
        return;
      }

      const span = document.createElement("span");
      span.textContent = text;
      span.setAttribute("data-question-font", fontKey);
      span.className = MARATHI_FONT_CLASSES[fontKey];
      child.replaceWith(span);
      return;
    }

    if (!(child instanceof HTMLElement)) {
      return;
    }

    if (getMarathiFontKeyFromElement(child)) {
      return;
    }

    wrapTextNodesWithFontHint(child, fontKey);
  });
}

function normalizePastedHtml(html: string) {
  if (!html.trim() || typeof window === "undefined") {
    return html;
  }

  try {
    const parser = new DOMParser();
    const document = parser.parseFromString(html, "text/html");

    document.querySelectorAll("font[face]").forEach((node) => {
      if (!(node instanceof HTMLElement)) {
        return;
      }

      const face = node.getAttribute("face")?.trim();
      if (!face) {
        return;
      }

      const existingStyle = node.getAttribute("style")?.trim();
      const nextStyle = existingStyle
        ? `font-family: ${face}; ${existingStyle}`
        : `font-family: ${face};`;

      node.removeAttribute("face");
      node.setAttribute("style", nextStyle);
    });

    document.body.querySelectorAll<HTMLElement>("*").forEach((node) => {
      const fontKey = getMarathiFontKeyFromElement(node);
      if (!fontKey) {
        return;
      }

      node.setAttribute("data-question-font", fontKey);
      node.classList.add(...MARATHI_FONT_CLASSES[fontKey].split(/\s+/));
      wrapTextNodesWithFontHint(node, fontKey);
    });

    return decorateMixedLegacyHtmlSegments(document.body.innerHTML);
  } catch {
    return decorateMixedLegacyHtmlSegments(html);
  }
}

function renderEquationPreview(latexSource: string, displayMode: boolean) {
  return katex.renderToString(latexSource || "\\square", {
    displayMode,
    strict: "ignore",
    throwOnError: false,
  });
}

function EquationNodeView({
  displayMode,
  node,
  selected,
}: NodeViewProps & { displayMode: boolean }) {
  const latex = String(node.attrs.latex || "");
  const rendered = useMemo(
    () => renderEquationPreview(latex, displayMode),
    [displayMode, latex],
  );

  return (
    <NodeViewWrapper
      as={displayMode ? "div" : "span"}
      className={joinClasses(
        "tc-question-math-rendered",
        displayMode
          ? "tc-question-math-rendered-block"
          : "tc-question-math-rendered-inline",
        selected && "ring-2 ring-[rgba(0,51,102,0.2)]",
      )}
      contentEditable={false}
      data-latex-source={latex}
      title="Equation"
    >
      <span dangerouslySetInnerHTML={{ __html: rendered }} />
    </NodeViewWrapper>
  );
}

const InlineMath = TiptapNode.create({
  atom: true,
  group: "inline",
  inline: true,
  name: "inlineMath",
  selectable: true,
  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) =>
          normalizeStoredLatex(
            element.getAttribute(QUESTION_MATH_INLINE_ATTR) ||
              element.getAttribute("data-latex") ||
              "",
          ),
        renderHTML: (attributes) => ({
          [QUESTION_MATH_INLINE_ATTR]: String(attributes.latex || ""),
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <EquationNodeView {...props} displayMode={false} />
    ));
  },
  parseHTML() {
    return [
      { tag: `span[${QUESTION_MATH_INLINE_ATTR}]` },
      { tag: "span[data-latex]" },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes)];
  },
});

const BlockMath = TiptapNode.create({
  atom: true,
  group: "block",
  name: "blockMath",
  selectable: true,
  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) =>
          normalizeStoredLatex(
            element.getAttribute(QUESTION_MATH_BLOCK_ATTR) ||
              element.getAttribute("data-latex") ||
              "",
          ),
        renderHTML: (attributes) => ({
          [QUESTION_MATH_BLOCK_ATTR]: String(attributes.latex || ""),
        }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer((props) => (
      <EquationNodeView {...props} displayMode={true} />
    ));
  },
  parseHTML() {
    return [
      { tag: `div[${QUESTION_MATH_BLOCK_ATTR}]` },
      { tag: "div[data-latex]" },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes)];
  },
});

const MarathiEncodedFont = Mark.create({
  name: "marathiEncodedFont",
  addAttributes() {
    return {
      fontKey: {
        default: DEFAULT_MARATHI_ENCODED_FONT,
        parseHTML: (element) =>
          element instanceof HTMLElement
            ? getMarathiFontKeyFromElement(element) ??
              DEFAULT_MARATHI_ENCODED_FONT
            : DEFAULT_MARATHI_ENCODED_FONT,
      },
    };
  },
  parseHTML() {
    return [
      {
        style: "font-family",
        getAttrs: (fontFamily) => {
          const fontKey = getMarathiFontKeyFromHint(String(fontFamily || ""));
          return fontKey ? { fontKey } : false;
        },
      },
      {
        tag: "span",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) {
            return false;
          }

          const fontKey = getMarathiFontKeyFromElement(element);
          if (fontKey) {
            return { fontKey };
          }

          const dataLegacy = element.getAttribute("data-question-legacy");
          return dataLegacy === "true"
            ? { fontKey: DEFAULT_MARATHI_ENCODED_FONT }
            : false;
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const fontKey =
      HTMLAttributes.fontKey === "surekh"
        ? "surekh"
        : DEFAULT_MARATHI_ENCODED_FONT;
    const rest = { ...HTMLAttributes } as Record<string, unknown>;
    delete rest.fontKey;

    return [
      "span",
      mergeAttributes(rest, {
        class: MARATHI_FONT_CLASSES[fontKey],
        "data-question-font": fontKey,
      }),
      0,
    ];
  },
});

function toolbarButtonClass(active?: boolean) {
  return joinClasses(
    "rounded-full border px-3 py-2 text-xs font-semibold transition",
    active
      ? "border-[rgba(0,51,102,0.22)] bg-[rgba(0,51,102,0.08)] text-[color:var(--brand)]"
      : "border-[rgba(0,30,64,0.12)] bg-white/80 text-[color:var(--brand)] hover:bg-white",
  );
}

export function AdminQuestionRichTextField({
  disabled,
  hint,
  label,
  language = "en",
  minHeight = "12rem",
  onChange,
  showPreview = true,
  value,
}: Readonly<{
  disabled?: boolean;
  hint?: string;
  label: string;
  language?: "en" | "mr";
  minHeight?: string;
  onChange: (value: string) => void;
  showPreview?: boolean;
  value: string;
}>) {
  const marathiEditor = language === "mr";
  const [typingMode, setTypingMode] = useState<MarathiTypingMode>(
    () => readStoredMarathiTypingMode() ?? "unicode",
  );
  const [equationMode, setEquationMode] = useState<EquationMode>("inline");
  const [equationPanelOpen, setEquationPanelOpen] = useState(false);
  const [equationLatex, setEquationLatex] = useState("");
  const [mathliveReady, setMathliveReady] = useState(false);
  const [tableDraft, setTableDraft] = useState<TableDraft>(DEFAULT_TABLE_DRAFT);
  const [tablePanelOpen, setTablePanelOpen] = useState(false);
  const mathFieldRef = useRef<MathfieldHandle | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    content: value || "",
    editable: !disabled,
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      Placeholder.configure({
        placeholder: `Enter ${label.toLowerCase()}`,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      MarathiEncodedFont,
      InlineMath,
      BlockMath,
    ],
    editorProps: {
      attributes: {
        class: joinClasses(
          "tc-rich-html tc-admin-rich-editor w-full rounded-[22px] px-4 py-4 text-sm leading-7 text-[color:var(--foreground)] focus:outline-none",
          marathiEditor && "font-marathi-unicode",
          disabled && "cursor-not-allowed opacity-70",
        ),
      },
      transformPastedHTML: normalizePastedHtml,
    },
    onUpdate: ({ editor: instance }) => {
      onChange(normalizeEditorHtml(instance.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const current = normalizeHtmlForCompare(editor.getHTML());
    const next = normalizeHtmlForCompare(value || "");
    if (current === next) {
      return;
    }

    editor.commands.setContent(value || "");
  }, [editor, value]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!disabled);
    editor.view.dom.className = joinClasses(
      "tc-rich-html tc-admin-rich-editor w-full rounded-[22px] px-4 py-4 text-sm leading-7 text-[color:var(--foreground)] focus:outline-none",
      marathiEditor && "font-marathi-unicode",
      disabled && "cursor-not-allowed opacity-70",
    );
  }, [disabled, editor, marathiEditor]);

  useEffect(() => {
    if (!editor || !marathiEditor) {
      return;
    }

    const handlePaste = (event: ClipboardEvent) => {
      const clipboard = event.clipboardData;
      if (!clipboard) {
        return;
      }

      const html = clipboard.getData("text/html");
      if (html.trim()) {
        return;
      }

      const text = clipboard.getData("text/plain");
      if (!text.trim()) {
        return;
      }

      const detectedHtml = buildDetectedPasteHtml(text);
      if (!detectedHtml) {
        return;
      }

      event.preventDefault();
      editor.chain().focus().insertContent(detectedHtml).run();

      const detectedFont = getLikelyLegacyMarathiFontKey(text);
      if (detectedFont) {
        setTypingMode(detectedFont);
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener("paste", handlePaste);

    return () => {
      dom.removeEventListener("paste", handlePaste);
    };
  }, [editor, marathiEditor]);

  useEffect(() => {
    if (!editor || !marathiEditor) {
      return;
    }

    const resolveTypingMode = () => {
      const fontMark = editor.schema.marks.marathiEncodedFont;
      if (!fontMark) {
        return "unicode" as MarathiTypingMode;
      }

      const marks = editor.state.storedMarks ?? editor.state.selection.$from.marks();
      const activeMark = fontMark.isInSet(marks);
      const activeFont = activeMark?.attrs.fontKey;

      return activeFont === "sulekha" || activeFont === "surekh"
        ? "surekh"
        : activeFont === "shree-dev"
          ? "shree-dev"
          : "unicode";
    };

    const syncModeFromSelection = () => {
      const nextMode = resolveTypingMode();
      setTypingMode((currentMode) =>
        nextMode === "unicode" && editor.isEmpty ? currentMode : nextMode,
      );
    };

    syncModeFromSelection();
    editor.on("selectionUpdate", syncModeFromSelection);
    editor.on("transaction", syncModeFromSelection);

    return () => {
      editor.off("selectionUpdate", syncModeFromSelection);
      editor.off("transaction", syncModeFromSelection);
    };
  }, [editor, marathiEditor]);

  useEffect(() => {
    if (!editor || !marathiEditor) {
      return;
    }

    const fontMark = editor.schema.marks.marathiEncodedFont;
    if (!fontMark) {
      return;
    }

    const { state } = editor;
    const marks = state.storedMarks ?? state.selection.$from.marks();
    const activeMark = fontMark.isInSet(marks);

    if (typingMode === "unicode") {
      if (activeMark) {
        editor.view.dispatch(state.tr.setStoredMarks(activeMark.removeFromSet(marks)));
      }
      return;
    }

    if (activeMark?.attrs.fontKey === typingMode) {
      return;
    }

    const nextMark = fontMark.create({ fontKey: typingMode });
    const nextMarks = activeMark
      ? nextMark.addToSet(activeMark.removeFromSet(marks))
      : nextMark.addToSet(marks);
    editor.view.dispatch(state.tr.setStoredMarks(nextMarks));
  }, [editor, marathiEditor, typingMode]);

  useEffect(() => {
    if (!marathiEditor) {
      return;
    }

    persistMarathiTypingMode(typingMode);
  }, [marathiEditor, typingMode]);

  useEffect(() => {
    if (!equationPanelOpen) {
      return;
    }

    let disposed = false;
    void import("mathlive").then(({ MathfieldElement }) => {
      if (disposed) {
        return;
      }

      MathfieldElement.soundsDirectory = null;
      MathfieldElement.keypressSound = null;
      MathfieldElement.plonkSound = null;
      setMathliveReady(true);
    });

    return () => {
      disposed = true;
    };
  }, [equationPanelOpen]);

  useEffect(() => {
    if (!mathliveReady || !equationPanelOpen) {
      return;
    }

    const field = mathFieldRef.current;
    if (!field) {
      return;
    }

    field.setAttribute("math-virtual-keyboard-policy", "manual");
    field.setAttribute("smart-fence", "");
    field.setAttribute("smart-mode", "");
    field.setAttribute("placeholder", "Type equation here");

    const handleInput = () => {
      setEquationLatex(field.value || "");
    };

    field.addEventListener("input", handleInput);

    if (!field.value && !equationLatex) {
      field.value = DEFAULT_EQUATION;
      setEquationLatex(DEFAULT_EQUATION);
    }

    return () => {
      field.removeEventListener("input", handleInput);
    };
  }, [equationLatex, equationPanelOpen, mathliveReady]);

  useEffect(() => {
    if (!mathliveReady || !equationPanelOpen) {
      return;
    }

    const field = mathFieldRef.current;
    if (!field) {
      return;
    }

    if ((field.value || "") !== equationLatex) {
      field.value = equationLatex || "";
    }
  }, [equationLatex, equationPanelOpen, mathliveReady]);

  const applyTypingMode = useCallback(
    (nextMode: MarathiTypingMode) => {
      if (!editor || !marathiEditor) {
        return;
      }

      const fontMark = editor.schema.marks.marathiEncodedFont;
      if (!fontMark) {
        return;
      }

      setTypingMode(nextMode);

      const chain = editor.chain().focus();

      if (editor.state.selection.empty) {
        editor.commands.focus();
        const { state } = editor;
        const marks = state.storedMarks ?? state.selection.$from.marks();
        const activeMark = fontMark.isInSet(marks);
        const nextMarks =
          nextMode === "unicode"
            ? activeMark
              ? activeMark.removeFromSet(marks)
              : marks
            : fontMark
                .create({ fontKey: nextMode })
                .addToSet(activeMark ? activeMark.removeFromSet(marks) : marks);

        editor.view.dispatch(state.tr.setStoredMarks(nextMarks));
        return;
      }

      if (nextMode === "unicode") {
        chain.unsetMark("marathiEncodedFont").run();
        return;
      }

      chain
        .unsetMark("marathiEncodedFont")
        .setMark("marathiEncodedFont", { fontKey: nextMode })
        .run();
    },
    [editor, marathiEditor],
  );

  const applyTemplate = useCallback((latexValue: string) => {
    const field = mathFieldRef.current;
    if (!field) {
      return;
    }

    field.value = latexValue;
    setEquationLatex(latexValue);
    field.focus();
    field.executeCommand?.("showVirtualKeyboard");
  }, []);

  const insertEquation = useCallback(() => {
    if (!editor) {
      return;
    }

    const latexValue = (mathFieldRef.current?.value || equationLatex).trim();
    if (!latexValue) {
      return;
    }

    const nodeType = equationMode === "block" ? "blockMath" : "inlineMath";
    const chain = editor.chain().focus().insertContent({
      type: nodeType,
      attrs: { latex: latexValue },
    });

    if (equationMode === "block") {
      chain.insertContent("<p></p>");
    }

    chain.run();

    if (mathFieldRef.current) {
      mathFieldRef.current.value = "";
    }

    setEquationLatex("");
    setEquationPanelOpen(false);
  }, [editor, equationLatex, equationMode]);

  const openMathKeyboard = useCallback(() => {
    const field = mathFieldRef.current;
    if (!field) {
      return;
    }

    field.focus();
    field.executeCommand?.("showVirtualKeyboard");
  }, []);

  const editorUnavailable = !editor || disabled;
  const tableActive = Boolean(editor?.isActive("table"));
  const equationPreview = useMemo(
    () =>
      equationLatex.trim()
        ? renderEquationPreview(equationLatex.trim(), equationMode === "block")
        : "",
    [equationLatex, equationMode],
  );
  const mathFieldNode = useMemo(
    () =>
      createElement("math-field", {
        ref: (node: Element | null) => {
          mathFieldRef.current = node as MathfieldHandle | null;
        },
        className: "tc-question-math-field",
      }),
    [],
  );

  return (
    <AdminFormField label={label} hint={hint}>
      <div className="grid gap-3">
        {marathiEditor ? (
          <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              Marathi editor supports Unicode, Shree-Dev, and Surekh together.
              Choose the typing font before entering or pasting content.
            </p>
            <div className="mt-3 inline-flex rounded-full border border-[rgba(0,30,64,0.12)] bg-white p-1">
              <button
                type="button"
                className={toolbarButtonClass(typingMode === "unicode")}
                disabled={editorUnavailable}
                onClick={() => applyTypingMode("unicode")}
              >
                Unicode
              </button>
              <button
                type="button"
                className={toolbarButtonClass(typingMode === "shree-dev")}
                disabled={editorUnavailable}
                onClick={() => applyTypingMode("shree-dev")}
              >
                Shree-Dev
              </button>
              <button
                type="button"
                className={toolbarButtonClass(typingMode === "surekh")}
                disabled={editorUnavailable}
                onClick={() => applyTypingMode("surekh")}
              >
                Surekh
              </button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={toolbarButtonClass(editor?.isActive("bold"))}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            Bold
          </button>
          <button
            type="button"
            className={toolbarButtonClass(editor?.isActive("italic"))}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            Italic
          </button>
          <button
            type="button"
            className={toolbarButtonClass(editor?.isActive("underline"))}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          >
            Underline
          </button>
          <button
            type="button"
            className={toolbarButtonClass(editor?.isActive("bulletList"))}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            Bullets
          </button>
          <button
            type="button"
            className={toolbarButtonClass(editor?.isActive("orderedList"))}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            Numbered
          </button>
          <button
            type="button"
            className={toolbarButtonClass(tablePanelOpen || tableActive)}
            disabled={editorUnavailable}
            onClick={() => {
              setTablePanelOpen((open) => !open);
              setEquationPanelOpen(false);
            }}
          >
            Table
          </button>
          <button
            type="button"
            className={toolbarButtonClass(false)}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().addRowAfter().run()}
          >
            + Row
          </button>
          <button
            type="button"
            className={toolbarButtonClass(false)}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().addColumnAfter().run()}
          >
            + Col
          </button>
          <button
            type="button"
            className={toolbarButtonClass(false)}
            disabled={editorUnavailable}
            onClick={() => editor?.chain().focus().deleteTable().run()}
          >
            Del Table
          </button>
          <button
            type="button"
            className={toolbarButtonClass(equationPanelOpen)}
            disabled={editorUnavailable}
            onClick={() => {
              setEquationPanelOpen((open) => !open);
              setTablePanelOpen(false);
            }}
          >
            Equation
          </button>
          <button
            type="button"
            className={toolbarButtonClass(false)}
            disabled={editorUnavailable || !editor?.can().chain().focus().undo().run()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            Undo
          </button>
          <button
            type="button"
            className={toolbarButtonClass(false)}
            disabled={editorUnavailable || !editor?.can().chain().focus().redo().run()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            Redo
          </button>
        </div>

        {tablePanelOpen ? (
          <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
            <div className="grid gap-3 sm:grid-cols-[repeat(2,minmax(0,140px))_auto]">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                <span>Rows</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="tc-input min-h-0 py-2 text-sm"
                  value={tableDraft.rows}
                  onChange={(event) =>
                    setTableDraft((current) => ({
                      ...current,
                      rows: clampTableDimension(
                        Number(event.target.value),
                        current.rows,
                      ),
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
                <span>Columns</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="tc-input min-h-0 py-2 text-sm"
                  value={tableDraft.cols}
                  onChange={(event) =>
                    setTableDraft((current) => ({
                      ...current,
                      cols: clampTableDimension(
                        Number(event.target.value),
                        current.cols,
                      ),
                    }))
                  }
                />
              </label>
              <label className="flex items-end gap-2 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[color:var(--brand)]">
                <input
                  type="checkbox"
                  checked={tableDraft.withHeaderRow}
                  onChange={(event) =>
                    setTableDraft((current) => ({
                      ...current,
                      withHeaderRow: event.target.checked,
                    }))
                  }
                />
                Header row
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="tc-button-primary min-h-0 px-4 py-2 text-xs"
                disabled={editorUnavailable}
                onClick={() => {
                  editor
                    ?.chain()
                    .focus()
                    .insertTable({
                      cols: clampTableDimension(
                        tableDraft.cols,
                        DEFAULT_TABLE_DRAFT.cols,
                      ),
                      rows: clampTableDimension(
                        tableDraft.rows,
                        DEFAULT_TABLE_DRAFT.rows,
                      ),
                      withHeaderRow: tableDraft.withHeaderRow,
                    })
                    .run();
                  setTablePanelOpen(false);
                }}
              >
                Insert table
              </button>
              <button
                type="button"
                className="tc-button-secondary min-h-0 px-4 py-2 text-xs"
                disabled={editorUnavailable}
                onClick={() => editor?.chain().focus().addRowBefore().run()}
              >
                Add row above
              </button>
              <button
                type="button"
                className="tc-button-secondary min-h-0 px-4 py-2 text-xs"
                disabled={editorUnavailable}
                onClick={() => editor?.chain().focus().addRowAfter().run()}
              >
                Add row below
              </button>
              <button
                type="button"
                className="tc-button-secondary min-h-0 px-4 py-2 text-xs"
                disabled={editorUnavailable}
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
              >
                Add column left
              </button>
              <button
                type="button"
                className="tc-button-secondary min-h-0 px-4 py-2 text-xs"
                disabled={editorUnavailable}
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
              >
                Add column right
              </button>
            </div>
          </div>
        ) : null}

        {equationPanelOpen ? (
          <div className="rounded-[22px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-4">
            <p className="text-sm font-semibold text-[color:var(--brand)]">
              Equation assistant
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              Use templates, the math keyboard, or direct LaTeX to compose
              mathematical expressions and insert them into the question.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {EQUATION_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  type="button"
                  className="tc-button-secondary min-h-0 px-3 py-2 text-xs"
                  onClick={() => applyTemplate(template.value)}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={
                  equationMode === "inline"
                    ? "tc-button-primary"
                    : "tc-button-secondary"
                }
                onClick={() => setEquationMode("inline")}
              >
                Inline equation
              </button>
              <button
                type="button"
                className={
                  equationMode === "block"
                    ? "tc-button-primary"
                    : "tc-button-secondary"
                }
                onClick={() => setEquationMode("block")}
              >
                New line equation
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                disabled={!mathliveReady}
                onClick={openMathKeyboard}
              >
                Open math keyboard
              </button>
            </div>

            <div className="mt-4 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-[rgba(255,255,255,0.72)] p-3">
              {mathliveReady ? (
                mathFieldNode
              ) : (
                <p className="text-sm text-[color:var(--muted)]">
                  Loading equation editor...
                </p>
              )}
            </div>

            <label className="mt-4 grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted)]">
              <span>LaTeX source</span>
              <textarea
                className="tc-input min-h-28 resize-y font-mono text-sm"
                placeholder="Paste or type LaTeX for complex equations"
                value={equationLatex}
                onChange={(event) => setEquationLatex(event.target.value)}
              />
            </label>

            {equationPreview ? (
              <div className="mt-4 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-[rgba(0,51,102,0.03)] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Preview
                </p>
                <div
                  className={joinClasses(
                    "tc-rich-html mt-3",
                    equationMode === "block" && "text-center",
                  )}
                  dangerouslySetInnerHTML={{ __html: equationPreview }}
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="tc-button-primary"
                disabled={editorUnavailable || !equationLatex.trim()}
                onClick={insertEquation}
              >
                Insert equation
              </button>
              <button
                type="button"
                className="tc-button-secondary"
                onClick={() => {
                  if (mathFieldRef.current) {
                    mathFieldRef.current.value = "";
                  }
                  setEquationLatex("");
                  setEquationPanelOpen(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

        <div className="tc-input overflow-hidden rounded-[22px] p-0" style={{ minHeight }}>
          <EditorContent editor={editor} />
        </div>

        {showPreview && value.trim() ? (
          <div className="rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-[rgba(255,255,255,0.72)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              Preview
            </p>
            <QuestionRichTextRenderer
              className="mt-3 text-sm leading-6 text-[color:var(--foreground)]"
              html={value}
            />
          </div>
        ) : null}
      </div>
    </AdminFormField>
  );
}
