import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { AgreementForm } from "@/features/onboarding/components/agreement-form";
import { getTraineeOnboardingStatus, requireTrainee } from "@/lib/auth";
import { agreementContent } from "@/lib/program-labels";

export const metadata = {
  title: `הסכם מתאמן | ${siteConfig.shortName}`,
};

export default async function AgreementPage() {
  const trainee = await requireTrainee();
  const status = await getTraineeOnboardingStatus(trainee.id);

  if (!status.questionnaireComplete) redirect("/dashboard/onboarding/questionnaire");
  if (status.agreementComplete) redirect("/dashboard/my-program");

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">הסכם מתאמן</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          קרא/י את ההסכם, סמן/י אישור וחתום/י דיגיטלית
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">הסכם שירות</CardTitle>
        </CardHeader>
        <CardContent>
          <AgreementForm content={agreementContent} />
        </CardContent>
      </Card>
    </div>
  );
}
