import { StudentPracticeSessionScreen } from "@/components/student/student-practice-session-screen";

export default async function StudentPracticeSessionPage({
  params,
}: Readonly<{
  params: Promise<{
    sessionId: string;
  }>;
}>) {
  const { sessionId } = await params;

  return <StudentPracticeSessionScreen sessionId={sessionId} />;
}
