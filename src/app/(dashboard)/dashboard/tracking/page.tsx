import { Suspense } from "react";

import { TrackingHubPageContent } from "@/features/tracking/components/tracking-hub-page-content";
import { siteConfig } from "@/config/site";
import { getTrackingHubDataAction } from "@/server/actions/tracking";

export const metadata = {
  title: `מעקב | ${siteConfig.shortName}`,
};

type PageProps = {
  searchParams: Promise<{ traineeId?: string; week?: string }>;
};

export default async function TrackingPage({ searchParams }: PageProps) {
  const { traineeId, week } = await searchParams;
  const data = await getTrackingHubDataAction(traineeId, week);

  return (
    <Suspense fallback={null}>
      <TrackingHubPageContent data={data} />
    </Suspense>
  );
}
