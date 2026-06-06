"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { LocalFilePreview } from "@/components/primitives/file-preview";
import { useAuthenticatedMutation } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/auth/session-utils";
import { createFeedback, type FeedbackCategory } from "@/lib/feedback-api";
import { uploadSelfServiceFile } from "@/lib/files-api";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("FEEDBACK");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timerId = window.setTimeout(() => {
      setNotice(null);
    }, 3500);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [notice]);

  const submitMutation = useAuthenticatedMutation({
    mutationFn: async (_: void, accessToken) => {
      const attachments = file
        ? [
            {
              fileAssetId: (
                await uploadSelfServiceFile({
                  accessToken,
                  file,
                  purpose: "FEEDBACK_ATTACHMENT",
                })
              ).id,
              label: file.name,
            },
          ]
        : [];

      return createFeedback(
        {
          category,
          subject,
          message,
          pageUrl:
            typeof window === "undefined"
              ? pathname
              : `${window.location.pathname}${window.location.search}`,
          pageTitle: typeof document === "undefined" ? undefined : document.title,
          contextJson:
            typeof window === "undefined"
              ? undefined
              : {
                  viewport: `${window.innerWidth}x${window.innerHeight}`,
                  pathname,
                },
          attachments,
        },
        accessToken,
      );
    },
    onSuccess: () => {
      setNotice("Feedback submitted. Thank you.");
      setSubject("");
      setMessage("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsOpen(false);
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Feedback could not be submitted."));
    },
  });

  return (
    <div className="fixed bottom-20 right-3 z-40 max-w-[calc(100vw-1.5rem)] md:bottom-5 md:right-5">
      {isOpen ? (
        <form
          className="tc-card max-h-[min(42rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-1.5rem))] overflow-y-auto overflow-x-hidden rounded-[22px] p-4 shadow-[0_18px_48px_rgba(0,30,64,0.16)]"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);
            setNotice(null);
            submitMutation.mutate();
          }}
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate font-semibold text-[color:var(--brand)]">Share feedback</p>
            <button type="button" className="tc-button-secondary" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
          <div className="mt-4 grid min-w-0 gap-3">
            <select className="tc-input w-full min-w-0" value={category} onChange={(event) => setCategory(event.target.value as FeedbackCategory)}>
              <option value="FEEDBACK">Feedback</option>
              <option value="COMPLAINT">Complaint</option>
              <option value="SUGGESTION">Suggestion</option>
              <option value="BUG">Bug</option>
            </select>
            <input className="tc-input w-full min-w-0" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Short subject" required maxLength={160} />
            <textarea className="tc-input min-h-28 w-full min-w-0 resize-y" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What happened?" required maxLength={3000} />
            <input
              ref={fileInputRef}
              className="tc-input w-full min-w-0 max-w-full overflow-hidden text-sm"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            {file ? (
              <LocalFilePreview
                file={file}
                onRemove={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              />
            ) : null}
            {errorMessage ? <p className="text-sm text-[#9a3412]">{errorMessage}</p> : null}
            <button className="tc-button-primary" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Sending..." : "Submit"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--brand)] text-white shadow-[0_14px_32px_rgba(0,30,64,0.18)] transition hover:scale-[1.03]"
          aria-label="Share feedback"
          title="Share feedback"
          onClick={() => {
            setNotice(null);
            setErrorMessage(null);
            setIsOpen(true);
          }}
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.2A8 8 0 1 1 21 12Z" />
            <path d="M8 10h8" />
            <path d="M8 14h5" />
          </svg>
        </button>
      )}
      {notice ? (
        <div
          className="fixed right-3 top-4 z-[95] max-w-[calc(100vw-1.5rem)] rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--brand)] shadow-[0_16px_44px_rgba(0,30,64,0.16)] md:right-5"
          role="status"
        >
          {notice}
        </div>
      ) : null}
    </div>
  );
}
