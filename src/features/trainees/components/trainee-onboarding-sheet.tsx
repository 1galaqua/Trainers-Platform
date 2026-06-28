"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OnboardingDocumentDownload } from "@/features/onboarding/components/onboarding-document-download";
import {
  answersFromLegacyResponse,
  formatAnswerValue,
  type QuestionField,
} from "@/lib/onboarding-template";
import {
  agreementVersionLabel,
  CURRENT_ONBOARDING_VERSION_ID,
  formatOnboardingVersionDate,
  questionnaireVersionLabel,
  type OnboardingQuestionnaireVersion,
} from "@/lib/onboarding-versions";
import {
  getTraineeOnboardingVersionsAction,
  type TraineeOnboardingVersions,
} from "@/server/actions/trainees";

type TraineeOnboardingSheetProps = {
  traineeId: string;
  traineeName: string;
  fields: QuestionField[];
  hasQuestionnaire: boolean;
};

function formatLegacyAnswers(version: OnboardingQuestionnaireVersion) {
  return (
    version.answers ??
    answersFromLegacyResponse({
      age: version.age,
      heightCm: version.heightCm,
      weightKg: version.weightKg,
      goal: version.goal,
      experience: version.experience,
      injuries: version.injuries,
      sessionsPerWeek: version.sessionsPerWeek,
      equipment: version.equipment,
    })
  );
}

function formatPhoneDisplay(phone: string | null) {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return phone;
}

function UserDetailsSection({ details }: { details: TraineeOnboardingVersions["userDetails"] }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <p className="font-medium text-sm">פרטי משתמש</p>
      <Field label="שם מלא" value={details.displayName?.trim() || "—"} />
      <Field label="אימייל" value={details.email?.trim() || "—"} />
      <Field label="טלפון" value={formatPhoneDisplay(details.phoneNumber)} />
      <Field
        label="גיל"
        value={details.age != null ? String(details.age) : "—"}
      />
    </div>
  );
}

export function TraineeOnboardingSheet({
  traineeId,
  traineeName,
  fields,
  hasQuestionnaire,
}: TraineeOnboardingSheetProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<TraineeOnboardingVersions | null>(null);

  const [questionnaireId, setQuestionnaireId] = useState(CURRENT_ONBOARDING_VERSION_ID);
  const [agreementId, setAgreementId] = useState(CURRENT_ONBOARDING_VERSION_ID);
  const [viewQuestionnaire, setViewQuestionnaire] = useState(true);
  const [viewAgreement, setViewAgreement] = useState(true);
  const [downloadQuestionnaire, setDownloadQuestionnaire] = useState(true);
  const [downloadAgreement, setDownloadAgreement] = useState(true);

  useEffect(() => {
    if (!open || versions || !hasQuestionnaire) return;

    let cancelled = false;
    setLoading(true);
    getTraineeOnboardingVersionsAction(traineeId).then((data) => {
      if (cancelled) return;
      setLoading(false);
      if (!data) return;
      setVersions(data);
      const firstQ = data.questionnaires[0]?.id ?? CURRENT_ONBOARDING_VERSION_ID;
      const firstA = data.agreements[0]?.id ?? CURRENT_ONBOARDING_VERSION_ID;
      setQuestionnaireId(firstQ);
      setAgreementId(firstA);
      setViewAgreement(data.agreements.length > 0);
      setDownloadAgreement(data.agreements.length > 0);
    });

    return () => {
      cancelled = true;
    };
  }, [open, versions, traineeId, hasQuestionnaire]);

  const selectedQuestionnaire = useMemo(
    () => versions?.questionnaires.find((q) => q.id === questionnaireId),
    [versions, questionnaireId],
  );

  const selectedAgreement = useMemo(
    () => versions?.agreements.find((a) => a.id === agreementId),
    [versions, agreementId],
  );

  const questionnaireLabels = useMemo(() => {
    if (!versions) return [];
    return versions.questionnaires.map((q, index) => ({
      id: q.id,
      label: questionnaireVersionLabel(q, versions.questionnaires.length - index),
    }));
  }, [versions]);

  const agreementLabels = useMemo(() => {
    if (!versions) return [];
    return versions.agreements.map((a, index) => ({
      id: a.id,
      label: agreementVersionLabel(a, versions.agreements.length - index),
    }));
  }, [versions]);

  if (!hasQuestionnaire) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
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
      <SheetContent
        side="right"
        className="flex h-full max-h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md [&>button]:top-3 [&>button]:right-auto [&>button]:left-3"
      >
        <SheetHeader className="shrink-0 border-border border-b">
          <SheetTitle>שאלון והסכם — {traineeName}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="grid gap-4 px-4 py-4 pb-6 text-sm">
          {loading && <p className="text-muted-foreground text-xs">טוען גרסאות...</p>}

          {versions && <UserDetailsSection details={versions.userDetails} />}

          {versions && versions.questionnaires.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="questionnaire-version">גרסת שאלון לצפייה</Label>
              <Select
                id="questionnaire-version"
                value={questionnaireId}
                onChange={(e) => setQuestionnaireId(e.target.value)}
              >
                {questionnaireLabels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {versions && versions.agreements.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="agreement-version">גרסת הסכם לצפייה</Label>
              <Select
                id="agreement-version"
                value={agreementId}
                onChange={(e) => setAgreementId(e.target.value)}
              >
                {agreementLabels.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <fieldset className="space-y-2 rounded-lg border border-border p-3">
            <legend className="px-1 font-medium text-xs">מה להציג</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={viewQuestionnaire}
                onChange={(e) => setViewQuestionnaire(e.target.checked)}
              />
              שאלון
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={viewAgreement}
                disabled={!versions?.agreements.length}
                onChange={(e) => setViewAgreement(e.target.checked)}
              />
              הסכם וחתימה
            </label>
          </fieldset>

          {viewQuestionnaire && selectedQuestionnaire && (
            <div className="space-y-3">
              <p className="font-medium text-muted-foreground text-xs">שאלון</p>
              <p className="text-muted-foreground text-xs">
                הושלם ב-{formatOnboardingVersionDate(selectedQuestionnaire.completedAt)}
              </p>
              {fields.map((field) => {
                const answers = formatLegacyAnswers(selectedQuestionnaire);
                return (
                  <Field
                    key={field.key}
                    label={field.label}
                    value={formatAnswerValue(answers[field.key], field)}
                    multiline={field.type === "textarea"}
                  />
                );
              })}
            </div>
          )}

          {viewAgreement && selectedAgreement && (
            <div className="space-y-2 border-border border-t pt-4">
              <p className="font-medium text-muted-foreground text-xs">הסכם וחתימה</p>
              <p className="text-muted-foreground text-xs">
                נחתם ב-{formatOnboardingVersionDate(selectedAgreement.agreedAt)}
              </p>
              <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">
                {selectedAgreement.agreementText}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedAgreement.signatureUrl}
                alt="חתימת המתאמן"
                className="max-h-32 rounded border border-border"
              />
            </div>
          )}

          {versions && (
            <div className="space-y-3 border-border border-t pt-4">
              <p className="font-medium text-sm">הורדה</p>
              <fieldset className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={downloadQuestionnaire}
                    onChange={(e) => setDownloadQuestionnaire(e.target.checked)}
                  />
                  לכלול שאלון בקובץ
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={downloadAgreement}
                    disabled={!versions.agreements.length}
                    onChange={(e) => setDownloadAgreement(e.target.checked)}
                  />
                  לכלול הסכם וחתימה בקובץ
                </label>
              </fieldset>
              <OnboardingDocumentDownload
                traineeId={traineeId}
                questionnaireId={questionnaireId}
                agreementId={agreementId}
                includeQuestionnaire={downloadQuestionnaire}
                includeAgreement={downloadAgreement}
                disabled={!downloadQuestionnaire && !downloadAgreement}
              />
            </div>
          )}
          </div>
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
      <p className="mt-0.5 break-words whitespace-pre-wrap">{value}</p>
    </div>
  );
}
