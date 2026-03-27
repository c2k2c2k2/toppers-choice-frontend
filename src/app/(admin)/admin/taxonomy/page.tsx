import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard";
import { AdminTaxonomyScreen } from "@/components/admin/admin-taxonomy-screen";

export default function AdminTaxonomyPage() {
  return (
    <AdminPermissionGuard
      permissionKeys={["academics.taxonomy.read", "academics.taxonomy.manage"]}
    >
      <AdminTaxonomyScreen />
    </AdminPermissionGuard>
  );
}
