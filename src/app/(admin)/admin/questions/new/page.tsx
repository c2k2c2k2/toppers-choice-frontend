import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminQuestionEditorScreen } from "@/components/admin/admin-question-editor-screen";

export default function AdminNewQuestionPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "academics.questions.read",
        "academics.questions.manage",
        "academics.questions.publish",
      ]}
    >
      <AdminQuestionEditorScreen />
    </AdminPermissionGuard>
  );
}
