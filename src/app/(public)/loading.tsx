import { LoadingState } from "@/components/primitives/loading-state";

export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <LoadingState
        title="Loading website"
        description="Opening the latest Topper's Choice website content."
      />
    </div>
  );
}
