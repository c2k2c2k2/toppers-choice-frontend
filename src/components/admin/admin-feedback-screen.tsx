"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthenticatedFilePreview } from "@/components/primitives/file-preview";
import { useAuthenticatedMutation, useAuthenticatedQuery, useAuthSession } from "@/lib/auth";
import { getApiErrorMessage } from "@/lib/auth/session-utils";
import {
  listAdminFeedback,
  updateAdminFeedback,
  type UpdateFeedbackPayload,
} from "@/lib/admin/feedback-api";
import type { FeedbackPriority, FeedbackStatus, FeedbackTicket } from "@/lib/feedback-api";

const STATUS_OPTIONS: FeedbackStatus[] = ["OPEN", "IN_REVIEW", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS: FeedbackPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];

export function AdminFeedbackScreen() {
  const authSession = useAuthSession();
  const queryClient = useQueryClient();
  const canManage = authSession.hasPermission("feedback.manage");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<FeedbackStatus | "">("");
  const [priority, setPriority] = useState<FeedbackPriority | "">("");
  const [adminNote, setAdminNote] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const feedbackQuery = useAuthenticatedQuery({
    queryFn: (accessToken) => listAdminFeedback(accessToken, { take: 100 }),
    queryKey: ["admin", "feedback"],
  });
  const selected = useMemo(
    () => feedbackQuery.data?.items.find((item) => item.id === selectedId) ?? feedbackQuery.data?.items[0] ?? null,
    [feedbackQuery.data?.items, selectedId],
  );

  const updateMutation = useAuthenticatedMutation({
    mutationFn: async (payload: UpdateFeedbackPayload, accessToken) => {
      if (!selected) throw new Error("Select feedback first.");
      return updateAdminFeedback(selected.id, payload, accessToken);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "feedback"] });
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(getApiErrorMessage(error, "Feedback could not be updated."));
    },
  });

  function loadTicket(ticket: FeedbackTicket) {
    setSelectedId(ticket.id);
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAdminNote(ticket.adminNote ?? "");
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="tc-card rounded-[28px] p-6">
        <p className="tc-overline">User voice</p>
        <h1 className="tc-display mt-3 text-2xl font-semibold">Feedback inbox</h1>
        <div className="mt-5 grid gap-3">
          {(feedbackQuery.data?.items ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
              className="tc-panel rounded-[18px] p-4 text-left"
              data-active={selected?.id === item.id}
              onClick={() => loadTicket(item)}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[color:var(--brand)]">{item.subject}</p>
                <span className="tc-student-chip">{item.status}</span>
              </div>
              <p className="tc-muted mt-2 line-clamp-2 text-sm">{item.message}</p>
              <p className="tc-muted mt-2 text-xs">{item.userEmail ?? "Unknown user"} · {item.category}</p>
            </button>
          ))}
          {!feedbackQuery.isLoading && (feedbackQuery.data?.items.length ?? 0) === 0 ? (
            <p className="tc-muted text-sm">No feedback submitted yet.</p>
          ) : null}
        </div>
      </div>

      <div className="tc-card rounded-[28px] p-6">
        {selected ? (
          <div className="grid gap-4">
            <div>
              <p className="tc-overline">{selected.category}</p>
              <h2 className="tc-display mt-2 text-2xl font-semibold">{selected.subject}</h2>
              <p className="tc-muted mt-2 text-sm">{selected.userEmail ?? "Unknown user"}</p>
            </div>
            <p className="rounded-[18px] bg-[color:var(--surface-student)] p-4 text-sm leading-6 text-[color:var(--brand)]">{selected.message}</p>
            <div className="grid gap-2 text-sm">
              <p><strong>Page:</strong> {selected.pageUrl ?? "Not captured"}</p>
              <p><strong>Submitted:</strong> {new Date(selected.createdAt).toLocaleString()}</p>
              <p><strong>Attachments:</strong> {selected.attachments.length}</p>
            </div>
            {selected.attachments.length > 0 ? (
              <div>
                <p className="tc-form-label">Attachment previews</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {selected.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 rounded-[18px] border border-[rgba(0,30,64,0.08)] bg-white/78 p-3"
                    >
                      <AuthenticatedFilePreview
                        assetId={attachment.fileAssetId}
                        contentType={attachment.contentType}
                        fileName={attachment.originalFileName ?? attachment.label ?? "Attachment"}
                        label="Preview feedback attachment"
                        thumbClassName="h-16 w-16"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[color:var(--brand)]">
                          {attachment.originalFileName ?? attachment.label ?? "Attachment"}
                        </p>
                        <p className="mt-1 text-xs text-[color:var(--muted)]">
                          {attachment.contentType ?? "File"} · {attachment.status ?? "READY"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="tc-form-field">
                <span className="tc-form-label">Status</span>
                <select className="tc-input" value={status || selected.status} onChange={(event) => setStatus(event.target.value as FeedbackStatus)}>
                  {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="tc-form-field">
                <span className="tc-form-label">Priority</span>
                <select className="tc-input" value={priority || selected.priority} onChange={(event) => setPriority(event.target.value as FeedbackPriority)}>
                  {PRIORITY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <label className="tc-form-field">
              <span className="tc-form-label">Admin note</span>
              <textarea className="tc-input min-h-32" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} />
            </label>
            {errorMessage ? <p className="text-sm text-[#9a3412]">{errorMessage}</p> : null}
            <button
              className="tc-button-primary"
              disabled={!canManage || updateMutation.isPending}
              onClick={() => updateMutation.mutate({ status: status || selected.status, priority: priority || selected.priority, adminNote })}
            >
              {updateMutation.isPending ? "Saving..." : "Update feedback"}
            </button>
          </div>
        ) : (
          <p className="tc-muted text-sm">Select feedback to review.</p>
        )}
      </div>
    </section>
  );
}
