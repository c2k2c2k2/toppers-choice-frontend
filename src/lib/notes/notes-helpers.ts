import { getOptionalText } from "@/lib/student";
import type {
  NoteAccessMode,
  NoteDetailResponse,
  NoteSummary,
  NoteTreeSubjectNode,
  NoteTreeTopicNode,
} from "@/lib/notes/types";

interface NoteAccessDescriptor {
  description: string;
  label: string;
  tone: "full" | "locked" | "preview";
}

export function getOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function matchesNoteMedium(
  note: Pick<NoteSummary, "mediumId">,
  mediumId?: string | null,
) {
  if (!mediumId) {
    return true;
  }

  return note.mediumId === null || note.mediumId === mediumId;
}

export function getNoteAccessDescriptor(
  access: Pick<NoteSummary["access"], "mode" | "reason">,
): NoteAccessDescriptor {
  switch (access.mode) {
    case "FULL":
      return {
        description: "Read the full note with secure session tracking.",
        label: "Full access",
        tone: "full",
      };
    case "PREVIEW":
      return {
        description:
          getOptionalText(access.reason) ??
          "Preview access is available before purchase.",
        label: "Preview",
        tone: "preview",
      };
    default:
      return {
        description:
          getOptionalText(access.reason) ??
          "An active premium entitlement is required.",
        label: "Premium",
        tone: "locked",
      };
  }
}

export function getNoteAccessTone(
  mode: NoteAccessMode,
) {
  return getNoteAccessDescriptor({
    mode,
    reason: null,
  }).tone;
}

export function getReaderStartPage(
  note: Pick<NoteDetailResponse, "progress">,
) {
  return Math.max(getOptionalNumber(note.progress?.lastPageViewed) ?? 1, 1);
}

export function buildNoteProgressLabel(
  note: Pick<NoteSummary, "progress" | "pageCount">,
) {
  const lastPageViewed = getOptionalNumber(note.progress?.lastPageViewed);
  const completionPercent = getOptionalNumber(note.progress?.completionPercent);

  if (!lastPageViewed || lastPageViewed <= 0) {
    return `0 / ${note.pageCount} pages`;
  }

  if (completionPercent !== null) {
    return `${lastPageViewed} / ${note.pageCount} pages · ${completionPercent}%`;
  }

  return `${lastPageViewed} / ${note.pageCount} pages`;
}

export function countTopicTreeNotes(
  topics: NoteTreeTopicNode[],
  mediumId?: string | null,
): number {
  return topics.reduce((total, topic) => {
    const topicNotes = topic.notes.filter((note) => matchesNoteMedium(note, mediumId));

    return (
      total +
      topicNotes.length +
      countTopicTreeNotes(topic.children, mediumId)
    );
  }, 0);
}

export function countSubjectTreeNotes(
  subject: NoteTreeSubjectNode,
  mediumId?: string | null,
) {
  return (
    subject.notes.filter((note) => matchesNoteMedium(note, mediumId)).length +
    countTopicTreeNotes(subject.topics, mediumId)
  );
}

export function findTreeSubjectById(
  subjects: NoteTreeSubjectNode[],
  subjectId: string | null,
) {
  if (!subjectId) {
    return null;
  }

  return subjects.find((subject) => subject.id === subjectId) ?? null;
}

export function findTreeTopicById(
  topics: NoteTreeTopicNode[],
  topicId: string | null,
): NoteTreeTopicNode | null {
  if (!topicId) {
    return null;
  }

  for (const topic of topics) {
    if (topic.id === topicId) {
      return topic;
    }

    const nestedMatch = findTreeTopicById(topic.children, topicId);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return null;
}

export function filterTreeSubjectsByTrack(
  subjects: NoteTreeSubjectNode[],
  examTrackId?: string | null,
) {
  if (!examTrackId) {
    return subjects;
  }

  return subjects.filter((subject) => subject.examTrackId === examTrackId);
}

export function isNoteSessionErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("401") ||
    normalized.includes("403") ||
    normalized.includes("expired") ||
    normalized.includes("invalid") ||
    normalized.includes("unauthorized")
  );
}
