import { AdminCmsManagementScreen } from "@/components/admin/admin-cms-management-screen"
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard"

export default function AdminCmsNewBannerRecordPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={["content.cms.read", "content.cms.manage", "content.cms.publish"]}
    >
      <AdminCmsManagementScreen collection="banners" view="editor" />
    </AdminPermissionGuard>
  )
}
