import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminContentOperationsScreen } from "@/components/admin/admin-content-operations-screen";

export default async function AdminContentEditorPage({
  params,
}: Readonly<{
  params: Promise<{ contentId: string }>;
}>) {
  const { contentId } = await params;

  return (
    <AdminPermissionGuard
      permissionKeys={[
        "content.structured.read",
        "content.structured.manage",
        "content.structured.publish",
      ]}
    >
      <AdminContentOperationsScreen
        initialTab="content"
        contentId={contentId}
        contentView="editor"
      />
    </AdminPermissionGuard>
  );
}
