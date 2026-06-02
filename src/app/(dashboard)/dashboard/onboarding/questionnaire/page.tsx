import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { QuestionnaireForm } from "@/features/onboarding/components/questionnaire-form";
import { getTraineeOnboardingStatus, requireTrainee } from "@/lib/auth";

export const metadata = {
  title: `שאלון ראשוני | ${siteConfig.shortName}`,
};

export default async function QuestionnairePage() {
  const trainee = await requireTrainee();
  const status = await getTraineeOnboardingStatus(trainee.id);
  if (status.questionnaireComplete) redirect("/dashboard/onboarding/agreement");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">שאלון ראשוני</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          מלא/י פעם אחת כדי שהמאמן/ית יוכל/י להתאים תוכנית
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטים אישיים ומטרות</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionnaireForm />
        </CardContent>
      </Card>
    </div>
  );
}
