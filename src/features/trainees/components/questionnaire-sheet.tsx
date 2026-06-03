"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CoachTraineeListItem } from "@/server/actions/trainees";

type QuestionnaireSheetProps = {
  traineeName: string;
  questionnaire: NonNullable<CoachTraineeListItem["questionnaire"]>;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function QuestionnaireSheet({ traineeName, questionnaire }: QuestionnaireSheetProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <button
            type="button"
            className="cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`צפייה בשאלון של ${traineeName}`}
          />
        }
      >
        <Badge variant="secondary" className="hover:bg-secondary/80">
          שאלון הושלם
        </Badge>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>שאלון ראשוני — {traineeName}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-3 px-4 pb-6 text-sm">
          <p className="text-muted-foreground text-xs">
            הושלם ב-{formatDate(questionnaire.completedAt)}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="גיל" value={questionnaire.age?.toString()} />
            <Field label="גובה" value={questionnaire.heightCm ? `${questionnaire.heightCm} ס״מ` : null} />
            <Field label="משקל" value={questionnaire.weightKg ? `${questionnaire.weightKg} ק״ג` : null} />
            <Field label="אימונים בשבוע" value={questionnaire.sessionsPerWeek?.toString()} />
          </div>
          <Field label="מטרת האימון" value={questionnaire.goal} multiline />
          <Field label="ניסיון באימונים" value={questionnaire.experience} multiline />
          <Field label="פציעות / מגבלות" value={questionnaire.injuries} multiline />
          <Field label="ציוד זמין" value={questionnaire.equipment} multiline />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "sm:col-span-2" : undefined}>
      <p className="font-medium text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{value?.trim() || "—"}</p>
    </div>
  );
}
