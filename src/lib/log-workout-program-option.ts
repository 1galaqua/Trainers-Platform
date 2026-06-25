import { buildLogWorkoutSections } from "@/lib/program-sections";
import type { ProgramExerciseRecord, ProgramSectionRecord } from "@/lib/program-sections";
import type { ProgramType } from "@/lib/prisma-client";

type ProgramForLogOption = {
  id: string;
  name: string;
  type: ProgramType;
  coach: { displayName: string | null };
  sections: Array<{
    id: string;
    name: string;
    sortOrder: number;
    exercises: Array<{
      id: string;
      name: string;
      sets: number;
      reps: number;
      restSeconds: number;
      coachNotes?: string | null;
      youtubeUrl?: string | null;
      instructions?: string | null;
      sortOrder: number;
      sectionId?: string | null;
    }>;
  }>;
  exercises: Array<{
    id: string;
    name: string;
    sets: number;
    reps: number;
    restSeconds: number;
    sortOrder: number;
    sectionId?: string | null;
  }>;
};

function toExerciseRecord(
  exercise: ProgramForLogOption["exercises"][number],
): ProgramExerciseRecord {
  return {
    id: exercise.id,
    name: exercise.name,
    sets: exercise.sets,
    reps: exercise.reps,
    restSeconds: exercise.restSeconds,
    coachNotes: null,
    youtubeUrl: null,
    instructions: null,
    sortOrder: exercise.sortOrder,
    sectionId: exercise.sectionId ?? null,
  };
}

export function buildLogWorkoutProgramOption(program: ProgramForLogOption) {
  const sectionRecords: ProgramSectionRecord[] = program.sections.map((section) => ({
    id: section.id,
    name: section.name,
    sortOrder: section.sortOrder,
    exercises: section.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds,
      coachNotes: exercise.coachNotes ?? null,
      youtubeUrl: exercise.youtubeUrl ?? null,
      instructions: exercise.instructions ?? null,
      sortOrder: exercise.sortOrder,
      sectionId: exercise.sectionId ?? section.id,
    })),
  }));

  const exerciseRecords = program.exercises.map(toExerciseRecord);

  return {
    id: program.id,
    name: program.name,
    type: program.type,
    exerciseCount: program.exercises.length,
    coachName: program.coach.displayName,
    exercises: program.exercises.map(({ id, name, sets, reps, restSeconds }) => ({
      id,
      name,
      sets,
      reps,
      restSeconds,
    })),
    sections: buildLogWorkoutSections(sectionRecords, exerciseRecords),
  };
}
