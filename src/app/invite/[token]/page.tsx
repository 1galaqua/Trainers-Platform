import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { TraineeInviteOnboardingForm } from "@/features/invites/components/trainee-invite-onboarding-form";
import { getInvitePageData } from "@/server/actions/invites";

export const metadata: Metadata = {
  title: "הצטרפות למערכת",
};

const INVALID_MESSAGES = {
  not_found: "קישור ההזמנה לא נמצא או אינו תקף.",
  used: "קישור ההזמנה כבר נוצל.",
  expired: "קישור ההזמנה פג תוקף.",
} as const;

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const data = await getInvitePageData(token);

  if (!data.valid) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-4 text-center">
          <h1 className="font-semibold text-xl">קישור לא תקף</h1>
          <p className="text-muted-foreground text-sm">{INVALID_MESSAGES[data.reason]}</p>
          <p className="text-muted-foreground text-sm">
            בקש/י מהמאמן/ית לשלוח קישור הזמנה חדש.
          </p>
          {data.reason !== "used" && (
            <Button render={<Link href="/sign-in" />} variant="outline">
              התחברות
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto mb-8 max-w-lg space-y-2 text-center">
        <p className="text-muted-foreground text-xs">{siteConfig.name}</p>
        <h1 className="font-semibold text-2xl tracking-tight">ברוכים הבאים</h1>
        <p className="text-muted-foreground text-sm">
          הצטרפות למאמן/ית <strong>{data.coachName}</strong> — מלא/י את הפרטים, השאלון וההסכם
          ליצירת החשבון.
        </p>
      </div>

      <TraineeInviteOnboardingForm
        token={data.token}
        coachName={data.coachName}
        questionnaireFields={data.questionnaireFields}
        agreementText={data.agreementText}
      />
    </div>
  );
}
