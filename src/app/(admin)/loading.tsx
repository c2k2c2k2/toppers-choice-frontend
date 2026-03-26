import { LoadingState } from "@/components/primitives/loading-state";

export default function AdminLoading() {
  return (
    <LoadingState
      title="Preparing the admin surface"
      description="Shared providers and admin route-group shell are loading for future permission-aware tooling."
    />
  );
}
