"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { deleteTrainingProgramAction } from "@/server/actions/programs";

type DeleteProgramButtonProps = {
  programId: string;
  programName: string;
};

export function DeleteProgramButton({ programId, programName }: DeleteProgramButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);

    const result = await deleteTrainingProgramAction(programId);
    setLoading(false);

    if (result && "error" in result && result.error) {
      setError(result.error);
      return;
    }

    router.push("/dashboard/workouts");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="w-full max-w-md space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <p className="font-medium text-sm">
          האם אתה בטוח שאתה רוצה למחוק את תוכנית האימונים?
        </p>
        <p className="text-muted-foreground text-sm">
          <strong>{programName}</strong> תימחק לצמיתות, כולל כל הדיווחים והאימונים שבוצעו עליה.
        </p>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "מוחק..." : "מחק"}
          </Button>
          <Button variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
            בטל
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Button variant="destructive" onClick={() => setConfirming(true)}>
      <Trash2 className="size-4" />
      מחיקת תוכנית
    </Button>
  );
}
