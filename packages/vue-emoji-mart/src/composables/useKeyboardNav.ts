import type { Ref } from 'vue'
import type { EmojiGrid } from './useEmojiGrid'

function resolveSize(value: number | (() => number)): number {
  return typeof value === 'function' ? value() : value
}

export interface UseKeyboardNavOptions {
  /** Shared selection position — see `useSearch`'s `UseSearchOptions.pos`. */
  pos: Ref<[number, number]>
  keyboard: Ref<boolean>
  scrollRootRef: Ref<HTMLElement | null | undefined>
  /** Resolves a category's root element — share `useCategoryObserver`'s `getCategoryElement`, plus the search results container (category id `'search'`). */
  getCategoryElement: (categoryId: string) => HTMLElement | null | undefined
  emojiButtonSize: number | (() => number)
  ignoreMouse?: () => void
}

/**
 * Composable port of `Picker.tsx`'s `navigate()`/`scrollTo()`. Operates on
 * whichever `EmojiGrid` is currently active (main grid or search results) —
 * the caller (Fase 4's `useKeyboardNav` consumer) decides which one to pass
 * per call, mirroring the original's `this.state.searchResults || this.grid`.
 */
export function useKeyboardNav(options: UseKeyboardNavOptions): {
  navigate: (args: {
    e: KeyboardEvent
    input: HTMLInputElement
    grid: EmojiGrid
    left?: boolean
    right?: boolean
    up?: boolean
    down?: boolean
  }) => void
  scrollTo: (args: { categoryId?: string; row?: number; grid: EmojiGrid }) => void
} {
  function scrollTo({
    categoryId,
    row,
    grid,
  }: {
    categoryId?: string
    row?: number
    grid: EmojiGrid
  }): void {
    if (!grid.length) return

    const scroll = options.scrollRootRef.value
    if (!scroll) return

    const scrollRect = scroll.getBoundingClientRect()
    let scrollTop = 0

    if (row != null && row >= 0) {
      categoryId = grid[row].categoryId
    }

    if (categoryId) {
      const el = options.getCategoryElement(categoryId)
      if (!el) return

      const categoryRect = el.getBoundingClientRect()
      scrollTop = categoryRect.top - (scrollRect.top - scroll.scrollTop) + 1
    }

    if (row != null && row >= 0) {
      if (!row) {
        scrollTop = 0
      } else {
        const size = resolveSize(options.emojiButtonSize)
        const rowIndex = grid[row].categoryRowIndex
        const rowTop = scrollTop + rowIndex * size
        const rowBot = rowTop + size + size * 0.88

        if (rowTop < scroll.scrollTop) {
          scrollTop = rowTop
        } else if (rowBot > scroll.scrollTop + scrollRect.height) {
          scrollTop = rowBot - scrollRect.height
        } else {
          return
        }
      }
    }

    options.ignoreMouse?.()
    scroll.scrollTop = scrollTop
  }

  function navigate({
    e,
    input,
    grid,
    left,
    right,
    up,
    down,
  }: {
    e: KeyboardEvent
    input: HTMLInputElement
    grid: EmojiGrid
    left?: boolean
    right?: boolean
    up?: boolean
    down?: boolean
  }): void {
    if (!grid.length) return

    let [p1, p2] = options.pos.value

    const next = ((): [number, number] | null => {
      if (p1 == 0) {
        if (p2 == 0 && !e.repeat && (left || up)) {
          return null
        }
      }

      if (p1 == -1) {
        if (
          !e.repeat &&
          (right || down) &&
          input.selectionStart == input.value.length
        ) {
          return [0, 0]
        }

        return null
      }

      if (left || right) {
        let row = grid[p1]
        const increment = left ? -1 : 1

        p2 += increment
        if (!row[p2]) {
          p1 += increment
          row = grid[p1]

          if (!row) {
            p1 = left ? 0 : grid.length - 1
            p2 = left ? 0 : grid[p1].length - 1

            return [p1, p2]
          }

          p2 = left ? row.length - 1 : 0
        }

        return [p1, p2]
      }

      if (up || down) {
        p1 += up ? -1 : 1
        const row = grid[p1]

        if (!row) {
          p1 = up ? 0 : grid.length - 1
          p2 = up ? 0 : grid[p1].length - 1

          return [p1, p2]
        }

        if (!row[p2]) {
          p2 = row.length - 1
        }

        return [p1, p2]
      }

      return null
    })()

    if (next) {
      e.preventDefault()
    } else {
      if (options.pos.value[0] > -1) {
        options.pos.value = [-1, -1]
      }

      return
    }

    options.pos.value = next
    options.keyboard.value = true
    scrollTo({ row: next[0], grid })
  }

  return { navigate, scrollTo }
}
