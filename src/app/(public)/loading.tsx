import { LoadingState } from "@/components/primitives/loading-state";

export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <LoadingState
        title="Preparing the public surface"
        description="Topper's Choice public routes, CMS-ready sections, and server-first landing content are starting up."
      />
    </div>
  );
}
