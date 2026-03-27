import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminInsightsScreen } from "@/components/admin/admin-insights-screen";

export default function AdminOpsPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "admin.search.read",
        "admin.ops.read",
        "admin.ops.export",
        "admin.ops.support",
        "admin.security.read",
      ]}
    >
      <AdminInsightsScreen initialTab="ops" />
    </AdminPermissionGuard>
  );
}
