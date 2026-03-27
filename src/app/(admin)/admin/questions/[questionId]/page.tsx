import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminQuestionEditorScreen } from "@/components/admin/admin-question-editor-screen";

export default async function AdminEditQuestionPage({
  params,
}: Readonly<{
  params: Promise<{
    questionId: string;
  }>;
}>) {
  const { questionId } = await params;

  return (
    <AdminPermissionGuard
      permissionKeys={[
        "academics.questions.read",
        "academics.questions.manage",
        "academics.questions.publish",
      ]}
    >
      <AdminQuestionEditorScreen questionId={questionId} />
    </AdminPermissionGuard>
  );
}
