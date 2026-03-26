import { StudentStructuredContentDetailScreen } from "@/components/student/student-structured-content-detail-screen";

export default async function StudentInterviewGuidanceDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    slug: string;
  }>;
}>) {
  const { slug } = await params;

  return (
    <StudentStructuredContentDetailScreen
      family="INTERVIEW_GUIDANCE"
      slug={slug}
    />
  );
}
