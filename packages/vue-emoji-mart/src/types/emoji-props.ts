import PickerProps, { type PropDefault } from './picker-props'

/** Port of `EmojiProps.ts`. Used both by `getProps` and by `Emoji.vue`'s `defineProps`. */
export interface EmojiPropsDefaults {
  fallback: PropDefault<string>
  id: PropDefault<string>
  native: PropDefault<string>
  shortcodes: PropDefault<string>
  size: PropDefault<string | number>

  // Shared
  set: PropDefault<string>
  skin: PropDefault<number>
}

const EmojiProps: EmojiPropsDefaults = {
  fallback: {
    value: '',
  },
  id: {
    value: '',
  },
  native: {
    value: '',
  },
  shortcodes: {
    value: '',
  },
  size: {
    value: '',
    transform: (value: unknown): string | number => {
      // If the value is a number, then we assume it's a pixel value.
      if (!/\D/.test(String(value))) {
        return `${value}px`
      }

      return value as string | number
    },
  },

  // Shared
  set: PickerProps.set,
  skin: PickerProps.skin,
}

export default EmojiProps

export interface EmojiProps {
  fallback?: string
  id?: string
  native?: string
  shortcodes?: string
  size?: string | number
  emoji?: unknown
  spritesheet?: boolean
  set?: 'native' | 'apple' | 'facebook' | 'google' | 'twitter'
  skin?: 1 | 2 | 3 | 4 | 5 | 6
  getImageURL?: (set: string, unified: string) => string
  getSpritesheetURL?: (set: string) => string
}
