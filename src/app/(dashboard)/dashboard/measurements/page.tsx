import { MeasurementsPageContent } from "@/features/measurements/components/measurements-page-content";
import { siteConfig } from "@/config/site";
import { requireTraineeOnboarded } from "@/lib/auth";
import { getTraineeMeasurementsPageDataAction } from "@/server/actions/measurements";

export const metadata = {
  title: `היקפים | ${siteConfig.shortName}`,
};

export default async function TraineeMeasurementsPage() {
  const trainee = await requireTraineeOnboarded();
  const data = await getTraineeMeasurementsPageDataAction();

  return <MeasurementsPageContent traineeId={trainee.id} data={data} />;
}
