/**
 * MongoDB + Prisma: optional DateTime fields omitted at insert are not matched by
 * `{ field: null }`, only by `{ field: { isSet: false } }`.
 */
export const notReadWhere = {
  OR: [{ readAt: null }, { readAt: { isSet: false } }],
};

export function isNotificationUnread(readAt: Date | string | null | undefined): boolean {
  return readAt == null;
}
