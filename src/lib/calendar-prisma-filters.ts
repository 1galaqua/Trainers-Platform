/**
 * MongoDB + Prisma: optional DateTime fields omitted at insert are not matched by
 * `{ field: null }`, only by `{ field: { isSet: false } }`.
 */
export const notCancelledWhere = {
  OR: [{ cancelledAt: null }, { cancelledAt: { isSet: false } }],
};

/** MongoDB + Prisma: unset optional DateTime fields are not matched by `{ sentAt: null }`. */
export const jobNotSentWhere = {
  OR: [{ sentAt: null }, { sentAt: { isSet: false } }],
};
