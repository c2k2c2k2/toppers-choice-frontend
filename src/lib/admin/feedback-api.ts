import { apiRequest } from "@/lib/api/client";
import { withQuery, type QueryValue } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  FeedbackCategory,
  FeedbackListResponse,
  FeedbackPriority,
  FeedbackStatus,
  FeedbackTicket,
} from "@/lib/feedback-api";

export interface AdminFeedbackQuery extends Record<string, QueryValue> {
  status?: FeedbackStatus;
  category?: FeedbackCategory;
  priority?: FeedbackPriority;
  take?: number;
}

export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  adminNote?: string;
  assignedToUserId?: string | null;
}

export function listAdminFeedback(
  accessToken: string,
  query: AdminFeedbackQuery = {},
) {
  return apiRequest<FeedbackListResponse>(
    withQuery(apiRoutes.admin.feedback.list, query),
    {
      accessToken,
      cache: "no-store",
    },
  );
}

export function updateAdminFeedback(
  feedbackId: string,
  payload: UpdateFeedbackPayload,
  accessToken: string,
) {
  return apiRequest<FeedbackTicket>(apiRoutes.admin.feedback.detail(feedbackId), {
    method: "PATCH",
    accessToken,
    body: payload,
  });
}
