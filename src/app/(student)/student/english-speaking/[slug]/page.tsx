import { StudentEnglishSpeakingDetailScreen } from "@/components/student/student-english-speaking-detail-screen";

export default async function StudentEnglishSpeakingDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    slug: string;
  }>;
}>) {
  const { slug } = await params;

  return <StudentEnglishSpeakingDetailScreen slug={slug} />;
}
