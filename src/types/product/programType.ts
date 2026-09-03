export const PROGRAM_TYPE = {
  COURSE: 'course',
  COMMUNITY: 'community',
} as const;

export type ProgramType = (typeof PROGRAM_TYPE)[keyof typeof PROGRAM_TYPE];

export const PROGRAM_TYPE_VALUES: readonly ProgramType[] = [PROGRAM_TYPE.COURSE, PROGRAM_TYPE.COMMUNITY];
