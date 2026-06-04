import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CoachOnboardingTemplateForm } from "@/features/onboarding/components/coach-onboarding-template-form";
import { requireCoach } from "@/lib/auth";
import { getCoachOnboardingTemplateAction } from "@/server/actions/coach-onboarding";

export const metadata = {
  title: `תבנית שאלון והסכם | ${siteConfig.shortName}`,
};

export default async function OnboardingTemplatePage() {
  await requireCoach();
  const template = await getCoachOnboardingTemplateAction();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">שאלון והסכם</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          ברירת המחדל היא השאלון הקיים. ניתן לערוך ניסוח שאלות וטקסט ההסכם עם החתימה.
          מתאמנים חדשים יראו את הגרסה המעודכנת.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">עריכת תבנית</CardTitle>
        </CardHeader>
        <CardContent>
          <CoachOnboardingTemplateForm
            initialFields={template.questionnaireFields}
            initialAgreementText={template.agreementText}
          />
        </CardContent>
      </Card>
    </div>
  );
}
