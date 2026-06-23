import { getCurrentUser, requireTraineeOnboarded } from "@/lib/auth";
import { getTraineeCoachId, isCoachOwnerOfTrainee } from "@/lib/coach-trainee";

export type TrackingWriteAuth =
  | { error: string }
  | { traineeId: string; coachId: string; role: "COACH" | "TRAINEE" };

export async function authorizeTrackingWrite(traineeId: string): Promise<TrackingWriteAuth> {
  const user = await getCurrentUser();
  if (!user) return { error: "אין הרשאה" };

  if (user.role === "COACH") {
    const ownsTrainee = await isCoachOwnerOfTrainee(user.id, traineeId);
    if (!ownsTrainee) return { error: "מתאמן לא נמצא" };
    return { traineeId, coachId: user.id, role: "COACH" };
  }

  if (user.role === "TRAINEE") {
    const trainee = await requireTraineeOnboarded();
    if (trainee.id !== traineeId) return { error: "אין הרשאה" };
    const coachId = await getTraineeCoachId(trainee.id);
    if (!coachId) return { error: "לא נמצא מאמן מקושר" };
    return { traineeId, coachId, role: "TRAINEE" };
  }

  return { error: "אין הרשאה" };
}
