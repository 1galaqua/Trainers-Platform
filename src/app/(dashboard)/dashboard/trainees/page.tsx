import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { CreateTraineeInviteButton } from "@/features/invites/components/create-trainee-invite-button";
import { TraineesList } from "@/features/trainees/components/trainees-list";
import { requireCoach } from "@/lib/auth";
import { parseTraineeFilter } from "@/lib/trainee-status";
import { getCoachOnboardingTemplateAction } from "@/server/actions/coach-onboarding";
import { getCoachTraineeListAction } from "@/server/actions/trainees";

export const metadata = {
  title: `מתאמנים | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function TraineesPage({ searchParams }: PageProps) {
  await requireCoach();
  const { filter: filterParam } = await searchParams;
  const initialFilter = parseTraineeFilter(filterParam);
  const [trainees, template] = await Promise.all([
    getCoachTraineeListAction(),
    getCoachOnboardingTemplateAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">מתאמנים</h1>
          <p className="mt-1 text-muted-foreground text-sm">מעקב אחר מתאמנים, תוכניות והתקדמות</p>
        </div>
        <CreateTraineeInviteButton />
      </div>

      {trainees.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            אין מתאמנים משויכים אליך. לחץ/י על &quot;צור מתאמן חדש&quot; כדי ליצור קישור הזמנה
            ולשלוח אותו למתאמן/ית.
          </CardContent>
        </Card>
      ) : (
        <TraineesList
          trainees={trainees}
          questionnaireFields={template.questionnaireFields}
          initialFilter={initialFilter}
        />
      )}
    </div>
  );
}
