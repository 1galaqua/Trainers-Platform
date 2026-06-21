import { redirect } from "next/navigation";

import { requireTraineeOnboarded } from "@/lib/auth";

export default async function ProgressPage() {
  await requireTraineeOnboarded();
  redirect("/dashboard");
}
