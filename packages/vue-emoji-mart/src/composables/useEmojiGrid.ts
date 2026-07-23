import { computed } from 'vue'

import { Data } from '../config'
import { SearchIndex } from '../helpers'

import type { ComputedRef, Ref } from 'vue'
import type { AugmentedEmoji } from '../types/data'

/**
 * Composable port of `Picker.tsx`'s `initGrid()`/`getPerLine()`/
 * `getEmojiByPos()`. The original builds `this.grid` imperatively once in
 * `componentWillMount` (and again on `reset()`), alongside a parallel
 * `this.refs.categories` map holding `createRef()`s used later for
 * `IntersectionObserver`. Here the grid becomes a `computed()` — Vue already
 * memoizes it and only recomputes when `Data.value` (reassigned by
 * `config.ts`'s `init()`) or `perLine` change, replicating the "compute
 * once, invalidate only when necessary" behavior described in the port plan.
 *
 * DOM refs for row virtualization are NOT created here (this composable has
 * no DOM access) — `rowMeta[i].isSentinel` flags which rows the rendering
 * component (`PickerCategoryRow.vue`, Fase 4) must bind a real template ref
 * to for `useRowVirtualizer`; every `ROWS_PER_RENDER`th row is a sentinel,
 * same proportion as the original's `rowIndex % Performance.rowsPerRender`.
 */
export const ROWS_PER_RENDER = 10

export interface EmojiGridRow extends Array<AugmentedEmoji | undefined> {
  categoryId: string
  /** Row index within its own category — mirrors original `row.__index`. */
  categoryRowIndex: number
}

export interface EmojiGridRowMeta {
  /** Global row index within the flattened grid — mirrors original `rowRef.index`. */
  index: number
  /** aria-posinset of the row's first emoji, cumulative across ALL categories — mirrors original `rowRef.posinset`. */
  posinset: number
  /** True every `ROWS_PER_RENDER` rows — the only rows meant to get a real DOM ref for `IntersectionObserver`. */
  isSentinel: boolean
}

export type EmojiGrid = EmojiGridRow[] & { setsize: number }

export interface CategoryGridEntry {
  id: string
  name?: string
  icon?: string
  rows: EmojiGridRowMeta[]
}

export function useEmojiGrid(perLine: Ref<number>): {
  grid: ComputedRef<EmojiGrid>
  rowMeta: ComputedRef<EmojiGridRowMeta[]>
  categories: ComputedRef<CategoryGridEntry[]>
  getEmojiByPos: (
    pos: [number, number],
    searchGrid?: EmojiGrid | null,
  ) => AugmentedEmoji | undefined
} {
  const grid = computed<EmojiGrid>(() => {
    const result = [] as unknown as EmojiGrid
    result.setsize = 0

    const data = Data.value
    if (!data) return result

    for (const category of data.categories) {
      let categoryRowIndex = 0

      const addRow = (): EmojiGridRow => {
        const row = [] as unknown as EmojiGridRow
        row.categoryId = category.id
        row.categoryRowIndex = categoryRowIndex++
        result.push(row)
        return row
      }

      let row = addRow()

      for (const emojiRef of category.emojis) {
        if (row.length === perLine.value) {
          row = addRow()
        }

        result.setsize += 1
        const emoji =
          typeof emojiRef === 'string' ? SearchIndex.get(emojiRef) : emojiRef
        row.push(emoji)
      }
    }

    return result
  })

  const rowMeta = computed<EmojiGridRowMeta[]>(() => {
    let posinset = 1

    return grid.value.map((row, index) => {
      const meta: EmojiGridRowMeta = {
        index,
        posinset,
        isSentinel: index % ROWS_PER_RENDER === 0,
      }

      posinset += row.length
      return meta
    })
  })

  const categories = computed<CategoryGridEntry[]>(() => {
    const data = Data.value
    if (!data) return []

    return data.categories.map((category) => {
      const rows: EmojiGridRowMeta[] = []

      grid.value.forEach((row, index) => {
        if (row.categoryId === category.id) {
          rows.push(rowMeta.value[index])
        }
      })

      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        rows,
      }
    })
  })

  function getEmojiByPos(
    pos: [number, number],
    searchGrid?: EmojiGrid | null,
  ): AugmentedEmoji | undefined {
    const activeGrid = searchGrid || grid.value
    const [p1, p2] = pos
    const cell = activeGrid[p1] && activeGrid[p1][p2]

    if (!cell) return undefined
    return SearchIndex.get(cell)
  }

  return { grid, rowMeta, categories, getEmojiByPos }
}
