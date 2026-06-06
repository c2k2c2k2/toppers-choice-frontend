import { AdminFeedbackScreen } from "@/components/admin/admin-feedback-screen";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";

export default function AdminFeedbackPage() {
  return (
    <AdminPermissionGuard permissionKeys={["feedback.read", "feedback.manage"]}>
      <AdminFeedbackScreen />
    </AdminPermissionGuard>
  );
}
