import { Card, CardContent } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { TraineeCard } from "@/features/trainees/components/trainee-card";
import { requireCoach } from "@/lib/auth";
import { getCoachTraineeListAction } from "@/server/actions/trainees";

export const metadata = {
  title: `מתאמנים | ${siteConfig.shortName}`,
};

export default async function TraineesPage() {
  await requireCoach();
  const trainees = await getCoachTraineeListAction();

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
        <div className="grid gap-4">
          {trainees.map((trainee) => (
            <TraineeCard key={trainee.id} trainee={trainee} />
          ))}
        </div>
      )}
    </div>
  );
}
