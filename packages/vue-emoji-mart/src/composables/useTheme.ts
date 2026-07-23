import { onUnmounted, ref } from 'vue'

import type { Ref } from 'vue'

export type ThemeOption = 'auto' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

function resolveThemeProp(value: ThemeOption | (() => ThemeOption)): ThemeOption {
  return typeof value === 'function' ? value() : value
}

/**
 * Composable port of `Picker.tsx`'s `initTheme()`/`darkMediaCallback`. Adds
 * an SSR guard (`window`/`matchMedia` existence check) beyond the original,
 * which assumes a client-only DOM environment — same rationale as the
 * `Store` helper's guard (Vue apps commonly render under SSR/Nuxt).
 */
export function useTheme(themeProp: ThemeOption | (() => ThemeOption)): {
  theme: Ref<ResolvedTheme>
  init: () => void
} {
  const theme = ref<ResolvedTheme>('light')
  let darkMedia: MediaQueryList | null = null

  function darkMediaCallback(): void {
    if (resolveThemeProp(themeProp) != 'auto') return
    theme.value = darkMedia!.matches ? 'dark' : 'light'
  }

  function init(): void {
    const value = resolveThemeProp(themeProp)

    if (value != 'auto') {
      theme.value = value
      return
    }

    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      theme.value = 'light'
      return
    }

    if (!darkMedia) {
      darkMedia = window.matchMedia('(prefers-color-scheme: dark)')

      if (darkMedia.media.match(/^not/)) {
        theme.value = 'light'
        return
      }

      darkMedia.addEventListener('change', darkMediaCallback)
    }

    theme.value = darkMedia.matches ? 'dark' : 'light'
  }

  onUnmounted(() => {
    darkMedia?.removeEventListener('change', darkMediaCallback)
  })

  return { theme, init }
}
