import { apiRequest } from "@/lib/api/client";
import { withQuery } from "@/lib/api/config";
import { apiRoutes } from "@/lib/api/routes";
import type {
  AdminNoteListQuery,
  CreateNoteInput,
  Note,
  NotesListResponse,
  UpdateNoteInput,
} from "@/lib/admin/types";

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
