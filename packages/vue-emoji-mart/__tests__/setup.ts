/**
 * Vitest setup file (registered via `vitest.config.ts`'s `test.setupFiles`).
 *
 * `happy-dom@15` implements `window.localStorage`, but this project's
 * vitest/happy-dom combo (`vitest@2.1.9`) doesn't expose it on the global
 * `window` by default in this environment — `helpers/store.ts` swallows the
 * resulting `TypeError` in its try/catch (matching the original's silent
 * fallback), but that also means persistence tests would silently no-op
 * without a working `localStorage`. This shim is a minimal dictionary-backed
 * stand-in, sufficient for `Store`'s bracket-notation access
 * (`window.localStorage['emoji-mart.<key>']`) and for tests to `.clear()`
 * between runs.
 */
if (typeof window !== 'undefined' && !window.localStorage) {
  const storage: Record<string, unknown> = {}

  Object.defineProperty(storage, 'clear', {
    enumerable: false,
    value: () => {
      for (const key of Object.keys(storage)) delete storage[key]
    },
  })
  Object.defineProperty(storage, 'getItem', {
    enumerable: false,
    value: (key: string) => (key in storage ? String(storage[key]) : null),
  })
  Object.defineProperty(storage, 'setItem', {
    enumerable: false,
    value: (key: string, value: string) => {
      storage[key] = String(value)
    },
  })
  Object.defineProperty(storage, 'removeItem', {
    enumerable: false,
    value: (key: string) => {
      delete storage[key]
    },
  })

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    writable: true,
    value: storage,
  })
}
