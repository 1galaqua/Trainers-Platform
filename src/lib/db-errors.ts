export function isDbConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Server selection timeout") ||
    message.includes("fatal alert") ||
    message.includes("SSL routines") ||
    message.includes("querySrv") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND")
  );
}
