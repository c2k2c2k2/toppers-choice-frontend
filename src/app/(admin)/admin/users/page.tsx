import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminPeopleScreen } from "@/components/admin/admin-people-screen";

export default function AdminUsersPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "admin.users.read",
        "admin.users.manage",
        "admin.users.roles.read",
        "admin.users.roles.manage",
        "admin.roles.read",
      ]}
    >
      <AdminPeopleScreen initialTab="users" />
    </AdminPermissionGuard>
  );
}
