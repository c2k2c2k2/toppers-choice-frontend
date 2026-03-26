import { AdminCmsManagementScreen } from "@/components/admin/admin-cms-management-screen";
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";

export default function AdminCmsPagesPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={["content.cms.read", "content.cms.manage", "content.cms.publish"]}
    >
      <AdminCmsManagementScreen collection="pages" />
    </AdminPermissionGuard>
  );
}
