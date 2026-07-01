import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TrackingGridsLoading() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="min-w-0">
          <CardHeader>
            <div className="h-5 w-32 animate-pulse rounded-md bg-muted" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-14 animate-pulse rounded-lg bg-muted" />
            {Array.from({ length: 4 }).map((__, rowIndex) => (
              <div key={rowIndex} className="h-14 animate-pulse rounded-lg bg-muted" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
