import { StudentStructuredContentDetailScreen } from "@/components/student/student-structured-content-detail-screen";

export default async function StudentMonthlyUpdatesDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    slug: string;
  }>;
}>) {
  const { slug } = await params;

  return (
    <StudentStructuredContentDetailScreen
      family="MONTHLY_UPDATE"
      slug={slug}
    />
  );
}
