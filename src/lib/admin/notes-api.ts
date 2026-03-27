import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type { MarathiEncodedFontKey } from "@/lib/marathi";
import type {
  AdminNoteListQuery,
  CreateNoteInput,
  Note,
  NotesListResponse,
  UpdateNoteInput,
} from "@/lib/admin/types";

export interface AdminNoteIndexEntry {
  createdAt: string;
  id: string;
  indentLevel: number;
  noteId: string;
  orderIndex: number;
  pageNumber: number;
  serialLabel: string | null;
  title: string;
  titleFontHint: MarathiEncodedFontKey | null;
  updatedAt: string;
}

export interface AdminNoteIndexListResponse {
  items: AdminNoteIndexEntry[];
}

export interface CreateAdminNoteIndexEntryInput {
  indentLevel?: number;
  orderIndex?: number;
  pageNumber: number;
  serialLabel?: string;
  title: string;
  titleFontHint?: MarathiEncodedFontKey;
}

export type UpdateAdminNoteIndexEntryInput =
  Partial<CreateAdminNoteIndexEntryInput>;

export async function listAdminNotes(
  accessToken: string,
  query: AdminNoteListQuery = {},
) {
  return apiRequest<NotesListResponse>(
    withQuery(apiRoutes.admin.notes.list, query ?? {}),
    {
      accessToken,
    },
  );
}

export async function getAdminNote(noteId: string, accessToken: string) {
  return apiRequest<Note>(apiRoutes.admin.notes.detail(noteId), {
    accessToken,
  });
}

export async function createAdminNote(
  input: CreateNoteInput,
  accessToken: string,
) {
  return apiRequest<Note>(apiRoutes.admin.notes.list, {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminNote(
  noteId: string,
  input: UpdateNoteInput,
  accessToken: string,
) {
  return apiRequest<Note>(apiRoutes.admin.notes.detail(noteId), {
    method: "PATCH",
    accessToken,
    body: input,
  });
}

export async function publishAdminNote(noteId: string, accessToken: string) {
  return apiRequest<Note>(apiRoutes.admin.notes.publish(noteId), {
    method: "POST",
    accessToken,
  });
}

export async function unpublishAdminNote(noteId: string, accessToken: string) {
  return apiRequest<Note>(apiRoutes.admin.notes.unpublish(noteId), {
    method: "POST",
    accessToken,
  });
}

export async function listAdminNoteIndexEntries(
  noteId: string,
  accessToken: string,
) {
  return apiRequest<AdminNoteIndexListResponse>(apiRoutes.admin.notes.index(noteId), {
    accessToken,
  });
}

export async function createAdminNoteIndexEntry(
  noteId: string,
  input: CreateAdminNoteIndexEntryInput,
  accessToken: string,
) {
  return apiRequest<AdminNoteIndexEntry>(apiRoutes.admin.notes.index(noteId), {
    method: "POST",
    accessToken,
    body: input,
  });
}

export async function updateAdminNoteIndexEntry(
  noteId: string,
  entryId: string,
  input: UpdateAdminNoteIndexEntryInput,
  accessToken: string,
) {
  return apiRequest<AdminNoteIndexEntry>(
    apiRoutes.admin.notes.indexEntry(noteId, entryId),
    {
      method: "PATCH",
      accessToken,
      body: input,
    },
  );
}

export async function deleteAdminNoteIndexEntry(
  noteId: string,
  entryId: string,
  accessToken: string,
) {
  return apiRequest<{ message: string }>(
    apiRoutes.admin.notes.indexEntry(noteId, entryId),
    {
      method: "DELETE",
      accessToken,
    },
  );
}
