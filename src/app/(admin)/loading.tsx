import { LoadingState } from "@/components/primitives/loading-state";

export default function AdminLoading() {
  return (
    <LoadingState
      title="Loading admin panel"
      description="Opening the admin panel and the latest data."
    />
  );
}
