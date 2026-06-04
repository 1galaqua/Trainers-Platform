"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { programTypeLabels } from "@/lib/program-labels";
import {
  createTrainingProgramAction,
  updateTrainingProgramAction,
} from "@/server/actions/programs";

type Trainee = { id: string; displayName: string | null };

type ExerciseDraft = {
  clientId: string;
  dbId?: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  coachNotes: string;
  youtubeUrl: string;
  instructions: string;
};

function emptyExercise(): ExerciseDraft {
  return {
    clientId: crypto.randomUUID(),
    name: "",
    sets: 3,
    reps: 10,
    restSeconds: 60,
    coachNotes: "",
    youtubeUrl: "",
    instructions: "",
  };
}

export type ProgramFormInitial = {
  programId: string;
  traineeId: string;
  traineeName: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
    coachNotes: string | null;
    youtubeUrl: string | null;
    instructions: string | null;
  }>;
};

type ProgramFormProps =
  | { mode: "create"; trainees: Trainee[]; initial?: undefined }
  | { mode: "edit"; trainees?: undefined; initial: ProgramFormInitial };

export function ProgramForm(props: ProgramFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : undefined;
  const editInitial = isEdit ? props.initial : null;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<ExerciseDraft[]>(() => {
    if (initial?.exercises.length) {
      return initial.exercises.map((ex) => ({
        clientId: crypto.randomUUID(),
        dbId: ex.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        restSeconds: ex.restSeconds,
        coachNotes: ex.coachNotes ?? "",
        youtubeUrl: ex.youtubeUrl ?? "",
        instructions: ex.instructions ?? "",
      }));
    }
    return [emptyExercise()];
  });

  function updateExercise(clientId: string, patch: Partial<ExerciseDraft>) {
    setExercises((prev) =>
      prev.map((ex) => (ex.clientId === clientId ? { ...ex, ...patch } : ex)),
    );
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()]);
  }

  function removeExercise(clientId: string) {
    setExercises((prev) => (prev.length <= 1 ? prev : prev.filter((ex) => ex.clientId !== clientId)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set(
      "exercises",
      JSON.stringify(
        exercises.map(({ dbId, name, sets, reps, restSeconds, coachNotes, youtubeUrl, instructions }) => ({
          ...(dbId ? { id: dbId } : {}),
          name,
          sets,
          reps,
          restSeconds,
          coachNotes,
          youtubeUrl,
          instructions,
        })),
      ),
    );

    const result = isEdit
      ? await updateTrainingProgramAction(formData)
      : await createTrainingProgramAction(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.programId) {
      router.push(`/dashboard/workouts/${result.programId}`);
    } else {
      router.push("/dashboard/workouts");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEdit && editInitial && (
        <input type="hidden" name="programId" value={editInitial.programId} />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {isEdit && editInitial ? (
          <div className="space-y-2">
            <Label>מתאמן</Label>
            <Input value={editInitial.traineeName} disabled readOnly />
            <input type="hidden" name="traineeId" value={editInitial.traineeId} />
          </div>
        ) : props.mode === "create" ? (
          <div className="space-y-2">
            <Label htmlFor="traineeId">מתאמן</Label>
            <Select id="traineeId" name="traineeId" required defaultValue="">
              <option value="" disabled>
                בחר מתאמן
              </option>
              {props.trainees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName ?? "מתאמן"}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="type">סוג תוכנית</Label>
          <Select id="type" name="type" defaultValue={initial?.type ?? "STRENGTH"}>
            {Object.entries(programTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">שם התוכנית</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="לדוגמה: תוכנית כוח — שבוע 1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">תיאור (אופציונלי)</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initial?.description ?? ""}
        />
      </div>

      {isEdit && editInitial && (
        <div className="space-y-2">
          <Label htmlFor="isActive">סטטוס תוכנית</Label>
          <Select
            id="isActive"
            name="isActive"
            defaultValue={editInitial.isActive ? "true" : "false"}
          >
            <option value="true">פעילה — מוצגת למתאמן</option>
            <option value="false">לא פעילה — מוסתרת מהמתאמן</option>
          </Select>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">תרגילים</h3>
          <Button type="button" variant="outline" size="sm" onClick={addExercise}>
            <Plus className="size-4" />
            הוסף תרגיל
          </Button>
        </div>

        {exercises.map((ex, index) => (
          <div key={ex.clientId} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">תרגיל {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeExercise(ex.clientId)}
                aria-label="הסר תרגיל"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>שם התרגיל</Label>
                <Input
                  required
                  value={ex.name}
                  onChange={(e) => updateExercise(ex.clientId, { name: e.target.value })}
                  placeholder="לדוגמה: סקוואט"
                />
              </div>
              <div className="space-y-1">
                <Label>סטים</Label>
                <Input
                  type="number"
                  min={1}
                  value={ex.sets}
                  onChange={(e) => updateExercise(ex.clientId, { sets: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>חזרות</Label>
                <Input
                  type="number"
                  min={1}
                  value={ex.reps}
                  onChange={(e) => updateExercise(ex.clientId, { reps: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>מנוחה (שניות)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ex.restSeconds}
                  onChange={(e) =>
                    updateExercise(ex.clientId, { restSeconds: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>קישור YouTube</Label>
                <Input
                  type="url"
                  value={ex.youtubeUrl}
                  onChange={(e) => updateExercise(ex.clientId, { youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>הערות מאמן</Label>
                <Textarea
                  value={ex.coachNotes}
                  onChange={(e) => updateExercise(ex.clientId, { coachNotes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>הסבר לביצוע</Label>
                <Textarea
                  value={ex.instructions}
                  onChange={(e) => updateExercise(ex.clientId, { instructions: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : isEdit ? "שמירת שינויים" : "יצירת תוכנית"}
      </Button>
    </form>
  );
}
