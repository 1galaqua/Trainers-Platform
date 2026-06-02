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
import { createTrainingProgramAction } from "@/server/actions/programs";

type Trainee = { id: string; displayName: string | null };

type ExerciseDraft = {
  id: string;
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
    id: crypto.randomUUID(),
    name: "",
    sets: 3,
    reps: 10,
    restSeconds: 60,
    coachNotes: "",
    youtubeUrl: "",
    instructions: "",
  };
}

type CreateProgramFormProps = {
  trainees: Trainee[];
};

export function CreateProgramForm({ trainees }: CreateProgramFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState<ExerciseDraft[]>([emptyExercise()]);

  function updateExercise(id: string, patch: Partial<ExerciseDraft>) {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)));
  }

  function addExercise() {
    setExercises((prev) => [...prev, emptyExercise()]);
  }

  function removeExercise(id: string) {
    setExercises((prev) => (prev.length <= 1 ? prev : prev.filter((ex) => ex.id !== id)));
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
        exercises.map(({ name, sets, reps, restSeconds, coachNotes, youtubeUrl, instructions }) => ({
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

    const result = await createTrainingProgramAction(formData);
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="traineeId">מתאמן</Label>
          <Select id="traineeId" name="traineeId" required defaultValue="">
            <option value="" disabled>
              בחר מתאמן
            </option>
            {trainees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.displayName ?? "מתאמן"}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">סוג תוכנית</Label>
          <Select id="type" name="type" defaultValue="STRENGTH">
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
        <Input id="name" name="name" required placeholder="לדוגמה: תוכנית כוח — שבוע 1" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">תיאור (אופציונלי)</Label>
        <Textarea id="description" name="description" rows={2} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">תרגילים</h3>
          <Button type="button" variant="outline" size="sm" onClick={addExercise}>
            <Plus className="size-4" />
            הוסף תרגיל
          </Button>
        </div>

        {exercises.map((ex, index) => (
          <div key={ex.id} className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">תרגיל {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeExercise(ex.id)}
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
                  onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
                  placeholder="לדוגמה: סקוואט"
                />
              </div>
              <div className="space-y-1">
                <Label>סטים</Label>
                <Input
                  type="number"
                  min={1}
                  value={ex.sets}
                  onChange={(e) => updateExercise(ex.id, { sets: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>חזרות</Label>
                <Input
                  type="number"
                  min={1}
                  value={ex.reps}
                  onChange={(e) => updateExercise(ex.id, { reps: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>מנוחה (שניות)</Label>
                <Input
                  type="number"
                  min={0}
                  value={ex.restSeconds}
                  onChange={(e) => updateExercise(ex.id, { restSeconds: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <Label>קישור YouTube</Label>
                <Input
                  type="url"
                  value={ex.youtubeUrl}
                  onChange={(e) => updateExercise(ex.id, { youtubeUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                  dir="ltr"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>הערות מאמן</Label>
                <Textarea
                  value={ex.coachNotes}
                  onChange={(e) => updateExercise(ex.id, { coachNotes: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>הסבר לביצוע</Label>
                <Textarea
                  value={ex.instructions}
                  onChange={(e) => updateExercise(ex.id, { instructions: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "שומר..." : "יצירת תוכנית"}
      </Button>
    </form>
  );
}
