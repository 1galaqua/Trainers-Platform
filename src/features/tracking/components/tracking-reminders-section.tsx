"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrackingReminderForm } from "@/features/tracking/components/tracking-reminder-form";
import { TrackingWaterReminderForm } from "@/features/tracking/components/tracking-water-reminder-form";
import {
  cancelBodyWeightReminderAction,
  upsertBodyWeightReminderAction,
} from "@/server/actions/body-weight";
import { cancelSleepReminderAction, upsertSleepReminderAction } from "@/server/actions/sleep";
import { cancelWaterReminderAction, upsertWaterReminderAction } from "@/server/actions/water";
import {
  cancelCaloriesReminderAction,
  cancelMeasurementsReminderAction,
  cancelStepsReminderAction,
  upsertCaloriesReminderAction,
  upsertMeasurementsReminderAction,
  upsertStepsReminderAction,
} from "@/server/actions/tracking-reminders";
import type { TrackingReminderBundle } from "@/server/actions/tracking";

type TrackingRemindersSectionProps = {
  reminders: TrackingReminderBundle;
};

export function TrackingRemindersSection({ reminders }: TrackingRemindersSectionProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">תזכורות</h2>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תזכורת שקילה</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingReminderForm
              reminder={reminders.bodyWeight}
              submitLabel="שמירת תזכורת"
              onSave={upsertBodyWeightReminderAction}
              onCancel={cancelBodyWeightReminderAction}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תזכורת שינה</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingReminderForm
              reminder={reminders.sleep}
              submitLabel="שמירת תזכורת"
              onSave={upsertSleepReminderAction}
              onCancel={cancelSleepReminderAction}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תזכורת שתייה</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingWaterReminderForm
              reminder={reminders.water}
              onSave={upsertWaterReminderAction}
              onCancel={cancelWaterReminderAction}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תזכורת היקפים</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingReminderForm
              reminder={reminders.measurements}
              submitLabel="שמירת תזכורת"
              onSave={upsertMeasurementsReminderAction}
              onCancel={cancelMeasurementsReminderAction}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תזכורת צעדים</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingReminderForm
              reminder={reminders.steps}
              submitLabel="שמירת תזכורת"
              onSave={upsertStepsReminderAction}
              onCancel={cancelStepsReminderAction}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תזכורת קלוריות</CardTitle>
          </CardHeader>
          <CardContent>
            <TrackingReminderForm
              reminder={reminders.calories}
              submitLabel="שמירת תזכורת"
              onSave={upsertCaloriesReminderAction}
              onCancel={cancelCaloriesReminderAction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
