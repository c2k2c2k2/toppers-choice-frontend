import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminInsightsScreen } from "@/components/admin/admin-insights-screen";

export default function AdminNotificationsPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={["notifications.read", "notifications.manage", "notifications.send"]}
    >
      <AdminInsightsScreen initialTab="notifications" />
    </AdminPermissionGuard>
  );
}
