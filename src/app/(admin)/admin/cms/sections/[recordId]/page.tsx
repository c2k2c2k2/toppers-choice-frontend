import { AdminCmsManagementScreen } from "@/components/admin/admin-cms-management-screen"
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard"

export default async function AdminCmsEditSectionRecordPage({
  params,
}: Readonly<{
  params: Promise<{
    recordId: string
  }>
}>) {
  const { recordId } = await params

  return (
    <AdminPermissionGuard
      permissionKeys={["content.cms.read", "content.cms.manage", "content.cms.publish"]}
    >
      <AdminCmsManagementScreen collection="sections" recordId={recordId} view="editor" />
    </AdminPermissionGuard>
  )
}
