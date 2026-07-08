import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SkeletonBar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function PageHeaderSkeleton({ hasActions = true }: { hasActions?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 space-y-2">
        <SkeletonBar className="h-8 w-40" />
        <SkeletonBar className="h-4 w-64 max-w-full" />
      </div>
      {hasActions ? (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <SkeletonBar className="h-10 w-28" />
          <SkeletonBar className="h-10 w-28" />
        </div>
      ) : null}
    </div>
  );
}

export function DashboardHomeLoadingSkeleton() {
  return (
    <div className="min-w-0 space-y-8">
      <PageHeaderSkeleton />
      <SkeletonBar className="h-56 w-full rounded-xl" />
      <div className="space-y-4">
        <SkeletonBar className="h-5 w-36" />
        <SkeletonBar className="h-48 w-full rounded-xl" />
      </div>
      <div className="space-y-4">
        <SkeletonBar className="h-5 w-40" />
        {Array.from({ length: 2 }).map((_, index) => (
          <SkeletonBar key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CalendarLoadingSkeleton() {
  return (
    <div className="min-w-0 space-y-6">
      <PageHeaderSkeleton />
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonBar key={index} className="m-2 h-8 rounded-none" />
          ))}
        </div>
        <div className="grid min-h-[24rem] grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="border-e border-border p-2 last:border-e-0">
              <SkeletonBar className="mb-3 h-16 w-full" />
              <SkeletonBar className="mb-2 h-12 w-full" />
              <SkeletonBar className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CardGridLoadingSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <SkeletonBar className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <SkeletonBar className="h-4 w-full" />
              <SkeletonBar className="h-4 w-3/4" />
              <SkeletonBar className="h-9 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ListLoadingSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, index) => (
          <SkeletonBar key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function TableLoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border bg-muted/30 p-3">
          <div className="flex gap-4">
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 w-28" />
          </div>
        </div>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex gap-4 border-b border-border p-3 last:border-b-0">
            <SkeletonBar className="h-4 w-32" />
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrackerPageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasActions={false} />
      <Card>
        <CardHeader>
          <SkeletonBar className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-4">
          <SkeletonBar className="h-10 w-full" />
          <SkeletonBar className="h-10 w-full" />
          <SkeletonBar className="h-10 w-32" />
        </CardContent>
      </Card>
      <div className="space-y-3">
        <SkeletonBar className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, index) => (
          <SkeletonBar key={index} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function SimplePageLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton hasActions={false} />
      <SkeletonBar className="h-48 w-full rounded-xl" />
    </div>
  );
}
