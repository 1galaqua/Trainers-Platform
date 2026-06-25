"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PROGRAM_SECTION_NAME } from "@/lib/program-sections";
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

type SectionDraft = {
  clientId: string;
  dbId?: string;
  name: string;
  exercises: ExerciseDraft[];
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

function emptySection(name = ""): SectionDraft {
  return {
    clientId: crypto.randomUUID(),
    name,
    exercises: [emptyExercise()],
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
  sections: Array<{
    id: string;
    name: string;
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
  }>;
};

type ProgramFormProps =
  | {
      mode: "create";
      trainees: Trainee[];
      initialTraineeId?: string;
      selectedTraineeId?: string;
      onTraineeIdChange?: (traineeId: string) => void;
      initial?: undefined;
    }
  | { mode: "edit"; trainees?: undefined; initial: ProgramFormInitial };

function buildInitialSections(initial?: ProgramFormInitial): SectionDraft[] {
  if (initial?.sections.length) {
    return initial.sections.map((section) => ({
      clientId: crypto.randomUUID(),
      dbId: section.id,
      name: section.name,
      exercises: section.exercises.map((exercise) => ({
        clientId: crypto.randomUUID(),
        dbId: exercise.id,
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSeconds: exercise.restSeconds,
        coachNotes: exercise.coachNotes ?? "",
        youtubeUrl: exercise.youtubeUrl ?? "",
        instructions: exercise.instructions ?? "",
      })),
    }));
  }

  return [emptySection()];
}

type ExerciseFieldsProps = {
  exercise: ExerciseDraft;
  index: number;
  onChange: (patch: Partial<ExerciseDraft>) => void;
  onRemove: () => void;
  canRemove: boolean;
};

function ExerciseFields({
  exercise,
  index,
  onChange,
  onRemove,
  canRemove,
}: ExerciseFieldsProps) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  function handleConfirmRemove() {
    onRemove();
    setConfirmingRemove(false);
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-medium text-sm">תרגיל {index + 1}</span>
        {confirmingRemove ? (
          <div className="max-w-xs shrink-0 space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-right">
            <p className="text-sm">האם אתה בטוח?</p>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="destructive" size="sm" onClick={handleConfirmRemove}>
                מחק
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmingRemove(false)}
              >
                בטל
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmingRemove(true)}
            disabled={!canRemove}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            מחק תרגיל
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label>שם התרגיל</Label>
          <Input
            required
            value={exercise.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="לדוגמה: סקוואט"
          />
        </div>
        <div className="space-y-1">
          <Label>סטים</Label>
          <Input
            type="number"
            min={1}
            value={exercise.sets}
            onChange={(e) => onChange({ sets: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>חזרות</Label>
          <Input
            type="number"
            min={1}
            value={exercise.reps}
            onChange={(e) => onChange({ reps: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>מנוחה (שניות)</Label>
          <Input
            type="number"
            min={0}
            value={exercise.restSeconds}
            onChange={(e) => onChange({ restSeconds: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-1">
          <Label>קישור YouTube</Label>
          <Input
            type="url"
            value={exercise.youtubeUrl}
            onChange={(e) => onChange({ youtubeUrl: e.target.value })}
            placeholder="https://youtube.com/..."
            dir="ltr"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>הערות מאמן</Label>
          <Textarea
            value={exercise.coachNotes}
            onChange={(e) => onChange({ coachNotes: e.target.value })}
            rows={2}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label>הסבר לביצוע</Label>
          <Textarea
            value={exercise.instructions}
            onChange={(e) => onChange({ instructions: e.target.value })}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

export function ProgramForm(props: ProgramFormProps) {
  const router = useRouter();
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : undefined;
  const editInitial = isEdit ? props.initial : null;
  const defaultTraineeId =
    props.mode === "create" &&
    props.initialTraineeId &&
    props.trainees.some((trainee) => trainee.id === props.initialTraineeId)
      ? props.initialTraineeId
      : "";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<SectionDraft[]>(() => buildInitialSections(initial));

  function updateSection(clientId: string, patch: Partial<SectionDraft>) {
    setSections((prev) =>
      prev.map((section) => (section.clientId === clientId ? { ...section, ...patch } : section)),
    );
  }

  function updateExercise(sectionClientId: string, exerciseClientId: string, patch: Partial<ExerciseDraft>) {
    setSections((prev) =>
      prev.map((section) => {
        if (section.clientId !== sectionClientId) return section;
        return {
          ...section,
          exercises: section.exercises.map((exercise) =>
            exercise.clientId === exerciseClientId ? { ...exercise, ...patch } : exercise,
          ),
        };
      }),
    );
  }

  function addSection() {
    setSections((prev) => [...prev, emptySection()]);
  }

  function removeSection(clientId: string) {
    setSections((prev) => (prev.length <= 1 ? prev : prev.filter((section) => section.clientId !== clientId)));
  }

  function addExercise(sectionClientId: string) {
    setSections((prev) =>
      prev.map((section) =>
        section.clientId === sectionClientId
          ? { ...section, exercises: [...section.exercises, emptyExercise()] }
          : section,
      ),
    );
  }

  function removeExercise(sectionClientId: string, exerciseClientId: string) {
    setSections((prev) =>
      prev.map((section) => {
        if (section.clientId !== sectionClientId) return section;
        if (section.exercises.length <= 1) return section;
        return {
          ...section,
          exercises: section.exercises.filter((exercise) => exercise.clientId !== exerciseClientId),
        };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set(
      "sections",
      JSON.stringify(
        sections.map(({ dbId, name, exercises }) => ({
          ...(dbId ? { id: dbId } : {}),
          name,
          exercises: exercises.map(
            ({ dbId: exerciseDbId, name: exerciseName, sets, reps, restSeconds, coachNotes, youtubeUrl, instructions }) => ({
              ...(exerciseDbId ? { id: exerciseDbId } : {}),
              name: exerciseName,
              sets,
              reps,
              restSeconds,
              coachNotes,
              youtubeUrl,
              instructions,
            }),
          ),
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
            <Select
              id="traineeId"
              name="traineeId"
              required
              value={props.onTraineeIdChange ? props.selectedTraineeId ?? "" : undefined}
              defaultValue={props.onTraineeIdChange ? undefined : defaultTraineeId}
              onChange={
                props.onTraineeIdChange
                  ? (e) => props.onTraineeIdChange?.(e.target.value)
                  : undefined
              }
            >
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
          <h3 className="font-medium text-sm">מקטעים ותרגילים</h3>
          <Button type="button" variant="outline" size="sm" onClick={addSection}>
            <Plus className="size-4" />
            הוסף מקטע
          </Button>
        </div>

        {sections.map((section, sectionIndex) => (
          <div
            key={section.clientId}
            className="space-y-4 rounded-xl border border-border bg-muted/10 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`section-name-${section.clientId}`}>קבוצת שרירים</Label>
                <Input
                  id={`section-name-${section.clientId}`}
                  required
                  value={section.name}
                  onChange={(e) => updateSection(section.clientId, { name: e.target.value })}
                  placeholder="לדוגמה: חזה"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeSection(section.clientId)}
                disabled={sections.length <= 1}
                aria-label="הסר מקטע"
                className="mt-6 shrink-0"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">מקטע {sectionIndex + 1}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addExercise(section.clientId)}
              >
                <Plus className="size-4" />
                הוסף תרגיל
              </Button>
            </div>

            {section.exercises.map((exercise, exerciseIndex) => (
              <ExerciseFields
                key={exercise.clientId}
                exercise={exercise}
                index={exerciseIndex}
                onChange={(patch) => updateExercise(section.clientId, exercise.clientId, patch)}
                onRemove={() => removeExercise(section.clientId, exercise.clientId)}
                canRemove={section.exercises.length > 1}
              />
            ))}
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
