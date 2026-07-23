import type { AugmentedEmojiMartData } from '@/types/data'

/**
 * Minimal, deterministic `EmojiMartData`-shaped fixture used across the
 * helper/config/component test suites — small enough to keep row/grid math
 * (and IntersectionObserver-free `useRowVirtualizer` visibility) predictable
 * (every row fits in the default visible bucket), but rich enough to exercise
 * aliases, natives, keywords and emoticons.
 *
 * Returns a fresh object every call: `init()` mutates its argument in place
 * (search index, aliases, shortcodes...), so tests that call `init()` more
 * than once must not share a single instance.
 */
export function createMockEmojiData(): AugmentedEmojiMartData {
  return {
    categories: [
      { id: 'people', emojis: ['grinning', 'wink', 'joy'] },
      { id: 'nature', emojis: ['cat', 'dog'] },
    ],
    emojis: {
      grinning: {
        id: 'grinning',
        name: 'Grinning Face',
        keywords: ['happy', 'smile'],
        version: 1,
        skins: [{ unified: '1f600', native: '😀' }],
      },
      wink: {
        id: 'wink',
        name: 'Winking Face',
        keywords: ['flirt'],
        version: 1,
        emoticons: [';)'],
        skins: [{ unified: '1f609', native: '😉' }],
      },
      joy: {
        id: 'joy',
        name: 'Face with Tears of Joy',
        keywords: ['happy', 'haha'],
        version: 1,
        skins: [{ unified: '1f602', native: '😂' }],
      },
      cat: {
        id: 'cat',
        name: 'Cat Face',
        keywords: ['animal', 'pet', 'meow'],
        version: 1,
        skins: [{ unified: '1f431', native: '🐱' }],
      },
      dog: {
        id: 'dog',
        name: 'Dog Face',
        keywords: ['animal', 'pet'],
        version: 1,
        skins: [{ unified: '1f436', native: '🐶' }],
      },
    },
    aliases: { smile: 'grinning' },
    sheet: { cols: 61, rows: 61 },
  } as unknown as AugmentedEmojiMartData
}
