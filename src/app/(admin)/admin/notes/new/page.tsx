import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminNoteEditorScreen } from "@/components/admin/admin-note-editor-screen";

export default function AdminNewNotePage() {
  return (
    <AdminPermissionGuard
      permissionKeys={["content.notes.read", "content.notes.manage", "content.notes.publish"]}
    >
      <AdminNoteEditorScreen />
    </AdminPermissionGuard>
  );
}
