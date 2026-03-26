import {
  apiRequest,
  type ApiRequestOptions,
} from "@/lib/api/client";
import { buildApiUrl, withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  NoteDetailResponse,
  NoteProgressResponse,
  NotesListFilters,
  NotesListResponse,
  NotesTreeResponse,
  NoteViewSessionResponse,
  NoteWatermarkResponse,
  UpdateNoteProgressInput,
} from "@/lib/notes/types";

function buildAuthedOptions(
  accessToken: string,
  options: ApiRequestOptions = {},
): ApiRequestOptions {
  return {
    ...options,
    accessToken,
    cache: options.cache ?? "no-store",
  };
}

export function getPublishedNotesTree(
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<NotesTreeResponse>(
    apiRoutes.notes.tree,
    buildAuthedOptions(accessToken, options),
  );
}

export function getPublishedNotes(
  accessToken: string,
  filters: NotesListFilters = {},
  options: ApiRequestOptions = {},
) {
  const query = {
    mediumId: filters.mediumId ?? null,
    search: filters.search ?? null,
    subjectId: filters.subjectId ?? null,
    topicId: filters.topicId ?? null,
  };

  return apiRequest<NotesListResponse>(
    withQuery(apiRoutes.notes.list, query),
    buildAuthedOptions(accessToken, options),
  );
}

export function getPublishedNote(
  noteId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<NoteDetailResponse>(
    apiRoutes.notes.detail(noteId),
    buildAuthedOptions(accessToken, options),
  );
}

export function createNoteViewSession(
  noteId: string,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<NoteViewSessionResponse>(
    apiRoutes.notes.viewSession(noteId),
    buildAuthedOptions(accessToken, {
      ...options,
      method: "POST",
    }),
  );
}

export function updateNoteProgress(
  noteId: string,
  payload: UpdateNoteProgressInput,
  accessToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<NoteProgressResponse>(
    apiRoutes.notes.progress(noteId),
    buildAuthedOptions(accessToken, {
      ...options,
      body: payload,
      method: "POST",
    }),
  );
}

export function getNoteWatermark(
  noteViewSessionId: string,
  noteViewToken: string,
  options: ApiRequestOptions = {},
) {
  return apiRequest<NoteWatermarkResponse>(
    apiRoutes.notes.watermark(noteViewSessionId),
    {
      ...options,
      cache: options.cache ?? "no-store",
      headers: {
        ...options.headers,
        authorization: `Bearer ${noteViewToken}`,
      },
    },
  );
}

export function buildNoteContentUrl(noteViewSessionId: string) {
  return buildApiUrl(apiRoutes.notes.content(noteViewSessionId));
}
