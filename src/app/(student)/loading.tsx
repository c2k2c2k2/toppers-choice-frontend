import { LoadingState } from "@/components/primitives/loading-state";

export default function StudentLoading() {
  return (
    <LoadingState
      title="Loading student app"
      description="Opening your dashboard and latest study data."
    />
  );
}
