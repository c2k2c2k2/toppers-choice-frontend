import type { components, operations } from "@/lib/api/generated/backend-schema";

export type AdminPermission = components["schemas"]["PermissionResponseDto"];
export type AdminRole = components["schemas"]["RoleResponseDto"];
export type AdminOpsDashboard = components["schemas"]["AdminOpsDashboardResponseDto"];

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
export type CmsBannerListResponse = components["schemas"]["CmsBannersListResponseDto"];
export type CmsAnnouncementListResponse =
  components["schemas"]["CmsAnnouncementsListResponseDto"];
export type CmsSectionListResponse = components["schemas"]["CmsSectionsListResponseDto"];

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

export type CmsListQuery = operations["AdminCmsController_listPages"]["parameters"]["query"];
export type AdminFileListQuery =
  operations["AdminFilesController_listAssets"]["parameters"]["query"];
