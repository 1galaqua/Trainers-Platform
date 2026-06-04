import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { TraineesList } from "@/features/trainees/components/trainees-list";
import { requireCoach } from "@/lib/auth";
import { getCoachOnboardingTemplateAction } from "@/server/actions/coach-onboarding";
import { getCoachTraineeListAction } from "@/server/actions/trainees";

export const metadata = {
  title: `מתאמנים | ${siteConfig.shortName}`,
};

export default async function TraineesPage() {
  await requireCoach();
  const [trainees, template] = await Promise.all([
    getCoachTraineeListAction(),
    getCoachOnboardingTemplateAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl tracking-tight">מתאמנים</h1>
        <p className="mt-1 text-muted-foreground text-sm">מעקב אחר מתאמנים, תוכניות והתקדמות</p>
      </div>

      {trainees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין מתאמנים משויכים אליך. מתאמנים נרשמים ובוחרים אותך כמאמן/ית — ואז יופיעו כאן.
          </CardContent>
        </Card>
      ) : (
        <TraineesList trainees={trainees} questionnaireFields={template.questionnaireFields} />
      )}
    </div>
  );
}
