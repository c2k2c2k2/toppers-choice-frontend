import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminAssessmentsScreen } from "@/components/admin/admin-assessments-screen";

export default function AdminQuestionsPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "academics.questions.read",
        "academics.questions.manage",
        "academics.questions.publish",
      ]}
    >
      <AdminAssessmentsScreen initialTab="questions" />
    </AdminPermissionGuard>
  );
}
