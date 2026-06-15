"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteWorkoutSessionAction } from "@/server/actions/workouts";

type DeleteWorkoutSessionButtonProps = {
  sessionId: string;
  sessionLabel: string;
};

export function DeleteWorkoutSessionButton({
  sessionId,
  sessionLabel,
}: DeleteWorkoutSessionButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const result = await deleteWorkoutSessionAction(sessionId);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <p className="font-medium text-sm">האם אתה בטוח שאתה רוצה למחוק את דיווח האימון?</p>
        <p className="text-muted-foreground text-xs">
          <strong>{sessionLabel}</strong> יימחק לצמיתות, כולל כל הנתונים שדווחו באימון זה.
        </p>
        {error && <p className="text-destructive text-xs">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
            {loading ? "מוחק..." : "מחק"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={loading}
          >
            בטל
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="size-3.5" />
      מחיקת דיווח
    </Button>
  );
}
