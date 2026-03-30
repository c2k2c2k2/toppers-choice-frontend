export type AdminTaxonomyEntity =
  | "examTracks"
  | "mediums"
  | "subjects"
  | "topics"
  | "tags"

const ENTITY_TO_SLUG: Record<AdminTaxonomyEntity, string> = {
  examTracks: "exam-tracks",
  mediums: "mediums",
  subjects: "subjects",
  topics: "topics",
  tags: "tags",
}

const SLUG_TO_ENTITY = Object.fromEntries(
  Object.entries(ENTITY_TO_SLUG).map(([entity, slug]) => [slug, entity]),
) as Record<string, AdminTaxonomyEntity>

export function parseAdminTaxonomyEntitySlug(slug: string) {
  return SLUG_TO_ENTITY[slug] ?? null
}

export function getAdminTaxonomyEntitySlug(entity: AdminTaxonomyEntity) {
  return ENTITY_TO_SLUG[entity]
}

export function getAdminTaxonomyEntityHref(entity: AdminTaxonomyEntity) {
  return `/admin/taxonomy/${getAdminTaxonomyEntitySlug(entity)}`
}

export function getAdminTaxonomyNewHref(entity: AdminTaxonomyEntity) {
  return `${getAdminTaxonomyEntityHref(entity)}/new`
}

export function getAdminTaxonomyEditHref(
  entity: AdminTaxonomyEntity,
  recordId: string,
) {
  return `${getAdminTaxonomyEntityHref(entity)}/${recordId}`
}
