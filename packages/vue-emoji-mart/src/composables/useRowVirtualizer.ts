import { onUnmounted, reactive } from 'vue'

import { ROWS_PER_RENDER } from './useEmojiGrid'

import type { Ref } from 'vue'

function resolveSize(value: number | (() => number)): number {
  return typeof value === 'function' ? value() : value
}

export interface UseRowVirtualizerOptions {
  scrollRootRef: Ref<HTMLElement | null | undefined>
  emojiButtonSize: number | (() => number)
  rowsPerRender?: number
}

/**
 * Composable port of `Picker.tsx`'s `observeRows()`. Only "sentinel" rows
 * (one every `rowsPerRender`, see `useEmojiGrid`'s `EmojiGridRowMeta.isSentinel`)
 * are registered/observed — same proportion of cost/precision as the
 * original, which only gives a real `createRef()` to 1-in-10 rows.
 * `visibleRowBuckets` is a `reactive(Set<number>)` (not a plain
 * object/array) for O(1) membership lookup, matching the port plan's
 * performance decision table.
 */
export function useRowVirtualizer(options: UseRowVirtualizerOptions): {
  visibleRowBuckets: Set<number>
  registerRowSentinel: (index: number, el: Element | null) => void
  isRowVisible: (rowIndex: number) => boolean
  start: () => void
  stop: () => void
} {
  const rowsPerRender = options.rowsPerRender ?? ROWS_PER_RENDER
  const visibleRowBuckets = reactive(new Set<number>([0]))
  const sentinelElements = new Map<number, HTMLElement>()
  let observer: IntersectionObserver | null = null

  function registerRowSentinel(index: number, el: Element | null): void {
    if (el) {
      sentinelElements.set(index, el as HTMLElement)
    } else {
      sentinelElements.delete(index)
    }
  }

  function isRowVisible(rowIndex: number): boolean {
    const bucket = rowIndex - (rowIndex % rowsPerRender)
    return visibleRowBuckets.has(bucket)
  }

  function stop(): void {
    observer?.disconnect()
    observer = null
  }

  function start(): void {
    stop()

    const root = options.scrollRootRef.value
    if (!root || !sentinelElements.size) return

    const size = resolveSize(options.emojiButtonSize)

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number((entry.target as HTMLElement).dataset.index)
          if (Number.isNaN(index)) continue

          if (entry.isIntersecting) {
            visibleRowBuckets.add(index)
          } else {
            visibleRowBuckets.delete(index)
          }
        }
      },
      {
        root,
        rootMargin: `${size * (rowsPerRender + 5)}px 0px ${size * rowsPerRender}px`,
      },
    )

    for (const el of sentinelElements.values()) {
      observer.observe(el)
    }
  }

  onUnmounted(stop)

  return { visibleRowBuckets, registerRowSentinel, isRowVisible, start, stop }
}
