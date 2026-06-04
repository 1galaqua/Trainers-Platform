"use client";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  answersFromLegacyResponse,
  formatAnswerValue,
  type QuestionField,
} from "@/lib/onboarding-template";
import { OnboardingDocumentDownload } from "@/features/onboarding/components/onboarding-document-download";
import type { CoachTraineeListItem } from "@/server/actions/trainees";

type QuestionnaireSheetProps = {
  traineeId: string;
  traineeName: string;
  questionnaire: NonNullable<CoachTraineeListItem["questionnaire"]>;
  fields: QuestionField[];
  hasSignedAgreement?: boolean;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function QuestionnaireSheet({
  traineeId,
  traineeName,
  questionnaire,
  fields,
  hasSignedAgreement = false,
}: QuestionnaireSheetProps) {
  const answers =
    questionnaire.answers ??
    answersFromLegacyResponse({
      age: questionnaire.age,
      heightCm: questionnaire.heightCm,
      weightKg: questionnaire.weightKg,
      goal: questionnaire.goal,
      experience: questionnaire.experience,
      injuries: questionnaire.injuries,
      sessionsPerWeek: questionnaire.sessionsPerWeek,
      equipment: questionnaire.equipment,
    });

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
          {fields.map((field) => (
            <Field
              key={field.key}
              label={field.label}
              value={formatAnswerValue(answers[field.key], field)}
              multiline={field.type === "textarea"}
            />
          ))}
          {hasSignedAgreement && (
            <div className="pt-2">
              <OnboardingDocumentDownload traineeId={traineeId} />
            </div>
          )}
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
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className={multiline ? "sm:col-span-2" : undefined}>
      <p className="font-medium text-muted-foreground text-xs">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
