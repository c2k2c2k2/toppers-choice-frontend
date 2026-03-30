import { AdminCmsManagementScreen } from "@/components/admin/admin-cms-management-screen"
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard"

export default async function AdminCmsEditAnnouncementRecordPage({
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
      <AdminCmsManagementScreen collection="announcements" recordId={recordId} view="editor" />
    </AdminPermissionGuard>
  )
}
