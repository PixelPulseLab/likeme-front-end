export const HOME_SUMMARY_COMMUNITIES_PAGE_SIZE = 20;

/** Alinhar com `AUTH_SESSION_HOME_SUMMARY` no back-end (`authSessionHomeSummary.ts`). */
export const HOME_SUMMARY_COMMUNITIES_LIST_PARAMS = {
  sortBy: 'createdAt',
  includeDeleted: false,
} as const;

/** Alinhar com `AUTH_SESSION_HOME_SUMMARY` no back-end (`authSessionHomeSummary.ts`). */
export const HOME_SUMMARY_SUGGESTED_PROGRAMS_QUERY = {
  limit: 4,
  status: 'active' as const,
  type: 'program',
};
