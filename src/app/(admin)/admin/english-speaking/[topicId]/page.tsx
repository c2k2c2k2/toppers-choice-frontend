import { AdminEnglishSpeakingEditorScreen } from "@/components/admin/admin-english-speaking-editor-screen";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";

export default async function AdminEnglishSpeakingEditorPage({
  params,
}: Readonly<{
  params: Promise<{ topicId: string }>;
}>) {
  const { topicId } = await params;

  return (
    <AdminPermissionGuard
      permissionKeys={[
        "content.structured.read",
        "content.structured.manage",
        "content.structured.publish",
      ]}
    >
      <AdminEnglishSpeakingEditorScreen topicId={topicId} />
    </AdminPermissionGuard>
  );
}
