import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminAssessmentsScreen } from "@/components/admin/admin-assessments-screen";

export default async function AdminTestEditorPage({
  params,
}: Readonly<{
  params: Promise<{ testId: string }>;
}>) {
  const { testId } = await params;

  return (
    <AdminPermissionGuard
      permissionKeys={[
        "academics.tests.read",
        "academics.tests.manage",
        "academics.tests.publish",
      ]}
    >
      <AdminAssessmentsScreen
        initialTab="tests"
        testId={testId}
        testView="editor"
      />
    </AdminPermissionGuard>
  );
}
