import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminPeopleScreen } from "@/components/admin/admin-people-screen";

export default function AdminAuditPage() {
  return (
    <AdminPermissionGuard permissionKeys={["admin.audit.read"]}>
      <AdminPeopleScreen initialTab="audit" />
    </AdminPermissionGuard>
  );
}
