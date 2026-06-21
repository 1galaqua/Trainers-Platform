const AUTH_ENTRY_PREFIXES = ["/sign-in", "/sign-up"] as const;

export function isAuthEntryPath(pathname: string) {
  return AUTH_ENTRY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function getSafeRedirectPath(redirect: string | null | undefined) {
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/dashboard";
  }
  if (isAuthEntryPath(redirect)) {
    return "/dashboard";
  }
  return redirect;
}
