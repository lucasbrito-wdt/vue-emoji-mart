import { shallowRef } from 'vue'

import { SearchIndex } from '../helpers'

import type { Ref } from 'vue'
import type { EmojiGrid, EmojiGridRow } from './useEmojiGrid'

function resolvePerLine(value: number | (() => number)): number {
  return typeof value === 'function' ? value() : value
}

export interface UseSearchOptions {
  perLine: number | (() => number)
  inputRef: Ref<HTMLInputElement | null | undefined>
  /**
   * Shared selection position — same `[row, col]` tuple used by
   * `useKeyboardNav`/hover. Owned by the orchestrating component (Fase 4)
   * and passed in by reference, since the original keeps a single
   * `this.state.pos` shared across search, keyboard nav and mouse hover.
   */
  pos: Ref<[number, number]>
  scrollRootRef?: Ref<HTMLElement | null | undefined>
  ignoreMouse?: () => void
}

/**
 * Composable port of `Picker.tsx`'s `handleSearchInput`/`handleSearchClick`/
 * `clearSearch`. Builds a results grid shaped exactly like `useEmojiGrid`'s
 * `EmojiGrid` (all rows tagged `categoryId: 'search'`), so `useKeyboardNav`
 * can navigate it with the same `grid[p1][p2]` addressing regardless of
 * whether the active grid is search results or the full picker.
 */
export function useSearch(options: UseSearchOptions): {
  searchResults: Ref<EmojiGrid | null>
  handleInput: () => Promise<void>
  handleClick: (getEmojiByPos: (pos: [number, number]) => unknown) => void
  clear: () => void
} {
  const searchResults = shallowRef<EmojiGrid | null>(null)

  function resetScroll(): void {
    const root = options.scrollRootRef?.value
    if (root) root.scrollTop = 0
  }

  async function handleInput(): Promise<void> {
    const input = options.inputRef.value
    if (!input) return

    const { value } = input
    const results = await SearchIndex.search(value)

    if (!results) {
      searchResults.value = null
      options.pos.value = [-1, -1]
      resetScroll()
      return
    }

    const nextPos: [number, number] =
      input.selectionStart == input.value.length ? [0, 0] : [-1, -1]

    const grid = [] as unknown as EmojiGrid
    grid.setsize = results.length
    let row: EmojiGridRow | null = null

    for (const emoji of results) {
      if (!grid.length || row!.length == resolvePerLine(options.perLine)) {
        row = [] as unknown as EmojiGridRow
        row.categoryId = 'search'
        row.categoryRowIndex = grid.length
        grid.push(row)
      }

      row!.push(emoji)
    }

    options.ignoreMouse?.()
    searchResults.value = grid
    options.pos.value = nextPos
    resetScroll()
  }

  function handleClick(getEmojiByPos: (pos: [number, number]) => unknown): void {
    const emoji = getEmojiByPos(options.pos.value)
    if (!emoji) return

    options.pos.value = [-1, -1]
  }

  function clear(): void {
    const input = options.inputRef.value
    if (!input) return

    input.value = ''
    input.focus()

    void handleInput()
  }

  return { searchResults, handleInput, handleClick, clear }
}
