import { BodyWeightPageContent } from "@/features/body-weight/components/body-weight-page-content";
import { siteConfig } from "@/config/site";
import { getBodyWeightPageDataAction } from "@/server/actions/body-weight";

export const metadata = {
  title: `משקל גוף | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ log?: string }>;
};

export default async function BodyWeightPage({ searchParams }: PageProps) {
  const { log } = await searchParams;
  const data = await getBodyWeightPageDataAction();

  return <BodyWeightPageContent data={data} openLogForm={log === "1"} />;
}
