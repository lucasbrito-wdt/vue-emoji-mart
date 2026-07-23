import { ref } from 'vue'

import { Store } from '../helpers'
import { sleep } from '../utils'

import type { Ref } from 'vue'

function resolveDefault(value: number | (() => number)): number {
  return typeof value === 'function' ? value() : value
}

export interface UseSkinToneOptions {
  /** `props.skin` — used only when no skin is persisted in `Store` yet. */
  defaultSkin: number | (() => number)
  baseRef: Ref<HTMLElement | null | undefined>
  menuRef: Ref<HTMLElement | null | undefined>
  focusCheckedRadio?: () => void
  ignoreMouse?: () => void
}

/**
 * Composable port of `Picker.tsx`'s `openSkins`/`closeSkins`/
 * `handleSkinClick`/`handleSkinMouseOver`. One deliberate bugfix vs. the
 * original: `closeSkins()` there removes the capture-phase listeners
 * without the `capture: true` flag it used to add them
 * (`removeEventListener('click', this.handleBaseClick)`, no 3rd arg), which
 * means the listeners are never actually detached. Both add/remove use
 * `capture: true` here so they're symmetric and don't leak.
 */
export function useSkinTone(options: UseSkinToneOptions): {
  skin: Ref<number>
  tempSkin: Ref<number | null>
  showSkins: Ref<DOMRect | null>
  openSkins: (e: MouseEvent) => Promise<void>
  closeSkins: () => void
  handleSkinMouseOver: (next?: number) => void
  handleSkinClick: (next: number) => void
} {
  const skin = ref(Store.get<number>('skin') || resolveDefault(options.defaultSkin))
  const tempSkin = ref<number | null>(null)
  const showSkins = ref<DOMRect | null>(null)

  function handleBaseClick(e: MouseEvent): void {
    if (!showSkins.value) return

    const target = e.target as HTMLElement
    if (!target.closest('.menu')) {
      e.preventDefault()
      e.stopImmediatePropagation()
      closeSkins()
    }
  }

  function handleBaseKeydown(e: KeyboardEvent): void {
    if (!showSkins.value) return

    if (e.key == 'Escape') {
      e.preventDefault()
      e.stopImmediatePropagation()
      closeSkins()
    }
  }

  async function openSkins(e: MouseEvent): Promise<void> {
    const currentTarget = e.currentTarget as HTMLElement
    showSkins.value = currentTarget.getBoundingClientRect()

    // Firefox requires 2 frames for the transition to consistently work
    await sleep(2)

    const menu = options.menuRef.value
    if (!menu) return

    menu.classList.remove('hidden')
    options.focusCheckedRadio?.()

    options.baseRef.value?.addEventListener('click', handleBaseClick, true)
    options.baseRef.value?.addEventListener('keydown', handleBaseKeydown, true)
  }

  function closeSkins(): void {
    if (!showSkins.value) return

    showSkins.value = null
    tempSkin.value = null

    options.baseRef.value?.removeEventListener('click', handleBaseClick, true)
    options.baseRef.value?.removeEventListener('keydown', handleBaseKeydown, true)
  }

  function handleSkinMouseOver(next?: number): void {
    tempSkin.value = next ?? null
  }

  function handleSkinClick(next: number): void {
    options.ignoreMouse?.()
    closeSkins()

    skin.value = next
    tempSkin.value = null
    Store.set('skin', next)
  }

  return { skin, tempSkin, showSkins, openSkins, closeSkins, handleSkinMouseOver, handleSkinClick }
}
