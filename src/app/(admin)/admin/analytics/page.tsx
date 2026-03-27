import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminInsightsScreen } from "@/components/admin/admin-insights-screen";

export default function AdminAnalyticsPage() {
  return (
    <AdminPermissionGuard permissionKeys={["analytics.read"]}>
      <AdminInsightsScreen initialTab="analytics" />
    </AdminPermissionGuard>
  );
}
