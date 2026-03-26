import { EmptyState } from "@/components/primitives/empty-state";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl items-center px-4 py-10">
      <EmptyState
        eyebrow="Not found"
        title="This public path is not available."
        description="The route either has not been authored yet or the requested CMS-backed public page does not exist."
        ctaHref="/"
        ctaLabel="Return to public home"
      />
    </main>
  );
}
