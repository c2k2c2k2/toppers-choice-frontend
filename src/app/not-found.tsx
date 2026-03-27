import { EmptyState } from "@/components/primitives/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl items-center px-4 py-10">
      <EmptyState
        eyebrow="Not found"
        title="This public path is not available."
        description="The page you are looking for does not exist or has been moved."
        ctaHref="/"
        ctaLabel="Return to public home"
      />
    </main>
  );
}
