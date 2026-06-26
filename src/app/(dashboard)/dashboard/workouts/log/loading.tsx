import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LogWorkoutLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 max-w-full animate-pulse rounded-md bg-muted" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="h-10 w-28 animate-pulse rounded-md bg-muted" />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
