import { StudentNoteDetailScreen } from "@/components/student/student-note-detail-screen";

export default async function StudentNoteDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    noteId: string;
  }>;
}>) {
  const { noteId } = await params;

  return <StudentNoteDetailScreen noteId={noteId} />;
}
