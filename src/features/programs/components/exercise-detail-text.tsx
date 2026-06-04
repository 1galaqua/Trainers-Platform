type ExerciseDetailTextProps = {
  instructions: string | null;
  coachNotes: string | null;
};

export function ExerciseDetailText({ instructions, coachNotes }: ExerciseDetailTextProps) {
  if (!instructions && !coachNotes) return null;

  return (
    <div className="space-y-2 text-sm">
      {instructions && (
        <p>
          <span className="font-medium text-foreground">הסבר לביצוע: </span>
          <span className="text-muted-foreground">{instructions}</span>
        </p>
      )}
      {coachNotes && (
        <p className="rounded-lg bg-muted/50 p-3">
          <span className="font-medium text-foreground">הערות המאמן: </span>
          <span className="text-muted-foreground">{coachNotes}</span>
        </p>
      )}
    </div>
  );
}
