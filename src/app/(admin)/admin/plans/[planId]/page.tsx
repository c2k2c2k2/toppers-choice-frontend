import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminCommerceScreen } from "@/components/admin/admin-commerce-screen";

export default async function AdminEditPlanPage({
  params,
}: Readonly<{
  params: Promise<{
    planId: string;
  }>;
}>) {
  const { planId } = await params;

  return (
    <AdminPermissionGuard permissionKeys={["payments.read", "payments.manage"]}>
      <AdminCommerceScreen
        initialTab="plans"
        planId={planId}
        planView="editor"
      />
    </AdminPermissionGuard>
  );
}
