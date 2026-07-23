import type { Category, Emoji, EmojiMartData, Skin } from '@vue-emoji-mart/data'

export type { Category, Emoji, EmojiMartData, Skin }

/**
 * `Emoji`/`Skin` augmented with fields that `config.ts`'s `init()` mutates
 * onto the raw data at runtime (search index, aliases, shortcodes...).
 * Port note: the original is `@ts-nocheck`d for this exact reason — these
 * fields don't exist on `@vue-emoji-mart/data`'s static types, they are
 * computed once during `init()` and cached on the objects themselves.
 */
export interface AugmentedSkin extends Skin {
  shortcodes?: string
  src?: string
}

export interface AugmentedEmoji extends Omit<Emoji, 'skins'> {
  skins: AugmentedSkin[]
  aliases?: string[]
  search?: string
}

export interface AugmentedEmojiMartData extends Omit<EmojiMartData, 'categories' | 'emojis'> {
  categories: AugmentedCategory[]
  originalCategories?: AugmentedCategory[]
  emojis: { [id: string]: AugmentedEmoji }
  emoticons: { [emoticon: string]: string }
  natives: { [native: string]: string }
}

export interface AugmentedCategory extends Omit<Category, 'emojis'> {
  name?: string
  icon?: string
  target?: AugmentedCategory
  emojis: (string | AugmentedEmoji)[]
}

/** Resolved emoji data, as returned by `getEmojiData`/`onEmojiSelect`. */
export interface EmojiData {
  id: string
  name: string
  native?: string
  unified: string
  keywords: string[]
  shortcodes?: string
  skin?: number
  src?: string
  aliases?: string[]
  emoticons?: string[]
}

/** Loaded i18n strings shape (see `@vue-emoji-mart/data/i18n/*.json`). */
export interface I18nData {
  search: string
  search_no_results_1: string
  search_no_results_2: string
  pick: string
  add_custom: string
  categories: Record<string, string>
  skins: Record<string | number, string>
  rtl?: boolean
  [key: string]: unknown
}
