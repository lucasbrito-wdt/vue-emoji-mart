import { onMounted, onUnmounted, ref, unref } from 'vue'

import type { MaybeRefOrGetter, Ref } from 'vue'

function resolve<T>(value: MaybeRefOrGetter<T>): T {
  return typeof value === 'function' ? (value as () => T)() : unref(value)
}

export interface UseDynamicPerLineOptions {
  /** Template ref to the element whose width drives `perLine` (the Picker's root element, same as original `props.element`). */
  elementRef: Ref<HTMLElement | null | undefined>
  dynamicWidth: MaybeRefOrGetter<boolean>
  emojiButtonSize: MaybeRefOrGetter<number>
  /** Fallback used before mount (template refs aren't populated yet) and when `dynamicWidth` is off — mirrors `props.perLine`. */
  defaultPerLine: MaybeRefOrGetter<number>
}

/**
 * Composable port of `Picker.tsx`'s `initDynamicPerLine()`. One caveat vs.
 * the original: Preact's class component has `this.props.element` available
 * synchronously in the constructor, so `perLine` could be computed
 * *before* first render. Vue template refs are only populated after mount,
 * so `perLine` starts at `defaultPerLine` and is corrected on `onMounted`
 * once the element is measurable — same single `ResizeObserver`
 * (disconnected on unmount, mirroring `componentWillUnmount`/`unregister`),
 * just resolved one microtask later.
 */
export function useDynamicPerLine(options: UseDynamicPerLineOptions): {
  perLine: Ref<number>
  recalculate: () => void
} {
  const perLine = ref(resolve(options.defaultPerLine))
  let observer: ResizeObserver | null = null

  function calculate(): number {
    const el = options.elementRef.value
    if (!el) return resolve(options.defaultPerLine)

    const { width } = el.getBoundingClientRect()
    return Math.floor(width / resolve(options.emojiButtonSize))
  }

  function recalculate(): void {
    perLine.value = calculate()
  }

  onMounted(() => {
    if (!resolve(options.dynamicWidth)) return

    const el = options.elementRef.value
    if (!el) return

    recalculate()

    observer = new ResizeObserver(() => {
      recalculate()
    })
    observer.observe(el)
  })

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { perLine, recalculate }
}
