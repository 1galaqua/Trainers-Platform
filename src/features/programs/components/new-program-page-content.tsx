"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramForm } from "@/features/programs/components/program-form";

type Trainee = { id: string; displayName: string | null };

type NewProgramPageContentProps = {
  trainees: Trainee[];
  initialTraineeId?: string;
};

function getBackHref(selectedTraineeId: string) {
  return selectedTraineeId
    ? `/dashboard/trainees/${selectedTraineeId}`
    : "/dashboard/workouts";
}

export function NewProgramPageContent({ trainees, initialTraineeId }: NewProgramPageContentProps) {
  const defaultTraineeId =
    initialTraineeId && trainees.some((trainee) => trainee.id === initialTraineeId)
      ? initialTraineeId
      : "";

  const [selectedTraineeId, setSelectedTraineeId] = useState(defaultTraineeId);
  const backHref = getBackHref(selectedTraineeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" render={<Link href={backHref} aria-label="חזרה" />}>
          <ArrowRight className="size-4" />
        </Button>
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">תוכנית אימון חדשה</h1>
          <p className="mt-1 text-muted-foreground text-base">הגדר תרגילים, סטים, חזרות וסרטוני YouTube</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי התוכנית</CardTitle>
        </CardHeader>
        <CardContent>
          {trainees.length === 0 ? (
            <p className="text-muted-foreground text-base leading-relaxed">
              אין לך מתאמנים משויכים. מתאמנים נרשמים ובוחרים אותך כמאמן/ית — אז יופיעו כאן.
            </p>
          ) : (
            <ProgramForm
              mode="create"
              trainees={trainees}
              initialTraineeId={defaultTraineeId || undefined}
              selectedTraineeId={selectedTraineeId}
              onTraineeIdChange={setSelectedTraineeId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
