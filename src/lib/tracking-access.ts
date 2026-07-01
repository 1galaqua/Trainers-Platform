import { cache } from "react";

import { getCurrentUser } from "@/lib/auth";
import { getTraineeCoachId, isCoachOwnerOfTrainee } from "@/lib/coach-trainee";

export type TrackingWriteAuth =
  | { error: string }
  | { traineeId: string; coachId: string; role: "COACH" | "TRAINEE" };

const cachedCoachOwnsTrainee = cache(async (coachId: string, traineeId: string) =>
  isCoachOwnerOfTrainee(coachId, traineeId),
);

const cachedTraineeCoachId = cache(async (traineeId: string) => getTraineeCoachId(traineeId));

export async function authorizeTrackingWrite(traineeId: string): Promise<TrackingWriteAuth> {
  const user = await getCurrentUser();
  if (!user) return { error: "אין הרשאה" };

  if (user.role === "COACH") {
    const ownsTrainee = await cachedCoachOwnsTrainee(user.id, traineeId);
    if (!ownsTrainee) return { error: "מתאמן לא נמצא" };
    return { traineeId, coachId: user.id, role: "COACH" };
  }

  if (user.role === "TRAINEE") {
    if (user.id !== traineeId) return { error: "אין הרשאה" };
    const coachId = await cachedTraineeCoachId(user.id);
    if (!coachId) return { error: "לא נמצא מאמן מקושר" };
    return { traineeId, coachId, role: "TRAINEE" };
  }

  return { error: "אין הרשאה" };
}
