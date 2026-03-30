import { notFound } from "next/navigation";
import { htmlToPlainText } from "@/lib/admin/rich-text";
import { PublicPageBody } from "@/components/public/public-page-body";
import { PublicPageHero } from "@/components/public/public-page-hero";
import {
  buildPublicMetadata,
  extractPageDescription,
  getPublicStandalonePage,
} from "@/lib/public";

type PublicStandalonePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicStandalonePageProps) {
  const { slug } = await params;
  const pageResult = await getPublicStandalonePage(slug);

  if (!pageResult) {
    return buildPublicMetadata({
      title: "Page not found",
      description: "The requested public page was not found.",
      path: `/${slug}`,
      noIndex: true,
    });
  }

  const noIndex = slug === "privacy" || slug === "terms";

  return buildPublicMetadata({
    title: htmlToPlainText(pageResult.page.title) || pageResult.page.title,
    description: extractPageDescription(pageResult.page, pageResult.page.summary ?? ""),
    path: `/${slug}`,
    noIndex,
  });
}

export default async function PublicStandalonePage({
  params,
}: PublicStandalonePageProps) {
  const { slug } = await params;
  const pageResult = await getPublicStandalonePage(slug);

  if (!pageResult) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <PublicPageHero
        eyebrow="Information"
        title={pageResult.page.title}
        description={
          pageResult.page.summary ??
          "Important information from Topper's Choice."
        }
        actions={[
          { label: "Return home", href: "/", tone: "secondary" },
          { label: "Open pricing", href: "/pricing", tone: "primary" },
        ]}
      />

      <PublicPageBody
        bodyJson={pageResult.page.bodyJson}
        fallbackSummary={
          pageResult.page.summary ??
          "This page will be updated with more details soon."
        }
      />
    </div>
  );
}
