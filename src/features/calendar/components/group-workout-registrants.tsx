import type { CalendarRegisteredTrainee } from "@/server/actions/calendar";

type GroupWorkoutRegistrantsProps = {
  registrants: CalendarRegisteredTrainee[];
  compact?: boolean;
};

export function GroupWorkoutRegistrants({
  registrants,
  compact = false,
}: GroupWorkoutRegistrantsProps) {
  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <p className={compact ? "font-medium text-[11px]" : "font-medium text-xs"}>
        נרשמו ({registrants.length})
      </p>
      {registrants.length === 0 ? (
        <p className={compact ? "mt-1 text-muted-foreground text-[11px]" : "mt-1 text-muted-foreground text-xs"}>
          עדיין אין נרשמים
        </p>
      ) : (
        <ul
          className={
            compact
              ? "mt-1 space-y-0.5 text-muted-foreground text-[11px]"
              : "mt-1 space-y-1 text-muted-foreground text-xs"
          }
        >
          {registrants.map((registrant) => (
            <li key={registrant.id}>{registrant.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
