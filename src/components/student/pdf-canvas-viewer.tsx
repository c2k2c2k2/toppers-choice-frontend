"use client";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import { buildNoteContentUrl } from "@/lib/notes";
import { NoteWatermarkOverlay } from "@/components/student/note-watermark-overlay";
import type { NoteWatermarkResponse } from "@/lib/notes";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const MAX_BASE_PAGE_WIDTH = 980;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.4;
const ZOOM_STEP = 0.15;

function clampPage(page: number, pageCount: number) {
  if (!pageCount) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(page), 1), pageCount);
}

function clampZoom(zoom: number) {
  return Math.min(Math.max(zoom, MIN_ZOOM), MAX_ZOOM);
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
}

type ViewerControlIcon =
  | "first"
  | "last"
  | "minus"
  | "next"
  | "plus"
  | "previous";

function ViewerControlGlyph({
  icon,
}: Readonly<{
  icon: ViewerControlIcon;
}>) {
  if (icon === "first") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M18 6L12 12L18 18" />
        <path d="M12 6L6 12L12 18" />
      </svg>
    );
  }

  if (icon === "last") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M6 6L12 12L6 18" />
        <path d="M12 6L18 12L12 18" />
      </svg>
    );
  }

  if (icon === "minus" || icon === "plus") {
    return (
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M5 12H19" />
        {icon === "plus" ? <path d="M12 5V19" /> : null}
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={icon === "next" ? "M9 6L15 12L9 18" : "M15 6L9 12L15 18"} />
    </svg>
  );
}

function ViewerControlButton({
  disabled = false,
  icon,
  label,
  onClick,
}: Readonly<{
  disabled?: boolean;
  icon: ViewerControlIcon;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/90 text-[color:var(--brand)] shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[rgba(0,51,102,0.18)] hover:bg-white disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-45"
      disabled={disabled}
      onClick={onClick}
      title={label}
    >
      <ViewerControlGlyph icon={icon} />
    </button>
  );
}

export function PdfCanvasViewer({
  gestureDirection = "horizontal",
  initialPage = 1,
  initialZoom = 1,
  noteViewSessionId,
  noteViewToken,
  onError,
  onPageChange,
  onReady,
  onZoomChange,
  requestedPage,
  shellClassName,
  showToolbar = true,
  watermarkPayload,
}: Readonly<{
  gestureDirection?: "horizontal" | "vertical";
  initialPage?: number;
  initialZoom?: number;
  noteViewSessionId: string;
  noteViewToken: string;
  onError?: (message: string) => void;
  onPageChange?: (page: number, totalPages: number) => void;
  onReady?: (totalPages: number) => void;
  onZoomChange?: (zoom: number) => void;
  requestedPage?: number;
  shellClassName?: string;
  showToolbar?: boolean;
  watermarkPayload?: NoteWatermarkResponse | null;
}>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const documentRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [documentProxy, setDocumentProxy] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [zoom, setZoom] = useState(clampZoom(initialZoom));
  const emitError = useEffectEvent((message: string) => {
    onError?.(message);
  });
  const emitPageChange = useEffectEvent((page: number, totalPages: number) => {
    onPageChange?.(page, totalPages);
  });
  const emitReady = useEffectEvent((totalPages: number) => {
    onReady?.(totalPages);
  });
  const emitZoomChange = useEffectEvent((nextZoom: number) => {
    onZoomChange?.(nextZoom);
  });

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setZoom(clampZoom(initialZoom));
  }, [initialZoom]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingDocument(true);
    setDocumentProxy(null);
    setPageCount(0);
    setPageNumber(initialPage);
    setPageInput(String(initialPage));

    const loadingTask = pdfjsLib.getDocument({
      httpHeaders: {
        Authorization: `Bearer ${noteViewToken}`,
      },
      rangeChunkSize: 131_072,
      url: buildNoteContentUrl(noteViewSessionId),
      withCredentials: false,
    });

    loadingTask.promise
      .then((documentInstance) => {
        if (cancelled) {
          void documentInstance.destroy();
          return;
        }

        documentRef.current = documentInstance;
        setDocumentProxy(documentInstance);
        setPageCount(documentInstance.numPages);
        setPageNumber(clampPage(initialPage, documentInstance.numPages));
        setPageInput(String(clampPage(initialPage, documentInstance.numPages)));
        emitReady(documentInstance.numPages);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }

        emitError(
          error instanceof Error ? error.message : "Failed to load the note PDF.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingDocument(false);
        }
      });

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      const activeDocument = documentRef.current;
      documentRef.current = null;
      if (activeDocument) {
        void activeDocument.destroy();
      } else {
        loadingTask.destroy();
      }
    };
  }, [initialPage, noteViewSessionId, noteViewToken]);

  useEffect(() => {
    setPageInput(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    if (!Number.isFinite(requestedPage)) {
      return;
    }

    setPageNumber((currentPage) => {
      const nextPage = clampPage(requestedPage ?? currentPage, pageCount);
      return nextPage === currentPage ? currentPage : nextPage;
    });
  }, [pageCount, requestedPage]);

  useEffect(() => {
    emitZoomChange(zoom);
  }, [zoom]);

  useEffect(() => {
    if (!documentProxy || !canvasRef.current || !containerWidth) {
      return;
    }

    let cancelled = false;

    const renderPage = async () => {
      try {
        renderTaskRef.current?.cancel();

        const page = await documentProxy.getPage(pageNumber);
        if (cancelled) {
          return;
        }

        const viewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(
          Math.min(containerWidth - 32, MAX_BASE_PAGE_WIDTH),
          220,
        );
        const scale = (availableWidth / viewport.width) * clampZoom(zoom);
        const scaledViewport = page.getViewport({ scale });
        const canvas = canvasRef.current;

        if (!canvas) {
          return;
        }

        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          return;
        }

        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(scaledViewport.width * pixelRatio);
        canvas.height = Math.floor(scaledViewport.height * pixelRatio);
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        renderTaskRef.current = page.render({
          canvas,
          canvasContext: context,
          viewport: scaledViewport,
        });

        await renderTaskRef.current.promise;

        if (!cancelled) {
          emitPageChange(pageNumber, documentProxy.numPages);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (
          error instanceof Error &&
          (error.name === "RenderingCancelledException" ||
            error.message.toLowerCase().includes("rendering cancelled"))
        ) {
          return;
        }

        emitError(
          error instanceof Error ? error.message : "Failed to render the note page.",
        );
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [containerWidth, documentProxy, pageNumber, zoom]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPageNumber((currentPage) => clampPage(currentPage + 1, pageCount));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPageNumber((currentPage) => clampPage(currentPage - 1, pageCount));
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pageCount]);

  function goToPage(nextPage: number) {
    if (!Number.isFinite(nextPage)) {
      setPageInput(String(pageNumber));
      return;
    }

    setPageNumber(clampPage(nextPage, pageCount));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touchStart = touchStartRef.current;
    touchStartRef.current = null;

    if (!touchStart) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (gestureDirection === "vertical") {
      if (Math.abs(deltaY) < 60 || Math.abs(deltaX) > 90) {
        return;
      }

      if (deltaY < 0) {
        goToPage(pageNumber + 1);
      } else {
        goToPage(pageNumber - 1);
      }
      return;
    }

    if (Math.abs(deltaX) >= 60 && Math.abs(deltaY) <= 90) {
      if (deltaX < 0) {
        goToPage(pageNumber + 1);
      } else {
        goToPage(pageNumber - 1);
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {showToolbar ? (
        <div className="tc-student-panel rounded-[24px] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ViewerControlButton
                disabled={pageNumber <= 1}
                icon="first"
                label="Go to the first page"
                onClick={() => goToPage(1)}
              />
              <ViewerControlButton
                disabled={pageNumber <= 1}
                icon="previous"
                label="Go to the previous page"
                onClick={() => goToPage(pageNumber - 1)}
              />
              <ViewerControlButton
                disabled={pageNumber >= pageCount}
                icon="next"
                label="Go to the next page"
                onClick={() => goToPage(pageNumber + 1)}
              />
              <ViewerControlButton
                disabled={pageNumber >= pageCount}
                icon="last"
                label="Go to the last page"
                onClick={() => goToPage(pageCount)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex min-h-[2.75rem] items-center gap-2 rounded-full border border-[rgba(0,30,64,0.08)] bg-white/82 px-4 py-2 shadow-[var(--shadow-soft)]">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Page
                </span>
                <input
                  inputMode="numeric"
                  value={pageInput}
                  onBlur={() => goToPage(Number(pageInput))}
                  onChange={(event) => setPageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      goToPage(Number(pageInput));
                    }
                  }}
                  className="w-14 border-none bg-transparent text-center text-sm font-semibold text-[color:var(--brand)] outline-none"
                />
                <span className="text-sm text-[color:var(--muted)]">/ {pageCount}</span>
              </label>

              <div className="flex min-h-[2.75rem] items-center gap-2 rounded-full border border-[rgba(0,30,64,0.08)] bg-white/82 px-2 py-2 shadow-[var(--shadow-soft)]">
                <ViewerControlButton
                  disabled={zoom <= MIN_ZOOM}
                  icon="minus"
                  label="Zoom out"
                  onClick={() =>
                    setZoom((currentZoom) => clampZoom(currentZoom - ZOOM_STEP))
                  }
                />
                <span className="min-w-14 text-center text-sm font-semibold text-[color:var(--brand)]">
                  {Math.round(zoom * 100)}%
                </span>
                <ViewerControlButton
                  disabled={zoom >= MAX_ZOOM}
                  icon="plus"
                  label="Zoom in"
                  onClick={() =>
                    setZoom((currentZoom) => clampZoom(currentZoom + ZOOM_STEP))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={[
          "tc-student-panel overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#11233d_0%,#0b182a_100%)] p-3 sm:p-5",
          shellClassName ?? "",
        ].join(" ")}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        <div className="mx-auto flex min-h-[18rem] items-center justify-center">
          {isLoadingDocument ? (
            <div className="space-y-3 text-center text-white/80">
              <p className="tc-overline text-white/70">Secure reader</p>
              <p className="text-sm">Loading the protected PDF stream...</p>
            </div>
          ) : (
            <div className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
              <canvas ref={canvasRef} className="block max-w-full" />
              <NoteWatermarkOverlay payload={watermarkPayload} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
