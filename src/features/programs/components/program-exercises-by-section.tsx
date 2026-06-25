import { ExternalLink } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseDetailText } from "@/features/programs/components/exercise-detail-text";
import {
  buildProgramSectionDisplay,
  type ProgramExerciseRecord,
  type ProgramSectionRecord,
} from "@/lib/program-sections";

export type ProgramExerciseView = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  instructions: string | null;
  coachNotes: string | null;
  youtubeUrl: string | null;
};

type ProgramExercisesBySectionProps = {
  sections: ProgramSectionRecord[];
  exercises: ProgramExerciseRecord[];
  className?: string;
};

export function ProgramExercisesBySection({
  sections,
  exercises,
  className,
}: ProgramExercisesBySectionProps) {
  const displaySections = buildProgramSectionDisplay(sections, exercises);

  return (
    <div className={className}>
      {displaySections.map((section) => (
        <div key={section.id} className="space-y-4">
          <h3 className="font-medium text-base">{section.name}</h3>
          {section.exercises.map((exercise, index) => (
            <Card key={exercise.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {index + 1}. {exercise.name}
                </CardTitle>
                <CardDescription>
                  {exercise.sets} סטים × {exercise.reps} חזרות · מנוחה {exercise.restSeconds} שנ׳
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <ExerciseDetailText
                  instructions={exercise.instructions}
                  coachNotes={exercise.coachNotes}
                />
                {exercise.youtubeUrl && (
                  <a
                    href={exercise.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    צפייה בסרטון{section.id === "legacy" ? " YouTube" : ""}
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}
