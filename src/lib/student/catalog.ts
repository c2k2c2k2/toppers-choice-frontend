import type {
  StudentCatalogResponse,
  StudentCatalogSnapshot,
  StudentExamTrack,
  StudentMedium,
  StudentSubject,
  StudentTopicTreeNode,
} from "@/lib/student/types";

function matchesCode(
  value: {
    code: string;
    slug: string;
  },
  codeOrSlug: string | null | undefined,
) {
  if (!codeOrSlug) {
    return false;
  }

  return value.code === codeOrSlug || value.slug === codeOrSlug;
}

export function resolveSelectedExamTrack(
  catalog: StudentCatalogResponse,
  codeOrSlug?: string | null,
) {
  return (
    catalog.examTracks.find((examTrack) => matchesCode(examTrack, codeOrSlug)) ??
    catalog.examTracks[0] ??
    null
  );
}

export function resolveSelectedMedium(
  catalog: StudentCatalogResponse,
  codeOrSlug?: string | null,
) {
  return (
    catalog.mediums.find((medium) => matchesCode(medium, codeOrSlug)) ??
    catalog.mediums[0] ??
    null
  );
}

export function getSubjectsForExamTrack(
  catalog: StudentCatalogResponse,
  examTrackId?: string | null,
) {
  if (!examTrackId) {
    return catalog.subjects;
  }

  return catalog.subjects.filter((subject) => subject.examTrackId === examTrackId);
}

export function findSubjectBySlug(
  catalog: StudentCatalogResponse,
  subjectSlug: string,
) {
  return (
    catalog.subjects.find((subject) => subject.slug === subjectSlug) ?? null
  );
}

export function countTopics(topics: StudentTopicTreeNode[]): number {
  return topics.reduce((total, topic) => {
    return total + 1 + countTopics(topic.children);
  }, 0);
}

export function flattenTopicTree(
  topics: StudentTopicTreeNode[],
): StudentTopicTreeNode[] {
  return topics.flatMap((topic) => [topic, ...flattenTopicTree(topic.children)]);
}

export function buildStudentCatalogSnapshot(
  catalog: StudentCatalogResponse,
  options: {
    examTrackCode?: string | null;
    mediumCode?: string | null;
  } = {},
): StudentCatalogSnapshot {
  const selectedTrack = resolveSelectedExamTrack(catalog, options.examTrackCode);
  const selectedMedium = resolveSelectedMedium(catalog, options.mediumCode);

  return {
    selectedTrack,
    selectedMedium,
    subjects: getSubjectsForExamTrack(catalog, selectedTrack?.id),
  };
}

export function getTrackLabel(examTrack: StudentExamTrack | null) {
  if (!examTrack) {
    return "All tracks";
  }

  return getOptionalText(examTrack.shortName) ?? examTrack.name;
}

export function getMediumLabel(medium: StudentMedium | null) {
  return medium?.name ?? "All mediums";
}

export function getOptionalText(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function buildSubjectCatalogHref(
  subject: StudentSubject,
  options: {
    examTrackCode?: string | null;
    mediumCode?: string | null;
  } = {},
) {
  const searchParams = new URLSearchParams();

  if (options.examTrackCode) {
    searchParams.set("track", options.examTrackCode);
  }

  if (options.mediumCode) {
    searchParams.set("medium", options.mediumCode);
  }

  const queryString = searchParams.toString();
  const pathname = `/student/catalog/${subject.slug}`;

  return queryString ? `${pathname}?${queryString}` : pathname;
}
