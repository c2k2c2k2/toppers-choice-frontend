import { StudentStructuredContentDetailScreen } from "@/components/student/student-structured-content-detail-screen";

export default async function StudentCareerGuidanceDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    slug: string;
  }>;
}>) {
  const { slug } = await params;

  return (
    <StudentStructuredContentDetailScreen
      family="CAREER_GUIDANCE"
      slug={slug}
    />
  );
}
