import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminCommerceScreen } from "@/components/admin/admin-commerce-screen";

export default function AdminPlansPage() {
  return (
    <AdminPermissionGuard permissionKeys={["payments.read", "payments.manage"]}>
      <AdminCommerceScreen initialTab="plans" planView="list" />
    </AdminPermissionGuard>
  );
}
