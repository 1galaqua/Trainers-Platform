type WorkoutReminderDeliveryInput = {
  workoutCancelledAt: Date | null | undefined;
  scheduledFor: Date;
  now: Date;
};

export function shouldDeliverWorkoutReminder(input: WorkoutReminderDeliveryInput) {
  if (input.workoutCancelledAt != null) {
    return { deliver: false as const, reason: "cancelled" as const };
  }

  if (input.scheduledFor > input.now) {
    return { deliver: false as const, reason: "not-due" as const };
  }

  return { deliver: true as const };
}
