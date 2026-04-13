import { AdminEnglishSpeakingListScreen } from "@/components/admin/admin-english-speaking-list-screen";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";

export default function AdminEnglishSpeakingPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={[
        "content.structured.read",
        "content.structured.manage",
        "content.structured.publish",
      ]}
    >
      <AdminEnglishSpeakingListScreen />
    </AdminPermissionGuard>
  );
}
