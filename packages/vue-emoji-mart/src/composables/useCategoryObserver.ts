import { onUnmounted, ref } from 'vue'

import type { Ref } from 'vue'

/**
 * Composable port of `Picker.tsx`'s `observeCategories()` — feeds the active
 * category id (used by `PickerNavigation.vue`, Fase 4) from an
 * `IntersectionObserver` watching every category's root element against the
 * `.scroll` container. Category root elements are registered by the
 * rendering component via `registerCategoryRoot` (Vue function refs), since
 * this composable has no DOM access of its own.
 */
export function useCategoryObserver(scrollRootRef: Ref<HTMLElement | null | undefined>): {
  activeCategoryId: Ref<string | null>
  registerCategoryRoot: (categoryId: string, el: Element | null) => void
  getCategoryElement: (categoryId: string) => HTMLElement | null | undefined
  start: () => void
  stop: () => void
} {
  const activeCategoryId = ref<string | null>(null)
  const categoryElements = new Map<string, HTMLElement>()
  let observer: IntersectionObserver | null = null

  function registerCategoryRoot(categoryId: string, el: Element | null): void {
    if (el) {
      categoryElements.set(categoryId, el as HTMLElement)
    } else {
      categoryElements.delete(categoryId)
    }
  }

  function getCategoryElement(categoryId: string): HTMLElement | null | undefined {
    return categoryElements.get(categoryId)
  }

  function stop(): void {
    observer?.disconnect()
    observer = null
  }

  function start(): void {
    stop()

    const root = scrollRootRef.value
    if (!root || !categoryElements.size) return

    const visibleCategories = new Map<string, number>()

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.id
          if (!id) continue
          visibleCategories.set(id, entry.intersectionRatio)
        }

        for (const [id, ratio] of visibleCategories) {
          if (ratio) {
            activeCategoryId.value = id
            break
          }
        }
      },
      { root, threshold: [0.0, 1.0] },
    )

    for (const el of categoryElements.values()) {
      observer.observe(el)
    }
  }

  onUnmounted(stop)

  return { activeCategoryId, registerCategoryRoot, getCategoryElement, start, stop }
}
