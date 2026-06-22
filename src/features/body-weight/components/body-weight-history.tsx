"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BodyWeightLogForm } from "@/features/body-weight/components/body-weight-log-form";
import { formatIsraelDayLabelLong } from "@/lib/calendar-datetime";
import { deleteBodyWeightLogAction, type BodyWeightLogItem } from "@/server/actions/body-weight";

type BodyWeightHistoryProps = {
  logs: BodyWeightLogItem[];
};

export function BodyWeightHistory({ logs }: BodyWeightHistoryProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(logId: string) {
    setLoadingId(logId);
    setError(null);

    const result = await deleteBodyWeightLogAction(logId);
    setLoadingId(null);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (editingId === logId) {
      setEditingId(null);
    }

    router.refresh();
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          אין עדיין היסטוריית משקל
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-destructive text-sm">{error}</p>}
      {logs.map((log) => (
        <Card key={log.id}>
          <CardContent className="space-y-3 py-4">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{log.weightKg} ק״ג</p>
                <p className="break-words text-muted-foreground text-xs">
                  {formatIsraelDayLabelLong(log.recordedDay)}
                </p>
                {log.notes && (
                  <p className="mt-1 text-muted-foreground text-sm">{log.notes}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="עריכת רשומה"
                  onClick={() => setEditingId((current) => (current === log.id ? null : log.id))}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
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
              </div>
            </div>

            {editingId === log.id && (
              <BodyWeightLogForm
                defaultDate={log.recordedDay}
                defaultWeightKg={log.weightKg}
                submitLabel="עדכון משקל"
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
