import { StudentSubjectCatalogScreen } from "@/components/student/student-subject-catalog-screen";

export default async function StudentSubjectCatalogPage({
  params,
}: Readonly<{
  params: Promise<{
    subjectSlug: string;
  }>;
}>) {
  const { subjectSlug } = await params;

  return <StudentSubjectCatalogScreen subjectSlug={subjectSlug} />;
}
