export interface CmsAssetSummary {
  id: string;
  purpose: string;
  accessLevel: string;
  status: string;
  originalFileName: string;
  contentType: string;
  sizeBytes: number | null;
  publicDeliveryPath: string;
  protectedDeliveryPath: string;
}

export interface CmsPage {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  bodyJson: Record<string, unknown> | null;
  seoJson: Record<string, unknown> | null;
  visibility: string;
  coverImageAssetId: string | null;
  orderIndex: number;
  status: string;
  publishedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  coverImage: CmsAssetSummary | null;
}

export interface CmsBanner {
  id: string;
  placement: string;
  title: string;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageAssetId: string | null;
  visibility: string;
  orderIndex: number;
  startsAt: string | null;
  endsAt: string | null;
  metaJson: Record<string, unknown> | null;
  status: string;
  publishedAt: string | null;
  image: CmsAssetSummary | null;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  body: string;
  linkLabel: string | null;
  linkHref: string | null;
  level: string;
  visibility: string;
  isPinned: boolean;
  orderIndex: number;
  startsAt: string | null;
  endsAt: string | null;
  metaJson: Record<string, unknown> | null;
  status: string;
  publishedAt: string | null;
}

export interface CmsSection {
  id: string;
  surface: string;
  code: string;
  title: string;
  subtitle: string | null;
  type: string;
  bodyJson: Record<string, unknown> | null;
  configJson: Record<string, unknown> | null;
  imageAssetId: string | null;
  visibility: string;
  orderIndex: number;
  status: string;
  publishedAt: string | null;
  image: CmsAssetSummary | null;
}

export interface CmsResolveResponse {
  pages: CmsPage[];
  banners: CmsBanner[];
  announcements: CmsAnnouncement[];
  sections: CmsSection[];
}
