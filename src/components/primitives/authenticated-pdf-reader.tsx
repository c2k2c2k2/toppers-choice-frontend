"use client";

import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "@/lib/api/config";
import { useAuthSession } from "@/lib/auth";
import { PdfCanvasViewer } from "@/components/student/pdf-canvas-viewer";
import { useStudentShellStore } from "@/stores";

export type AuthenticatedPdfAsset = {
  id: string;
  originalFileName: string;
  protectedDeliveryPath: string;
};

export function AuthenticatedPdfReader({
  asset,
  className = "",
  mobileZen = true,
  onClose,
  title,
}: Readonly<{
  asset: AuthenticatedPdfAsset;
  className?: string;
  mobileZen?: boolean;
  onClose?: () => void;
  title?: string;
}>) {
  const authSession = useAuthSession();
  const setBottomNavVisible = useStudentShellStore(
    (state) => state.setBottomNavVisible,
  );
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isZenDismissed, setIsZenDismissed] = useState(false);
  const [requestedPage, setRequestedPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const sourceHeaders = useMemo(
    () =>
      accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    [accessToken],
  );
  const isZenMode = mobileZen && isMobileViewport && !isZenDismissed;
  const displayTitle = title ?? asset.originalFileName;

  useEffect(() => {
    let isCancelled = false;

    async function loadToken() {
      setErrorMessage(null);
      const token = await authSession.ensureAccessToken();

      if (isCancelled) {
        return;
      }

      if (!token) {
        setErrorMessage("Sign in is required to open this PDF.");
        setAccessToken(null);
        return;
      }

      setAccessToken(token);
    }

    void loadToken().catch((error) => {
      if (!isCancelled) {
        setErrorMessage(
          error instanceof Error ? error.message : "The PDF could not be opened.",
        );
        setAccessToken(null);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [asset.id, authSession]);

  useEffect(() => {
    const updateViewportState = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };

    updateViewportState();
    window.addEventListener("resize", updateViewportState);
    return () => window.removeEventListener("resize", updateViewportState);
  }, []);

  useEffect(() => {
    if (!isZenMode) {
      return;
    }

    setBottomNavVisible(false);
    return () => setBottomNavVisible(true);
  }, [isZenMode, setBottomNavVisible]);

  function handleCloseZenReader() {
    if (onClose) {
      onClose();
      return;
    }

    setIsZenDismissed(true);
  }

  function movePage(delta: number) {
    const maxPage = Math.max(totalPages, 1);
    const nextPage = Math.min(Math.max(currentPage + delta, 1), maxPage);
    setRequestedPage(nextPage);
    setCurrentPage(nextPage);
  }

  if (errorMessage) {
    return (
      <div className={`grid min-h-[24rem] place-items-center rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-6 text-center ${className}`}>
        <div>
          <p className="text-sm font-semibold text-[#8b2026]">{errorMessage}</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Try again after refreshing your session.
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken || !sourceHeaders) {
    return (
      <div className={`grid min-h-[24rem] place-items-center rounded-[24px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-6 text-center ${className}`}>
        <div>
          <p className="tc-overline">Loading PDF</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Preparing {asset.originalFileName}
          </p>
        </div>
      </div>
    );
  }

  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-[90] flex flex-col bg-[rgba(7,17,31,0.98)] p-0 text-white sm:p-4">
        <div className="z-30 mx-2 mt-2 flex min-h-[3.25rem] shrink-0 items-center justify-between gap-2 rounded-[18px] bg-[rgba(7,17,31,0.42)] px-3 py-2 backdrop-blur-md sm:mx-0 sm:mt-0">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-white/55">
              Zen reader
            </p>
            <p className="truncate text-xs font-semibold sm:text-sm">
              {displayTitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-bold leading-none text-white/88">
              Page {currentPage}
            </span>
            <button
              type="button"
              aria-label="Close PDF reader"
              className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-white/12 bg-white/10 text-white/88 transition hover:bg-white/16"
              onClick={handleCloseZenReader}
              title="Close PDF reader"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-0 pt-2 sm:pt-3">
          <div className="relative h-full">
            <PdfCanvasViewer
              fitMode="width"
              gestureDirection="horizontal"
              onPageChange={(page, pageCount) => {
                setCurrentPage(page);
                setTotalPages(pageCount);
              }}
              onReady={(pageCount) => setTotalPages(pageCount)}
              requestedPage={requestedPage}
              shellClassName="h-full min-h-0 rounded-none border-0 bg-[linear-gradient(180deg,#08111f_0%,#040914_100%)] !p-0 sm:rounded-[28px]"
              showToolbar={false}
              sourceHeaders={sourceHeaders}
              sourceUrl={buildApiUrl(asset.protectedDeliveryPath)}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-3 z-30 flex justify-center px-3 sm:bottom-4">
              <div className="pointer-events-auto grid w-full max-w-md grid-cols-2 gap-2 rounded-[22px] border border-white/12 bg-[rgba(7,17,31,0.58)] p-2 text-white shadow-[0_18px_44px_rgba(0,0,0,0.24)] backdrop-blur-md">
                <button
                  type="button"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-white/10 px-3 text-sm font-bold text-white/90 transition hover:bg-white/16 disabled:cursor-not-allowed disabled:text-white/42"
                  disabled={currentPage <= 1}
                  onClick={() => movePage(-1)}
                >
                  <span aria-hidden="true">&lt;</span>
                  Previous
                </button>
                <button
                  type="button"
                  className="flex min-h-12 items-center justify-center gap-2 rounded-[16px] bg-white text-sm font-bold text-[color:var(--brand)] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-white/16 disabled:text-white/42 disabled:shadow-none"
                  disabled={totalPages > 0 && currentPage >= totalPages}
                  onClick={() => movePage(1)}
                >
                  Next
                  <span aria-hidden="true">&gt;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-[78vh] min-h-[28rem] flex-col ${className}`}>
      <PdfCanvasViewer
        fitMode="width"
        gestureDirection="horizontal"
        onPageChange={(page, pageCount) => {
          setCurrentPage(page);
          setTotalPages(pageCount);
        }}
        onReady={(pageCount) => setTotalPages(pageCount)}
        requestedPage={requestedPage}
        shellClassName="min-h-0 flex-1"
        sourceHeaders={sourceHeaders}
        sourceUrl={buildApiUrl(asset.protectedDeliveryPath)}
      />
    </div>
  );
}
