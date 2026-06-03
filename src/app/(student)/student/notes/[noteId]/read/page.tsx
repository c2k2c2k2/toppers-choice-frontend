import { StudentNoteReaderScreen } from "@/components/student/student-note-reader-screen";

export default async function StudentNoteReaderPage({
  params,
}: Readonly<{
  params: Promise<{
    noteId: string;
  }>;
}>) {
  const { noteId } = await params;

  return <StudentNoteReaderScreen noteId={noteId} />;
}
