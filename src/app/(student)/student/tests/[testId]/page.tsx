import { StudentTestDetailScreen } from "@/components/student/student-test-detail-screen";

export default async function StudentTestDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    testId: string;
  }>;
}>) {
  const { testId } = await params;

  return <StudentTestDetailScreen testId={testId} />;
}
