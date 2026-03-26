import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  CmsAnnouncement,
  CmsAnnouncementListResponse,
  CmsBanner,
  CmsBannerListResponse,
  CmsListQuery,
  CmsPage,
  CmsPageListResponse,
  CmsSection,
  CmsSectionListResponse,
  CreateCmsAnnouncementInput,
  CreateCmsBannerInput,
  CreateCmsPageInput,
  CreateCmsSectionInput,
  PublishCmsRecordInput,
  ReorderCmsRecordsInput,
  UpdateCmsAnnouncementInput,
  UpdateCmsBannerInput,
  UpdateCmsPageInput,
  UpdateCmsSectionInput,
} from "@/lib/admin/types";

function withCmsQuery(path: string, query: CmsListQuery = {}) {
  return withQuery(path, query ?? {});
}

export async function listAdminCmsPages(
  accessToken: string,
  query: CmsListQuery = {},
) {
  return apiRequest<CmsPageListResponse>(
    withCmsQuery(apiRoutes.admin.cms.pages, query),
    {
      accessToken,
    },
  );
}

export async function createAdminCmsPage(
  input: CreateCmsPageInput,
  accessToken: string,
) {
  return apiRequest<CmsPage>(apiRoutes.admin.cms.pages, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminCmsPage(
  pageId: string,
  input: UpdateCmsPageInput,
  accessToken: string,
) {
  return apiRequest<CmsPage>(apiRoutes.admin.cms.page(pageId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminCmsPage(
  pageId: string,
  accessToken: string,
  input: PublishCmsRecordInput = {},
) {
  return apiRequest<CmsPage>(apiRoutes.admin.cms.publishPage(pageId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function unpublishAdminCmsPage(
  pageId: string,
  accessToken: string,
) {
  return apiRequest<CmsPage>(apiRoutes.admin.cms.unpublishPage(pageId), {
    method: "POST",
    accessToken,
  });
}

export async function reorderAdminCmsPages(
  input: ReorderCmsRecordsInput,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(apiRoutes.admin.cms.reorderPages, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function listAdminCmsBanners(
  accessToken: string,
  query: CmsListQuery = {},
) {
  return apiRequest<CmsBannerListResponse>(
    withCmsQuery(apiRoutes.admin.cms.banners, query),
    {
      accessToken,
    },
  );
}

export async function createAdminCmsBanner(
  input: CreateCmsBannerInput,
  accessToken: string,
) {
  return apiRequest<CmsBanner>(apiRoutes.admin.cms.banners, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminCmsBanner(
  bannerId: string,
  input: UpdateCmsBannerInput,
  accessToken: string,
) {
  return apiRequest<CmsBanner>(apiRoutes.admin.cms.banner(bannerId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminCmsBanner(
  bannerId: string,
  accessToken: string,
  input: PublishCmsRecordInput = {},
) {
  return apiRequest<CmsBanner>(apiRoutes.admin.cms.publishBanner(bannerId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function unpublishAdminCmsBanner(
  bannerId: string,
  accessToken: string,
) {
  return apiRequest<CmsBanner>(apiRoutes.admin.cms.unpublishBanner(bannerId), {
    method: "POST",
    accessToken,
  });
}

export async function reorderAdminCmsBanners(
  input: ReorderCmsRecordsInput,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(apiRoutes.admin.cms.reorderBanners, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function listAdminCmsAnnouncements(
  accessToken: string,
  query: CmsListQuery = {},
) {
  return apiRequest<CmsAnnouncementListResponse>(
    withCmsQuery(apiRoutes.admin.cms.announcements, query),
    {
      accessToken,
    },
  );
}

export async function createAdminCmsAnnouncement(
  input: CreateCmsAnnouncementInput,
  accessToken: string,
) {
  return apiRequest<CmsAnnouncement>(apiRoutes.admin.cms.announcements, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminCmsAnnouncement(
  announcementId: string,
  input: UpdateCmsAnnouncementInput,
  accessToken: string,
) {
  return apiRequest<CmsAnnouncement>(
    apiRoutes.admin.cms.announcement(announcementId),
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export async function publishAdminCmsAnnouncement(
  announcementId: string,
  accessToken: string,
  input: PublishCmsRecordInput = {},
) {
  return apiRequest<CmsAnnouncement>(
    apiRoutes.admin.cms.publishAnnouncement(announcementId),
    {
      method: "POST",
      accessToken,
      body: input,
    },
  );
}

export async function unpublishAdminCmsAnnouncement(
  announcementId: string,
  accessToken: string,
) {
  return apiRequest<CmsAnnouncement>(
    apiRoutes.admin.cms.unpublishAnnouncement(announcementId),
    {
      method: "POST",
      accessToken,
    },
  );
}

export async function reorderAdminCmsAnnouncements(
  input: ReorderCmsRecordsInput,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(
    apiRoutes.admin.cms.reorderAnnouncements,
    {
      method: "POST",
      accessToken,
      body: input,
    },
  );
}

export async function listAdminCmsSections(
  accessToken: string,
  query: CmsListQuery = {},
) {
  return apiRequest<CmsSectionListResponse>(
    withCmsQuery(apiRoutes.admin.cms.sections, query),
    {
      accessToken,
    },
  );
}

export async function createAdminCmsSection(
  input: CreateCmsSectionInput,
  accessToken: string,
) {
  return apiRequest<CmsSection>(apiRoutes.admin.cms.sections, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminCmsSection(
  sectionId: string,
  input: UpdateCmsSectionInput,
  accessToken: string,
) {
  return apiRequest<CmsSection>(apiRoutes.admin.cms.section(sectionId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminCmsSection(
  sectionId: string,
  accessToken: string,
  input: PublishCmsRecordInput = {},
) {
  return apiRequest<CmsSection>(apiRoutes.admin.cms.publishSection(sectionId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function unpublishAdminCmsSection(
  sectionId: string,
  accessToken: string,
) {
  return apiRequest<CmsSection>(apiRoutes.admin.cms.unpublishSection(sectionId), {
    method: "POST",
    accessToken,
  });
}

export async function reorderAdminCmsSections(
  input: ReorderCmsRecordsInput,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(apiRoutes.admin.cms.reorderSections, {
    method: "POST",
    accessToken,
    body: input,
  });
}
