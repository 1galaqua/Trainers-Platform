import { TrackingGridsLoading } from "@/features/tracking/components/tracking-grids-loading";

export default function TrackingLoading() {
  return (
    <div className="min-w-0 space-y-8">
      <div className="space-y-2">
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <TrackingGridsLoading />
    </div>
  );
}
