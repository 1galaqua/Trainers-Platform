import { redirect } from "next/navigation";

import { siteConfig } from "@/config/site";
import { UpdatesPageContent } from "@/features/updates/components/updates-page-content";
import { requireTraineeOnboarded, requireUser } from "@/lib/auth";
import { getUserNotificationsAction } from "@/server/actions/notifications";

export const metadata = {
  title: `עדכונים | ${siteConfig.shortName}`,
};

export const dynamic = "force-dynamic";

export default async function UpdatesPage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/dashboard");
  }

  if (user.role === "TRAINEE") {
    await requireTraineeOnboarded();
  }

  const notifications = await getUserNotificationsAction();

  return <UpdatesPageContent notifications={notifications} />;
}
