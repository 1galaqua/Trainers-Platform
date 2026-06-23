import { SleepPageContent } from "@/features/sleep/components/sleep-page-content";
import { siteConfig } from "@/config/site";
import { getSleepPageDataAction } from "@/server/actions/sleep";

export const metadata = {
  title: `שינה | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ log?: string }>;
};

export default async function SleepPage({ searchParams }: PageProps) {
  const { log } = await searchParams;
  const data = await getSleepPageDataAction();

  return <SleepPageContent data={data} openLogForm={log === "1"} />;
}
