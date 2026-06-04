import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { DynamicQuestionnaireForm } from "@/features/onboarding/components/dynamic-questionnaire-form";
import { getTraineeOnboardingStatus, requireTrainee } from "@/lib/auth";
import { getTraineeOnboardingTemplateAction } from "@/server/actions/coach-onboarding";

export const metadata = {
  title: `שאלון ראשוני | ${siteConfig.shortName}`,
};

export default async function QuestionnairePage() {
  const trainee = await requireTrainee();
  const status = await getTraineeOnboardingStatus(trainee.id);
  if (status.questionnaireComplete) {
    redirect(
      status.agreementComplete ? "/dashboard/my-program" : "/dashboard/onboarding/agreement",
    );
  }

  const template = await getTraineeOnboardingTemplateAction();
  const isRedo = status.questionnaireRedoPending;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          {isRedo ? "עדכון שאלון" : "שאלון ראשוני"}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {isRedo
            ? "המאמן/ית ביקש/ה שתמלא/י את השאלון מחדש. עדכן/י את התשובות ושמור/י."
            : "מלא/י פעם אחת כדי שהמאמן/ית יוכל/י להתאים תוכנית"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטים אישיים ומטרות</CardTitle>
        </CardHeader>
        <CardContent>
          <DynamicQuestionnaireForm fields={template.questionnaireFields} isRedo={isRedo} />
        </CardContent>
      </Card>
    </div>
  );
}
