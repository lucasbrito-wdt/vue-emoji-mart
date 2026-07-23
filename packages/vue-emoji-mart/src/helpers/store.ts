/**
 * Port of `helpers/store.ts` — thin `window.localStorage` wrapper, namespaced
 * under `emoji-mart.*` keys, with the same silent try/catch fallback as the
 * original (private browsing, quota exceeded, etc). The only behavioral
 * addition is the `typeof window !== 'undefined'` guard, needed because Vue
 * apps commonly render under SSR (Nuxt) where `window` doesn't exist on the
 * first pass — the original assumes a client-only DOM environment.
 */
function set(key: string, value: unknown): void {
  if (typeof window === 'undefined') return

  try {
    window.localStorage[`emoji-mart.${key}`] = JSON.stringify(value)
  } catch {
    // Ignored: matches original's silent fallback (private mode, quota, ...)
  }
}

function get<T = unknown>(key: string): T | undefined {
  if (typeof window === 'undefined') return undefined

  try {
    const value = window.localStorage[`emoji-mart.${key}`]

    if (value) {
      return JSON.parse(value)
    }
  } catch {
    // Ignored: matches original's silent fallback
  }

  return undefined
}

export default { set, get }
