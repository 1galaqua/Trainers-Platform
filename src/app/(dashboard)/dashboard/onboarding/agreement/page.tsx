import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { AgreementForm } from "@/features/onboarding/components/agreement-form";
import { getTraineeOnboardingStatus, requireTrainee } from "@/lib/auth";
import { getTraineeOnboardingTemplateAction } from "@/server/actions/coach-onboarding";

export const metadata = {
  title: `הסכם וחתימה | ${siteConfig.shortName}`,
};

export default async function AgreementPage() {
  const trainee = await requireTrainee();
  const status = await getTraineeOnboardingStatus(trainee.id);
  if (!status.questionnaireComplete) redirect("/dashboard/onboarding/questionnaire");
  if (status.agreementComplete) redirect("/dashboard/my-program");

  const template = await getTraineeOnboardingTemplateAction();
  const isRedo = status.agreementRedoPending;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">
          {isRedo ? "חתימת הסכם מחדש" : "הסכם וחתימה"}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          {isRedo
            ? "המאמן/ית ביקש/ה שתחתום/י על ההסכם מחדש. קרא/י וחתום/י דיגיטלית."
            : "קרא/י את ההסכם וחתום/י דיגיטלית"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">הסכם שירותי אימון</CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementForm content={template.agreementText} isRedo={isRedo} />
        </CardContent>
      </Card>
    </div>
  );
}
