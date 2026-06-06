import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";

export type FeedbackCategory = "FEEDBACK" | "COMPLAINT" | "SUGGESTION" | "BUG";
export type FeedbackStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "CLOSED";
export type FeedbackPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface FeedbackAttachmentInput {
  fileAssetId: string;
  label?: string;
}

export interface CreateFeedbackPayload {
  category: FeedbackCategory;
  subject: string;
  message: string;
  pageUrl?: string;
  pageTitle?: string;
  contextJson?: Record<string, unknown>;
  attachments?: FeedbackAttachmentInput[];
}

export interface FeedbackTicket {
  id: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  subject: string;
  message: string;
  pageUrl?: string | null;
  pageTitle?: string | null;
  adminNote?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  attachments: Array<{
    id: string;
    fileAssetId: string;
    label?: string | null;
    originalFileName?: string | null;
    contentType?: string | null;
    status?: string | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackListResponse {
  items: FeedbackTicket[];
  total: number;
}

export function createFeedback(payload: CreateFeedbackPayload, accessToken: string) {
  return apiRequest<FeedbackTicket>(apiRoutes.feedback.create, {
    method: "POST",
    accessToken,
    body: payload,
  });
}

export function listMyFeedback(accessToken: string) {
  return apiRequest<FeedbackListResponse>(
    withQuery(apiRoutes.feedback.listMine, { take: 10 }),
    {
      accessToken,
      cache: "no-store",
    },
  );
}
