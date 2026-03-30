import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminContentOperationsScreen } from "@/components/admin/admin-content-operations-screen";

export default function AdminContentNewPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "content.structured.read",
        "content.structured.manage",
        "content.structured.publish",
      ]}
    >
      <AdminContentOperationsScreen initialTab="content" contentView="editor" />
    </AdminPermissionGuard>
  );
}
