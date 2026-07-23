import { SearchIndex } from './helpers'

import type { AugmentedEmoji, EmojiData } from './types/data'

export function deepEqual(a: unknown, b: unknown): boolean {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val == b[index])
  )
}

export async function sleep(frames = 1): Promise<void> {
  for (const _ in [...Array(frames).keys()]) {
    await new Promise(requestAnimationFrame)
  }
}

export function getEmojiData(
  emoji: AugmentedEmoji,
  { skinIndex = 0 }: { skinIndex?: number } = {},
): EmojiData {
  const skin =
    emoji.skins[skinIndex] ||
    (() => {
      skinIndex = 0
      return emoji.skins[skinIndex]
    })()

  const emojiData: EmojiData = {
    id: emoji.id,
    name: emoji.name,
    native: skin.native,
    unified: skin.unified,
    keywords: emoji.keywords,
    shortcodes: skin.shortcodes || (emoji as unknown as { shortcodes?: string }).shortcodes,
  }

  if (emoji.skins.length > 1) {
    emojiData.skin = skinIndex + 1
  }

  if (skin.src) {
    emojiData.src = skin.src
  }

  if (emoji.aliases && emoji.aliases.length) {
    emojiData.aliases = emoji.aliases
  }

  if (emoji.emoticons && emoji.emoticons.length) {
    emojiData.emoticons = emoji.emoticons
  }

  return emojiData
}

export async function getEmojiDataFromNative(
  nativeString: string,
): Promise<EmojiData | null> {
  const results = await SearchIndex.search(nativeString, {
    maxResults: 1,
    caller: 'getEmojiDataFromNative',
  })
  if (!results || !results.length) return null

  const emoji = results[0]
  let skinIndex = 0

  for (const skin of emoji.skins) {
    if (skin.native == nativeString) {
      break
    }

    skinIndex++
  }

  return getEmojiData(emoji, { skinIndex })
}

/**
 * Vue's `:style` binding does not auto-append `px` to numeric values the
 * way Preact/React do — `el.style.height = 30` stringifies to the invalid
 * CSS value `"30"` and is silently dropped by the browser. The original
 * `Picker.tsx` relies on Preact's implicit unit handling throughout its
 * inline `style={{ ... }}` objects; every port site that carried a bare
 * number over needs to run it through this first.
 */
export function px(value: number | string | undefined): string | undefined {
  if (value === undefined || value === null) return undefined
  return typeof value === 'number' ? `${value}px` : value
}
