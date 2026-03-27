import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminNoteEditorScreen } from "@/components/admin/admin-note-editor-screen";

export default async function AdminEditNotePage({
  params,
}: Readonly<{
  params: Promise<{
    noteId: string;
  }>;
}>) {
  const { noteId } = await params;

  return (
    <AdminPermissionGuard
      permissionKeys={["content.notes.read", "content.notes.manage", "content.notes.publish"]}
    >
      <AdminNoteEditorScreen noteId={noteId} />
    </AdminPermissionGuard>
  );
}
