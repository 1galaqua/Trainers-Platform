"use server";

import { revalidatePath } from "next/cache";

/**
 * Example Server Action — replace with mutations (create workout, etc.).
 */
export async function refreshDashboardAction() {
  revalidatePath("/dashboard");
}
