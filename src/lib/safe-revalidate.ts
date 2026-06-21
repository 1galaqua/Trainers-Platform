import { revalidatePath } from "next/cache";

export function safeRevalidatePaths(paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // revalidatePath requires a Next.js request context.
    }
  }
}
