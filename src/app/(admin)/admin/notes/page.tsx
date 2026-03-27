import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminContentOperationsScreen } from "@/components/admin/admin-content-operations-screen";

export default function AdminNotesPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={["content.notes.read", "content.notes.manage", "content.notes.publish"]}
    >
      <AdminContentOperationsScreen initialTab="notes" />
    </AdminPermissionGuard>
  );
}
