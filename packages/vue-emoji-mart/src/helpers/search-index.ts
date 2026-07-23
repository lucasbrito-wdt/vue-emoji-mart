import { Data, init } from '../config'

import type { AugmentedEmoji } from '../types/data'

/**
 * Port of `helpers/search-index.ts` — pure function, zero Vue reactivity.
 * `Pool` is a module-level cache reset by `config.ts`'s `init()` whenever new
 * emoji `search` strings are computed, matching the original 1:1.
 */
const SHORTCODES_REGEX = /^(?:\:([^\:]+)\:)(?:\:skin-tone-(\d)\:)?$/
let Pool: AugmentedEmoji[] | null = null

function get(emojiId: string | AugmentedEmoji): AugmentedEmoji | undefined {
  if (typeof emojiId !== 'string') {
    return emojiId
  }

  const data = Data.value
  if (!data) return undefined

  return (
    data.emojis[emojiId] ||
    data.emojis[data.aliases[emojiId]] ||
    data.emojis[data.natives[emojiId]]
  )
}

function reset(): void {
  Pool = null
}

async function search(
  value: string,
  { maxResults, caller }: { maxResults?: number; caller?: string } = {},
): Promise<AugmentedEmoji[] | null | undefined> {
  if (!value || !value.trim().length) return null
  maxResults || (maxResults = 90)

  await init(null, { caller: caller || 'SearchIndex.search' })

  const data = Data.value
  if (!data) return undefined

  const values = value
    .toLowerCase()
    .replace(/(\w)-/, '$1 ')
    .split(/[\s|,]+/)
    .filter((word, i, words) => {
      return word.trim() && words.indexOf(word) == i
    })

  if (!values.length) return undefined

  let pool: AugmentedEmoji[] = Pool || (Pool = Object.values(data.emojis))
  let results: AugmentedEmoji[] = []
  let scores: Record<string, number> = {}

  for (const value of values) {
    if (!pool.length) break

    results = []
    scores = {}

    for (const emoji of pool) {
      if (!emoji.search) continue
      const score = emoji.search.indexOf(`,${value}`)
      if (score == -1) continue

      results.push(emoji)
      scores[emoji.id] || (scores[emoji.id] = 0)
      scores[emoji.id] += emoji.id == value ? 0 : score + 1
    }

    pool = results
  }

  if (results.length < 2) {
    return results
  }

  results.sort((a, b) => {
    const aScore = scores[a.id]
    const bScore = scores[b.id]

    if (aScore == bScore) {
      return a.id.localeCompare(b.id)
    }

    return aScore - bScore
  })

  if (results.length > maxResults) {
    results = results.slice(0, maxResults)
  }

  return results
}

export default { search, get, reset, SHORTCODES_REGEX }
