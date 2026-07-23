import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * Port of `helpers/__tests__/store.test.js` (originally `test.skip`) — the
 * original never actually asserted anything. Here we test the real contract:
 * JSON round-trip persistence under `emoji-mart.*` keys, and the SSR guard
 * (`typeof window === 'undefined'`) added on top of the original's
 * client-only assumption.
 */
describe('Store', () => {
  beforeEach(async () => {
    vi.resetModules()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('persiste e recupera valores via JSON round-trip', async () => {
    const { default: Store } = await import('@/helpers/store')

    Store.set('skin', 3)
    expect(Store.get('skin')).toBe(3)

    Store.set('frequently', { grinning: 2 })
    expect(Store.get('frequently')).toEqual({ grinning: 2 })
  })

  test('get retorna undefined para chave inexistente', async () => {
    const { default: Store } = await import('@/helpers/store')

    expect(Store.get('nonexistent')).toBeUndefined()
  })

  test('namespacea a chave sob emoji-mart.*', async () => {
    const { default: Store } = await import('@/helpers/store')

    Store.set('last', 'grinning')
    expect(window.localStorage['emoji-mart.last']).toBe('"grinning"')
  })

  test('guard SSR: sem window, set/get não lançam e get retorna undefined', async () => {
    const { default: Store } = await import('@/helpers/store')

    vi.stubGlobal('window', undefined)

    expect(() => Store.set('skin', 5)).not.toThrow()
    expect(Store.get('skin')).toBeUndefined()
  })
})
