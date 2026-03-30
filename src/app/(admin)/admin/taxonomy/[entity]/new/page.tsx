import { notFound } from "next/navigation"
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard"
import { AdminTaxonomyScreen } from "@/components/admin/admin-taxonomy-screen"
import { parseAdminTaxonomyEntitySlug } from "@/lib/admin/taxonomy-routes"

export default async function AdminTaxonomyNewEntityPage({
  params,
}: Readonly<{
  params: Promise<{
    entity: string
  }>
}>) {
  const { entity } = await params
  const parsedEntity = parseAdminTaxonomyEntitySlug(entity)

  if (!parsedEntity) {
    notFound()
  }

  return (
    <AdminPermissionGuard
      permissionKeys={["academics.taxonomy.read", "academics.taxonomy.manage"]}
    >
      <AdminTaxonomyScreen entity={parsedEntity} view="editor" />
    </AdminPermissionGuard>
  )
}
