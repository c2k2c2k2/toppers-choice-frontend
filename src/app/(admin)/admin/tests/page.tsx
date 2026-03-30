import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminAssessmentsScreen } from "@/components/admin/admin-assessments-screen";

export default function AdminTestsPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "academics.tests.read",
        "academics.tests.manage",
        "academics.tests.publish",
      ]}
    >
      <AdminAssessmentsScreen initialTab="tests" testView="list" />
    </AdminPermissionGuard>
  );
}
