export const LANGUAGES = ['sv', 'en', 'fa', 'lv', 'pl'] as const
export type Language = typeof LANGUAGES[number]

export const THEMES = ['default', 'green', 'purple', 'amber', 'red'] as const
export type Theme = typeof THEMES[number]
