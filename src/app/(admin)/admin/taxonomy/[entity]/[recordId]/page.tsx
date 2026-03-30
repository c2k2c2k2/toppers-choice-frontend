import { notFound } from "next/navigation"
import { AdminPermissionGuard } from "@/components/admin/admin-permission-guard"
import { AdminTaxonomyScreen } from "@/components/admin/admin-taxonomy-screen"
import { parseAdminTaxonomyEntitySlug } from "@/lib/admin/taxonomy-routes"

export default async function AdminTaxonomyEditEntityPage({
  params,
}: Readonly<{
  params: Promise<{
    entity: string
    recordId: string
  }>
}>) {
  const { entity, recordId } = await params
  const parsedEntity = parseAdminTaxonomyEntitySlug(entity)

  if (!parsedEntity) {
    notFound()
  }

  return (
    <AdminPermissionGuard
      permissionKeys={["academics.taxonomy.read", "academics.taxonomy.manage"]}
    >
      <AdminTaxonomyScreen entity={parsedEntity} recordId={recordId} view="editor" />
    </AdminPermissionGuard>
  )
}
