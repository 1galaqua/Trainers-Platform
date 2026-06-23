import { WaterPageContent } from "@/features/water/components/water-page-content";
import { siteConfig } from "@/config/site";
import { getWaterPageDataAction } from "@/server/actions/water";

export const metadata = {
  title: `שתייה | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ log?: string }>;
};

export default async function WaterPage({ searchParams }: PageProps) {
  const { log } = await searchParams;
  const data = await getWaterPageDataAction();

  return <WaterPageContent data={data} openLogForm={log === "1"} />;
}
