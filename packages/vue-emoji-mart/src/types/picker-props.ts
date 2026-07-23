import type { AugmentedCategory, EmojiData } from './data'

/**
 * Port of `PickerProps.ts`. A prop with a `value` entry is coerced/validated
 * by `getProp`/`getProps` (see `config.ts`); a bare `null` entry is passed
 * through as-is (data/callback props, which have no meaningful default).
 */
export interface PropDefault<T = unknown> {
  value: T
  choices?: readonly T[]
  transform?: (value: unknown) => T
  deprecated?: boolean
}

export interface PickerPropsDefaults {
  autoFocus: PropDefault<boolean>
  dynamicWidth: PropDefault<boolean>
  emojiButtonColors: PropDefault<string[] | null>
  emojiButtonRadius: PropDefault<string>
  emojiButtonSize: PropDefault<number>
  emojiSize: PropDefault<number>
  emojiVersion: PropDefault<number>
  exceptEmojis: PropDefault<string[]>
  icons: PropDefault<'auto' | 'outline' | 'solid'>
  locale: PropDefault<string>
  maxFrequentRows: PropDefault<number>
  navPosition: PropDefault<'top' | 'bottom' | 'none'>
  noCountryFlags: PropDefault<boolean>
  noResultsEmoji: PropDefault<string | null>
  perLine: PropDefault<number>
  previewEmoji: PropDefault<string | null>
  previewPosition: PropDefault<'top' | 'bottom' | 'none'>
  searchPosition: PropDefault<'sticky' | 'static' | 'none'>
  set: PropDefault<'native' | 'apple' | 'facebook' | 'google' | 'twitter'>
  skin: PropDefault<1 | 2 | 3 | 4 | 5 | 6>
  skinTonePosition: PropDefault<'preview' | 'search' | 'none'>
  theme: PropDefault<'auto' | 'light' | 'dark'>

  // Data
  categories: null
  categoryIcons: null
  custom: null
  data: null
  i18n: null

  // Callbacks
  getImageURL: null
  getSpritesheetURL: null
  onAddCustomEmoji: null
  onClickOutside: null
  onEmojiSelect: null

  // Deprecated
  stickySearch: PropDefault<boolean>
}

const PickerProps: PickerPropsDefaults = {
  autoFocus: {
    value: false,
  },
  dynamicWidth: {
    value: false,
  },
  emojiButtonColors: {
    value: null,
  },
  emojiButtonRadius: {
    value: '100%',
  },
  emojiButtonSize: {
    value: 36,
  },
  emojiSize: {
    value: 24,
  },
  emojiVersion: {
    value: 15,
    choices: [1, 2, 3, 4, 5, 11, 12, 12.1, 13, 13.1, 14, 15],
  },
  exceptEmojis: {
    value: [],
  },
  icons: {
    value: 'auto',
    choices: ['auto', 'outline', 'solid'],
  },
  locale: {
    value: 'en',
    choices: [
      'en',
      'ar',
      'be',
      'cs',
      'de',
      'es',
      'fa',
      'fi',
      'fr',
      'hi',
      'it',
      'ja',
      'ko',
      'nl',
      'pl',
      'pt',
      'ru',
      'sa',
      'tr',
      'uk',
      'vi',
      'zh',
    ],
  },
  maxFrequentRows: {
    value: 4,
  },
  navPosition: {
    value: 'top',
    choices: ['top', 'bottom', 'none'],
  },
  noCountryFlags: {
    value: false,
  },
  noResultsEmoji: {
    value: null,
  },
  perLine: {
    value: 9,
  },
  previewEmoji: {
    value: null,
  },
  previewPosition: {
    value: 'bottom',
    choices: ['top', 'bottom', 'none'],
  },
  searchPosition: {
    value: 'sticky',
    choices: ['sticky', 'static', 'none'],
  },
  set: {
    value: 'native',
    choices: ['native', 'apple', 'facebook', 'google', 'twitter'],
  },
  skin: {
    value: 1,
    choices: [1, 2, 3, 4, 5, 6],
  },
  skinTonePosition: {
    value: 'preview',
    choices: ['preview', 'search', 'none'],
  },
  theme: {
    value: 'auto',
    choices: ['auto', 'light', 'dark'],
  },

  // Data
  categories: null,
  categoryIcons: null,
  custom: null,
  data: null,
  i18n: null,

  // Callbacks
  getImageURL: null,
  getSpritesheetURL: null,
  onAddCustomEmoji: null,
  onClickOutside: null,
  onEmojiSelect: null,

  // Deprecated
  stickySearch: {
    deprecated: true,
    value: true,
  },
}

export default PickerProps

/**
 * Public runtime prop values accepted by `<Picker>` (component-facing type,
 * used by the Picker.vue `defineProps` in the components wave).
 */
export interface PickerProps {
  autoFocus?: boolean
  dynamicWidth?: boolean
  emojiButtonColors?: string[]
  emojiButtonRadius?: string | number
  emojiButtonSize?: number
  emojiSize?: number
  emojiVersion?: number
  exceptEmojis?: string[]
  icons?: 'auto' | 'outline' | 'solid'
  locale?: string
  maxFrequentRows?: number
  navPosition?: 'top' | 'bottom' | 'none'
  noCountryFlags?: boolean
  noResultsEmoji?: string
  perLine?: number
  previewEmoji?: string
  previewPosition?: 'top' | 'bottom' | 'none'
  searchPosition?: 'sticky' | 'static' | 'none'
  set?: 'native' | 'apple' | 'facebook' | 'google' | 'twitter'
  skin?: 1 | 2 | 3 | 4 | 5 | 6
  skinTonePosition?: 'preview' | 'search' | 'none'
  theme?: 'auto' | 'light' | 'dark'

  categories?: string[]
  categoryIcons?: Record<string, unknown>
  custom?: AugmentedCategory[]
  data?: unknown | (() => Promise<unknown>)
  i18n?: unknown | (() => Promise<unknown>)

  getImageURL?: (set: string, unified: string) => string
  getSpritesheetURL?: (set: string) => string
  onAddCustomEmoji?: (event: Event) => void
  onClickOutside?: (event: Event) => void
  onEmojiSelect?: (emoji: EmojiData, event: Event) => void

  /** @deprecated use `searchPosition` instead. */
  stickySearch?: boolean
}
