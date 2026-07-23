import Store from './store'

import type { EmojiData } from '../types/data'

/**
 * Port of `helpers/frequently-used.ts`. `Index` stays a module-level cache
 * (not Vue reactive state) — same rationale as `Data`/`I18n` in `config.ts`:
 * it's read/written a lot (every `add`) and must never trigger a re-render
 * by itself.
 */
const DEFAULTS = [
  '+1',
  'grinning',
  'kissing_heart',
  'heart_eyes',
  'laughing',
  'stuck_out_tongue_winking_eye',
  'sweat_smile',
  'joy',
  'scream',
  'disappointed',
  'unamused',
  'weary',
  'sob',
  'sunglasses',
  'heart',
]

let Index: Record<string, number> | null = null

function add(emoji: EmojiData | string): void {
  Index || (Index = Store.get<Record<string, number>>('frequently') || {})

  const emojiId = typeof emoji === 'string' ? emoji : emoji.id
  if (!emojiId) return

  Index[emojiId] || (Index[emojiId] = 0)
  Index[emojiId] += 1

  Store.set('last', emojiId)
  Store.set('frequently', Index)
}

function get({
  maxFrequentRows,
  perLine,
}: {
  maxFrequentRows?: number
  perLine: number
}): string[] {
  if (!maxFrequentRows) return []

  Index || (Index = Store.get<Record<string, number>>('frequently') ?? null)
  let emojiIds: string[] = []

  if (!Index) {
    Index = {}

    for (const i in DEFAULTS.slice(0, perLine)) {
      const index = Number(i)
      const emojiId = DEFAULTS[index]

      Index[emojiId] = perLine - index
      emojiIds.push(emojiId)
    }

    return emojiIds
  }

  const max = maxFrequentRows * perLine
  const last = Store.get<string>('last')

  for (const emojiId in Index) {
    emojiIds.push(emojiId)
  }

  const index = Index
  emojiIds.sort((a, b) => {
    const aScore = index[b]
    const bScore = index[a]

    if (aScore == bScore) {
      return a.localeCompare(b)
    }

    return aScore - bScore
  })

  if (emojiIds.length > max) {
    const removedIds = emojiIds.slice(max)
    emojiIds = emojiIds.slice(0, max)

    for (const removedId of removedIds) {
      if (removedId == last) continue
      delete index[removedId]
    }

    if (last && emojiIds.indexOf(last) == -1) {
      delete index[emojiIds[emojiIds.length - 1]]
      emojiIds.splice(-1, 1, last)
    }

    Store.set('frequently', index)
  }

  return emojiIds
}

export default { add, get, DEFAULTS }
