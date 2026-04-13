import { AdminEnglishSpeakingEditorScreen } from "@/components/admin/admin-english-speaking-editor-screen";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";

export default function AdminEnglishSpeakingNewPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "content.structured.read",
        "content.structured.manage",
        "content.structured.publish",
      ]}
    >
      <AdminEnglishSpeakingEditorScreen />
    </AdminPermissionGuard>
  );
}
