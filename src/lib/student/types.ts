import type {
  ApiJsonResponse,
  ApiSchema,
} from "@/lib/api/openapi";

export type StudentCatalogResponse = ApiJsonResponse<"/api/v1/catalog", "get">;
export type StudentCmsResolveResponse =
  ApiJsonResponse<"/api/v1/cms/student/resolve", "get">;
export type StudentCmsPage =
  ApiJsonResponse<"/api/v1/cms/student/pages/{slug}", "get">;
export type StudentAnalyticsSummary =
  ApiJsonResponse<"/api/v1/analytics/me/summary", "get">;
export type StudentNotificationFeed =
  ApiJsonResponse<"/api/v1/notifications/me", "get">;

export type StudentExamTrack = StudentCatalogResponse["examTracks"][number];
export type StudentMedium = StudentCatalogResponse["mediums"][number];
export type StudentSubject = StudentCatalogResponse["subjects"][number];
export type StudentTopicTreeNode = StudentSubject["topics"][number];
export type StudentNotificationMessage = StudentNotificationFeed["items"][number];
export type StudentAnnouncement = StudentCmsResolveResponse["announcements"][number];
export type StudentSection = StudentCmsResolveResponse["sections"][number];

export type NotificationPreference = ApiSchema<"NotificationPreferenceResponseDto">;

export interface StudentDashboardBootstrap {
  analytics: StudentAnalyticsSummary;
  catalog: StudentCatalogResponse;
  cms: StudentCmsResolveResponse;
  notifications: StudentNotificationFeed;
}

export interface StudentCatalogSnapshot {
  selectedMedium: StudentMedium | null;
  selectedTrack: StudentExamTrack | null;
  subjects: StudentSubject[];
}
