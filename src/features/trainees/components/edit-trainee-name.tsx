"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateTraineeDisplayNameAction } from "@/server/actions/trainees";

type EditTraineeNameProps = {
  traineeId: string;
  displayName: string | null;
};

export function EditTraineeName({ traineeId, displayName }: EditTraineeNameProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(displayName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shownName = displayName?.trim() || "מתאמן";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("traineeId", traineeId);
    formData.set("displayName", name.trim());

    const result = await updateTraineeDisplayNameAction(formData);
    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setName(displayName ?? "");
    setError(null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <h1 className="min-w-0 break-words font-semibold text-2xl tracking-tight">{shownName}</h1>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            setName(displayName ?? "");
            setEditing(true);
          }}
          aria-label="עריכת שם המתאמן"
        >
          <Pencil className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-wrap items-center gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        autoFocus
        disabled={loading}
        className="max-w-xs text-right"
        placeholder="שם המתאמן"
        aria-label="שם המתאמן"
      />
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "שומר..." : "שמירה"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={handleCancel} disabled={loading}>
        בטל
      </Button>
      {error && <p className="w-full text-destructive text-sm">{error}</p>}
    </form>
  );
}
