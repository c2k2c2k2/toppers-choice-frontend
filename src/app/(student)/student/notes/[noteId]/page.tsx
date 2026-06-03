import { redirect } from "next/navigation";

export default async function StudentNoteDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    noteId: string;
  }>;
}>) {
  const { noteId } = await params;

  redirect(`/student/notes/${encodeURIComponent(noteId)}/read`);
}
