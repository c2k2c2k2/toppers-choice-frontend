import type { components, operations } from "@/lib/api/generated/backend-schema";

export type AdminUser = components["schemas"]["UserIdentityResponseDto"];
export type AdminUsersListResponse = components["schemas"]["AdminUsersListResponseDto"];
export type CreateStudentUserInput = components["schemas"]["CreateStudentUserDto"];
export type CreateAdminUserInput = components["schemas"]["CreateAdminUserDto"];
export type UpdateUserStatusInput = components["schemas"]["UpdateUserStatusDto"];

export type AdminPermission = components["schemas"]["PermissionResponseDto"];
export type AdminPermissionsListResponse =
  components["schemas"]["PermissionsListResponseDto"];
export type AdminRole = components["schemas"]["RoleResponseDto"];
export type AdminRolesListResponse = components["schemas"]["RolesListResponseDto"];
export type CreateRoleInput = components["schemas"]["CreateRoleDto"];
export type UpdateRoleInput = components["schemas"]["UpdateRoleDto"];
export type UserAccessResponse = components["schemas"]["UserAccessResponseDto"];
export type UserPermissionOverride =
  components["schemas"]["UserPermissionOverrideResponseDto"];
export type PermissionOverrideInput =
  components["schemas"]["PermissionOverrideInputDto"];
export type SetUserAccessInput = components["schemas"]["SetUserAccessDto"];
export type AuditLog = components["schemas"]["AuditLogResponseDto"];
export type AuditLogsListResponse = components["schemas"]["AuditLogsListResponseDto"];

export type ExamTrack = components["schemas"]["ExamTrackResponseDto"];
export type Medium = components["schemas"]["MediumResponseDto"];
export type Subject = components["schemas"]["SubjectResponseDto"];
export type Topic = components["schemas"]["TopicResponseDto"];
export type Tag = components["schemas"]["TagResponseDto"];
export type CreateExamTrackInput = components["schemas"]["CreateExamTrackDto"];
export type UpdateExamTrackInput = components["schemas"]["UpdateExamTrackDto"];
export type CreateMediumInput = components["schemas"]["CreateMediumDto"];
export type UpdateMediumInput = components["schemas"]["UpdateMediumDto"];
export type CreateSubjectInput = components["schemas"]["CreateSubjectDto"];
export type UpdateSubjectInput = components["schemas"]["UpdateSubjectDto"];
export type CreateTopicInput = components["schemas"]["CreateTopicDto"];
export type UpdateTopicInput = components["schemas"]["UpdateTopicDto"];
export type CreateTagInput = components["schemas"]["CreateTagDto"];
export type UpdateTagInput = components["schemas"]["UpdateTagDto"];
export type ReorderTaxonomyInput = components["schemas"]["ReorderTaxonomyDto"];

export type FileAsset = components["schemas"]["FileAssetResponseDto"];
export type FileAssetListResponse = components["schemas"]["FileAssetListResponseDto"];
export type InitFileUploadInput = components["schemas"]["InitFileUploadDto"];
export type InitFileUploadResponse = components["schemas"]["InitFileUploadResponseDto"];

export type CmsAssetSummary = components["schemas"]["CmsAssetSummaryResponseDto"];
export type CmsPage = components["schemas"]["CmsPageResponseDto"];
export type CmsBanner = components["schemas"]["CmsBannerResponseDto"];
export type CmsAnnouncement = components["schemas"]["CmsAnnouncementResponseDto"];
export type CmsSection = components["schemas"]["CmsSectionResponseDto"];
export type CmsPageListResponse = components["schemas"]["CmsPagesListResponseDto"];
export type CmsBannerListResponse =
  components["schemas"]["CmsBannersListResponseDto"];
export type CmsAnnouncementListResponse =
  components["schemas"]["CmsAnnouncementsListResponseDto"];
export type CmsSectionListResponse =
  components["schemas"]["CmsSectionsListResponseDto"];
export type CreateCmsPageInput = components["schemas"]["CreateCmsPageDto"];
export type UpdateCmsPageInput = components["schemas"]["UpdateCmsPageDto"];
export type CreateCmsBannerInput = components["schemas"]["CreateCmsBannerDto"];
export type UpdateCmsBannerInput = components["schemas"]["UpdateCmsBannerDto"];
export type CreateCmsAnnouncementInput =
  components["schemas"]["CreateCmsAnnouncementDto"];
export type UpdateCmsAnnouncementInput =
  components["schemas"]["UpdateCmsAnnouncementDto"];
export type CreateCmsSectionInput = components["schemas"]["CreateCmsSectionDto"];
export type UpdateCmsSectionInput = components["schemas"]["UpdateCmsSectionDto"];
export type PublishCmsRecordInput = components["schemas"]["PublishCmsRecordDto"];
export type ReorderCmsRecordsInput = components["schemas"]["ReorderCmsRecordsDto"];

export type ContentSummary = components["schemas"]["ContentSummaryResponseDto"];
export type ContentDetail = components["schemas"]["ContentDetailResponseDto"];
export type ContentListResponse = components["schemas"]["ContentListResponseDto"];
export type ContentAttachmentInput =
  components["schemas"]["ContentAttachmentInputDto"];
export type CreateContentInput = components["schemas"]["CreateContentEntryDto"];
export type UpdateContentInput = components["schemas"]["UpdateContentEntryDto"];
export type PublishContentInput =
  components["schemas"]["PublishContentEntryDto"];
export type FeatureContentInput =
  components["schemas"]["FeatureContentEntryDto"];
export type ReorderContentInput =
  components["schemas"]["ReorderContentEntriesDto"];

export type Plan = components["schemas"]["PlanResponseDto"];
export type PlansListResponse = components["schemas"]["PlansListResponseDto"];
export type PlanEntitlementInput =
  components["schemas"]["PlanEntitlementInputDto"];
export type CreatePlanInput = components["schemas"]["CreatePlanDto"];
export type UpdatePlanInput = components["schemas"]["UpdatePlanDto"];
export type Entitlement = components["schemas"]["EntitlementResponseDto"];
export type EntitlementsListResponse =
  components["schemas"]["EntitlementsListResponseDto"];
export type GrantEntitlementInput =
  components["schemas"]["GrantEntitlementDto"];
export type RevokeEntitlementInput =
  components["schemas"]["RevokeEntitlementDto"];
export type PaymentOrder = components["schemas"]["PaymentOrderResponseDto"];
export type PaymentOrdersListResponse =
  components["schemas"]["PaymentOrdersListResponseDto"];

export type Note = components["schemas"]["NoteSummaryResponseDto"];
export type NotesListResponse = components["schemas"]["NotesListResponseDto"];
export type CreateNoteInput = components["schemas"]["CreateNoteDto"];
export type UpdateNoteInput = components["schemas"]["UpdateNoteDto"];

export type QuestionSummary = components["schemas"]["QuestionSummaryResponseDto"];
export type QuestionDetail =
  components["schemas"]["AdminQuestionDetailResponseDto"];
export type QuestionsListResponse =
  components["schemas"]["QuestionsListResponseDto"];
export type QuestionOptionInput =
  components["schemas"]["QuestionOptionInputDto"];
export type QuestionMediaReferenceInput =
  components["schemas"]["QuestionMediaReferenceInputDto"];
export type CreateQuestionInput =
  components["schemas"]["CreateQuestionDto"];
export type UpdateQuestionInput =
  components["schemas"]["UpdateQuestionDto"];

export type TestSummary = components["schemas"]["TestSummaryResponseDto"];
export type TestDetail = components["schemas"]["AdminTestDetailResponseDto"];
export type TestsListResponse = components["schemas"]["TestsListResponseDto"];
export type TestQuestionInput = components["schemas"]["TestQuestionInputDto"];
export type CreateTestInput = components["schemas"]["CreateTestDto"];
export type UpdateTestInput = components["schemas"]["UpdateTestDto"];

export type NotificationTemplate =
  components["schemas"]["NotificationTemplateResponseDto"];
export type NotificationTemplatesListResponse =
  components["schemas"]["NotificationTemplatesListResponseDto"];
export type CreateNotificationTemplateInput =
  components["schemas"]["CreateNotificationTemplateDto"];
export type UpdateNotificationTemplateInput =
  components["schemas"]["UpdateNotificationTemplateDto"];
export type NotificationBroadcast =
  components["schemas"]["NotificationBroadcastResponseDto"];
export type NotificationBroadcastsListResponse =
  components["schemas"]["NotificationBroadcastsListResponseDto"];
export type CreateNotificationBroadcastInput =
  components["schemas"]["CreateNotificationBroadcastDto"];
export type UpdateNotificationBroadcastInput =
  components["schemas"]["UpdateNotificationBroadcastDto"];
export type NotificationMessage =
  components["schemas"]["NotificationMessageResponseDto"];
export type NotificationMessagesListResponse =
  components["schemas"]["NotificationMessagesListResponseDto"];

export type AdminAnalyticsOverview =
  components["schemas"]["AdminAnalyticsOverviewResponseDto"];
export type AdminOpsDashboard =
  components["schemas"]["AdminOpsDashboardResponseDto"];
export type AdminContentHealth =
  components["schemas"]["AdminContentHealthResponseDto"];
export type NoteSecuritySignal =
  components["schemas"]["NoteSecuritySignalResponseDto"];
export type NoteSecuritySignalsListResponse =
  components["schemas"]["NoteSecuritySignalsListResponseDto"];
export type SearchResponse = components["schemas"]["SearchResponseDto"];
export type SearchResultGroup = components["schemas"]["SearchResultGroupDto"];

export type CmsCollection = "pages" | "banners" | "announcements" | "sections";
export type CmsRecord = CmsPage | CmsBanner | CmsAnnouncement | CmsSection;
export type CmsStatus = CmsRecord["status"];
export type CmsVisibility = CmsRecord["visibility"];
export type CmsPlacement = CmsBanner["placement"];
export type CmsSectionSurface = CmsSection["surface"];
export type CmsSectionType = CmsSection["type"];
export type CmsBannerPlacement = CmsBanner["placement"];
export type CmsAnnouncementLevel = CmsAnnouncement["level"];
export type FileAssetPurpose = FileAsset["purpose"];
export type FileAssetAccessLevel = FileAsset["accessLevel"];
export type FileAssetStatus = FileAsset["status"];

export type ContentFamily = ContentSummary["family"];
export type ContentFormat = ContentSummary["format"];
export type ContentAccessType = ContentSummary["accessType"];
export type ContentStatus = ContentSummary["status"];

export type PlanStatus = Plan["status"];
export type PaymentOrderStatus = PaymentOrder["status"];
export type PaymentOrderProvider = PaymentOrder["provider"];
export type EntitlementKind = Entitlement["kind"];

export type NoteAccessType = Note["accessType"];
export type NoteStatus = Note["status"];

export type QuestionType = QuestionSummary["type"];
export type QuestionDifficulty = QuestionSummary["difficulty"];
export type QuestionStatus = QuestionSummary["status"];

export type TestFamily = TestSummary["family"];
export type TestAccessType = TestSummary["accessType"];
export type TestStatus = TestSummary["status"];

export type NotificationChannel = NotificationTemplate["channel"];
export type NotificationTemplateStatus = NotificationTemplate["status"];
export type NotificationBroadcastAudience = NotificationBroadcast["audienceType"];
export type NotificationBroadcastStatus = NotificationBroadcast["status"];
export type NotificationMessageStatus = NotificationMessage["status"];
export type SecuritySignalSeverity = NoteSecuritySignal["severity"];

export type CmsListQuery =
  operations["AdminCmsController_listPages"]["parameters"]["query"];
export type AdminFileListQuery =
  operations["AdminFilesController_listAssets"]["parameters"]["query"];
export type AdminUserListQuery =
  operations["AdminUsersController_listUsers"]["parameters"]["query"];
export type AdminAuditLogListQuery =
  operations["AdminAuditLogsController_listAuditLogs"]["parameters"]["query"];
export type AdminSubjectListQuery =
  operations["AdminTaxonomyController_listSubjects"]["parameters"]["query"];
export type AdminTopicListQuery =
  operations["AdminTaxonomyController_listTopics"]["parameters"]["query"];
export type AdminContentListQuery =
  operations["AdminContentController_listContent"]["parameters"]["query"];
export type AdminPlanListQuery =
  operations["AdminPlansController_listPlans"]["parameters"]["query"];
export type AdminPaymentOrderListQuery =
  operations["AdminPaymentsController_listOrders"]["parameters"]["query"];
export type AdminNoteListQuery =
  operations["AdminNotesController_listNotes"]["parameters"]["query"];
export type AdminQuestionListQuery =
  operations["AdminQuestionsController_listQuestions"]["parameters"]["query"];
export type AdminTestListQuery =
  operations["AdminTestsController_listTests"]["parameters"]["query"];
export type AdminNotificationTemplateListQuery =
  operations["AdminNotificationsController_listTemplates"]["parameters"]["query"];
export type AdminNotificationBroadcastListQuery =
  operations["AdminNotificationsController_listBroadcasts"]["parameters"]["query"];
export type AdminNotificationMessageListQuery =
  operations["AdminNotificationsController_listMessages"]["parameters"]["query"];
export type AdminSearchQuery =
  operations["AdminSearchController_search"]["parameters"]["query"];
export type AdminSecuritySignalListQuery =
  operations["AdminOpsController_listNoteSecuritySignals"]["parameters"]["query"];
