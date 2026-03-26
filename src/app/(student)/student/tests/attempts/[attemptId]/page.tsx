import { StudentTestAttemptScreen } from "@/components/student/student-test-attempt-screen";

export default async function StudentTestAttemptPage({
  params,
}: Readonly<{
  params: Promise<{
    attemptId: string;
  }>;
}>) {
  const { attemptId } = await params;

  return <StudentTestAttemptScreen attemptId={attemptId} />;
}
