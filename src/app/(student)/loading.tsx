import { LoadingState } from "@/components/primitives/loading-state";

export default function StudentLoading() {
  return (
    <LoadingState
      title="Preparing the student surface"
      description="Shared providers, route group layout, and starter client state are loading for the student app."
    />
  );
}
