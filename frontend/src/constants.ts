export const LANGUAGES = ['sv'] as const
export type Language = typeof LANGUAGES[number]

// export const LANGUAGES = ['sv', 'en', 'fa', 'lv', 'pl'] as const
// export type Language = typeof LANGUAGES[number]

export const THEMES = ['default', 'green', 'purple', 'amber', 'red'] as const
export type Theme = typeof THEMES[number]

export const WORK_TYPES = ['painting_walls', 'painting_ceiling', 'electricity', 'vvs'] as const
export type WorkType = typeof WORK_TYPES[number]

export const USER_WORK_TYPES = [...WORK_TYPES, 'project_manager'] as const
export type UserWorkType = typeof USER_WORK_TYPES[number]
