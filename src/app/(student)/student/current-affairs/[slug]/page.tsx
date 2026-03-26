import { StudentStructuredContentDetailScreen } from "@/components/student/student-structured-content-detail-screen";

export default async function StudentCurrentAffairsDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    slug: string;
  }>;
}>) {
  const { slug } = await params;

  return (
    <StudentStructuredContentDetailScreen
      family="CURRENT_AFFAIRS"
      slug={slug}
    />
  );
}
