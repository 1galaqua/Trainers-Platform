import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { requireCoach } from "@/lib/auth";
import { isCoachOwnerOfTrainee } from "@/lib/coach-trainee";
import { photoCategoryLabels } from "@/lib/program-labels";
import { prisma } from "@/lib/prisma";
import { getCoachTraineeProgressAction } from "@/server/actions/workouts";
import { getTraineePhotosAction } from "@/server/actions/photos";

export const metadata = {
  title: `מתאמן | ${siteConfig.shortName}`,
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TraineeDetailPage({ params }: PageProps) {
  const coach = await requireCoach();
  const { id } = await params;

  const ownsTrainee = await isCoachOwnerOfTrainee(coach.id, id);
  if (!ownsTrainee) notFound();

  let trainee;
  try {
    trainee = await prisma.user.findUnique({
      where: { id },
      include: { questionnaireResponse: true, agreement: true },
    });
  } catch {
    notFound();
  }

  if (!trainee || trainee.role !== "TRAINEE") notFound();

  const [sessions, photos] = await Promise.all([
    getCoachTraineeProgressAction(id),
    getTraineePhotosAction(id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href="/dashboard/trainees" aria-label="חזרה" />}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">{trainee.displayName ?? "מתאמן"}</h1>
          <p className="mt-1 text-muted-foreground text-sm">היסטוריית אימונים ותמונות התקדמות</p>
        </div>
      </div>

      {trainee.questionnaireResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">שאלון ראשוני</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
            <p>גיל: {trainee.questionnaireResponse.age ?? "—"}</p>
            <p>גובה: {trainee.questionnaireResponse.heightCm ?? "—"} ס״מ</p>
            <p>משקל: {trainee.questionnaireResponse.weightKg ?? "—"} ק״ג</p>
            <p>מטרה: {trainee.questionnaireResponse.goal ?? "—"}</p>
            <p>ניסיון: {trainee.questionnaireResponse.experience ?? "—"}</p>
            <p>פציעות: {trainee.questionnaireResponse.injuries ?? "—"}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="font-medium text-base">אימונים שבוצעו</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">טרם דווחו אימונים</p>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {new Date(session.completedAt).toLocaleDateString("he-IL")} — {session.program.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {session.logs.map((log) => (
                  <p key={log.id}>
                    {log.exercise.name}: {log.weightKg ?? "—"} ק״ג × {log.repsCompleted ?? "—"}
                  </p>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="space-y-4">
        <h2 className="font-medium text-base">תמונות התקדמות</h2>
        {photos.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין תמונות</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {photos.map((photo) => (
              <div key={photo.id} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={photoCategoryLabels[photo.category]}
                  className="aspect-[3/4] w-full rounded-lg border border-border object-cover"
                />
                <p className="text-muted-foreground text-xs">
                  {photoCategoryLabels[photo.category]} ·{" "}
                  {new Date(photo.weekStart).toLocaleDateString("he-IL")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
