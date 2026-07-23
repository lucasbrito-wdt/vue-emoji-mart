import { shallowRef, triggerRef } from 'vue'

import i18n_en from '@luquinhasbrito/emoji-mart-data/i18n/en.json'

import PickerProps from './types/picker-props'
import { FrequentlyUsed, NativeSupport, SafeFlags, SearchIndex } from './helpers'

import type { PropDefault } from './types/picker-props'
import type { AugmentedEmojiMartData, I18nData } from './types/data'

/**
 * Port note (deviation from original): the original keeps `Data`/`I18n` as
 * plain `let` module-level variables so populating them never triggers a
 * Preact re-render by itself — only `Picker`'s own `setState` decides when to
 * re-render (see Performance decisions in the port plan). Here they are
 * `shallowRef`s instead of plain `ref`/`reactive`: this avoids Vue wrapping
 * thousands of emoji objects in a deep reactive proxy (which `reactive()`
 * would do), while still letting consumers/composables react via `computed`.
 *
 * `_init()` mutates the underlying object in place (same as the original,
 * for the same perf reasons) and calls `triggerRef()` once at the end to
 * notify subscribers — reassigning `.value` to the same object reference
 * would NOT trigger by itself under `shallowRef`'s `Object.is` check.
 *
 * Access is `Data.value`/`I18n.value` instead of the original's direct
 * `Data`/`I18n` property access — this is the one public-API divergence
 * required to gain Vue reactivity without deep-proxy cost.
 */
export const Data = shallowRef<AugmentedEmojiMartData | null>(null)
export const I18n = shallowRef<I18nData | null>(null)

const fetchCache: Record<string, unknown> = {}
async function fetchJSON<T = unknown>(src: string): Promise<T> {
  if (fetchCache[src]) {
    return fetchCache[src] as T
  }

  const response = await fetch(src)
  const json = await response.json()

  fetchCache[src] = json
  return json
}

export interface InitOptions {
  data?: unknown | (() => Promise<unknown>)
  i18n?: unknown | (() => Promise<unknown>)
  emojiVersion?: number
  set?: string
  locale?: string
  categories?: string[]
  categoryIcons?: Record<string, unknown>
  custom?: AugmentedEmojiMartData['categories']
  exceptEmojis?: string[]
  maxFrequentRows?: number
  perLine?: number
  noCountryFlags?: boolean
  [key: string]: unknown
}

let promise: Promise<void> | null = null
let initiated = false
let initCallback: (() => void) | null = null
let initialized = false

/**
 * `init()` is a singleton, backed by module-level state (`promise`,
 * `initiated`, `initCallback`, `initialized`), matching the original's
 * intentional design: multiple `<Picker>`s on the same page share one
 * `Data`/`I18n` fetch instead of each paying the cost independently. Do not
 * refactor this into per-instance state.
 */
export function init(
  options: InitOptions | null,
  { caller }: { caller?: string } = {},
): Promise<void> {
  promise ||
    (promise = new Promise((resolve) => {
      initCallback = resolve
    }))

  if (options) {
    _init(options)
  } else if (caller && !initialized) {
    console.warn(
      `\`${caller}\` requires data to be initialized first. Promise will be pending until \`init\` is called.`,
    )
  }

  return promise
}

async function _init(props: InitOptions): Promise<void> {
  initialized = true
  initiated = true

  let { emojiVersion, set, locale } = props
  emojiVersion || (emojiVersion = (PickerProps.emojiVersion as PropDefault<number>).value)
  set || (set = (PickerProps.set as PropDefault<string>).value)
  locale || (locale = (PickerProps.locale as PropDefault<string>).value)

  let data = Data.value

  if (!data) {
    data =
      ((typeof props.data === 'function'
        ? await (props.data as () => Promise<AugmentedEmojiMartData>)()
        : (props.data as AugmentedEmojiMartData)) ||
        (await fetchJSON<AugmentedEmojiMartData>(
          `https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/${emojiVersion}/${set}.json`,
        )))

    data.emoticons = {}
    data.natives = {}

    data.categories.unshift({
      id: 'frequent',
      emojis: [],
    })

    for (const alias in data.aliases) {
      const emojiId = data.aliases[alias]
      const emoji = data.emojis[emojiId]
      if (!emoji) continue

      emoji.aliases || (emoji.aliases = [])
      emoji.aliases.push(alias)
    }

    data.originalCategories = data.categories
  } else {
    data.categories = data.categories.filter((c) => {
      const isCustom = !!c.name
      if (!isCustom) return true

      return false
    })
  }

  const i18n =
    (typeof props.i18n === 'function'
      ? await (props.i18n as () => Promise<I18nData>)()
      : (props.i18n as I18nData)) ||
    (locale == 'en'
      ? (i18n_en as unknown as I18nData)
      : await fetchJSON<I18nData>(
          `https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/i18n/${locale}.json`,
        ))
  I18n.value = i18n

  if (props.custom) {
    for (const k in props.custom) {
      const i = parseInt(k)
      const category = props.custom[i]
      const prevCategory = props.custom[i - 1]

      if (!category.emojis || !category.emojis.length) continue

      category.id || (category.id = `custom_${i + 1}`)
      category.name || (category.name = i18n.categories.custom)

      if (prevCategory && !category.icon) {
        category.target = prevCategory.target || prevCategory
      }

      data.categories.push(category)

      for (const emoji of category.emojis) {
        if (typeof emoji !== 'string') {
          data.emojis[emoji.id] = emoji
        }
      }
    }
  }

  if (props.categories) {
    data.categories = (data.originalCategories || [])
      .filter((c) => {
        return props.categories!.indexOf(c.id) != -1
      })
      .sort((c1, c2) => {
        const i1 = props.categories!.indexOf(c1.id)
        const i2 = props.categories!.indexOf(c2.id)

        return i1 - i2
      })
  }

  let latestVersionSupport: number | undefined
  let noCountryFlags: boolean | undefined
  if (set == 'native') {
    latestVersionSupport = NativeSupport.latestVersion()
    noCountryFlags = props.noCountryFlags || NativeSupport.noCountryFlags()
  }

  let categoryIndex = data.categories.length
  let resetSearchIndex = false
  while (categoryIndex--) {
    const category = data.categories[categoryIndex]

    if (category.id == 'frequent') {
      let { maxFrequentRows, perLine } = props

      maxFrequentRows =
        maxFrequentRows != null && maxFrequentRows >= 0
          ? maxFrequentRows
          : (PickerProps.maxFrequentRows as PropDefault<number>).value
      perLine || (perLine = (PickerProps.perLine as PropDefault<number>).value)

      category.emojis = FrequentlyUsed.get({ maxFrequentRows, perLine })
    }

    if (!category.emojis || !category.emojis.length) {
      data.categories.splice(categoryIndex, 1)
      continue
    }

    const { categoryIcons } = props
    if (categoryIcons) {
      const icon = (categoryIcons as Record<string, string>)[category.id]
      if (icon && !category.icon) {
        category.icon = icon
      }
    }

    let emojiIndex = category.emojis.length
    while (emojiIndex--) {
      const emojiId = category.emojis[emojiIndex]
      const emoji =
        typeof emojiId !== 'string' ? emojiId : data.emojis[emojiId]

      const ignore = () => {
        category.emojis.splice(emojiIndex, 1)
      }

      if (
        !emoji ||
        (props.exceptEmojis && props.exceptEmojis.includes(emoji.id))
      ) {
        ignore()
        continue
      }

      if (latestVersionSupport && emoji.version > latestVersionSupport) {
        ignore()
        continue
      }

      if (noCountryFlags && category.id == 'flags') {
        if (!SafeFlags.includes(emoji.id)) {
          ignore()
          continue
        }
      }

      if (!emoji.search) {
        resetSearchIndex = true
        emoji.search =
          ',' +
          ([
            [emoji.id, false],
            [emoji.name, true],
            [emoji.keywords, false],
            [emoji.emoticons, false],
          ] as [string | string[] | undefined, boolean][])
            .map(([strings, split]) => {
              if (!strings) return []
              return (Array.isArray(strings) ? strings : [strings])
                .map((string) => {
                  return (split ? string.split(/[-|_|\s]+/) : [string]).map(
                    (s) => s.toLowerCase(),
                  )
                })
                .flat()
            })
            .flat()
            .filter((a) => a && a.trim())
            .join(',')

        if (emoji.emoticons) {
          for (const emoticon of emoji.emoticons) {
            if (data.emoticons[emoticon]) continue
            data.emoticons[emoticon] = emoji.id
          }
        }

        let skinIndex = 0
        for (const skin of emoji.skins) {
          if (!skin) continue
          skinIndex++

          const { native } = skin
          if (native) {
            data.natives[native] = emoji.id
            emoji.search += `,${native}`
          }

          const skinShortcodes =
            skinIndex == 1 ? '' : `:skin-tone-${skinIndex}:`
          skin.shortcodes = `:${emoji.id}:${skinShortcodes}`
        }
      }
    }
  }

  if (resetSearchIndex) {
    SearchIndex.reset()
  }

  Data.value = data
  triggerRef(Data)
  triggerRef(I18n)

  initCallback?.()
}

export function getProps<D extends Record<string, unknown>>(
  props: Record<string, unknown> | null | undefined,
  defaultProps: D,
  element?: HTMLElement,
): Record<string, unknown> {
  props || (props = {})

  const _props: Record<string, unknown> = {}
  for (const k in defaultProps) {
    _props[k] = getProp(k, props, defaultProps, element)
  }

  return _props
}

export function getProp(
  propName: string,
  props: Record<string, unknown>,
  defaultProps: Record<string, unknown>,
  element?: HTMLElement,
): unknown {
  const defaults = defaultProps[propName] as PropDefault | null | undefined
  let value: unknown =
    (element && element.getAttribute(propName)) ||
    (props[propName] != null && props[propName] != undefined
      ? props[propName]
      : null)

  if (!defaults) {
    return value
  }

  if (
    value != null &&
    defaults.value != null &&
    typeof defaults.value != typeof value
  ) {
    if (typeof defaults.value == 'boolean') {
      value = value == 'false' ? false : true
    } else {
      value = (defaults.value as { constructor: (v: unknown) => unknown }).constructor(value)
    }
  }

  if (defaults.transform && value) {
    value = defaults.transform(value)
  }

  if (
    value == null ||
    (defaults.choices && defaults.choices.indexOf(value as never) == -1)
  ) {
    value = defaults.value
  }

  return value
}

