"use client";

import { ProgramForm } from "@/features/programs/components/program-form";

type Trainee = { id: string; displayName: string | null };

export function CreateProgramForm({ trainees }: { trainees: Trainee[] }) {
  return <ProgramForm mode="create" trainees={trainees} />;
}
