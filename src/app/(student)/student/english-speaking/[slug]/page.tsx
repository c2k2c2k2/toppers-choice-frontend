import { StudentStructuredContentDetailScreen } from "@/components/student/student-structured-content-detail-screen";

export default async function StudentEnglishSpeakingDetailPage({
  params,
}: Readonly<{
  params: Promise<{
    slug: string;
  }>;
}>) {
  const { slug } = await params;

  return (
    <StudentStructuredContentDetailScreen
      family="ENGLISH_SPEAKING"
      slug={slug}
    />
  );
}
