"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatIsraelDayLabelLong } from "@/lib/calendar-datetime";
import { formatWaterDisplay } from "@/lib/water-validation";
import { deleteWaterLogAction, type WaterLogItem } from "@/server/actions/water";

type WaterHistoryProps = {
  logs: WaterLogItem[];
};

export function WaterHistory({ logs }: WaterHistoryProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(logId: string) {
    setLoadingId(logId);
    setError(null);
    const result = await deleteWaterLogAction(logId);
    setLoadingId(null);
    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-base">
          אין עדיין היסטוריית שתייה
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="flex min-w-0 items-start justify-between gap-3 py-4">
            <div className="min-w-0">
              <p className="font-medium text-sm">{formatWaterDisplay(log.amountMl)}</p>
              <p className="text-muted-foreground text-sm">{formatIsraelDayLabelLong(log.recordedDay)}</p>
              {log.notes && <p className="mt-1 text-muted-foreground text-base">{log.notes}</p>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="מחיקת רשומה"
              disabled={loadingId === log.id}
              onClick={() => void handleDelete(log.id)}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
