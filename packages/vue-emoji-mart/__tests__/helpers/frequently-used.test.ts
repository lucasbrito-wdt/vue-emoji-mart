import { beforeEach, describe, expect, test, vi } from 'vitest'

/**
 * Port of `helpers/__tests__/frequently-used.test.js` (originally
 * `test.skip`). Each test resets the module registry so `frequently-used.ts`'s
 * module-level `Index` cache (and `store.ts`'s underlying localStorage) don't
 * leak between assertions.
 */
describe('FrequentlyUsed', () => {
  beforeEach(() => {
    vi.resetModules()
    window.localStorage.clear()
  })

  test('get sem maxFrequentRows retorna lista vazia', async () => {
    const { default: FrequentlyUsed } = await import('@/helpers/frequently-used')

    expect(FrequentlyUsed.get({ perLine: 9 } as never)).toEqual([])
  })

  test('get sem histórico retorna os DEFAULTS na ordem original, limitados a perLine', async () => {
    const { default: FrequentlyUsed } = await import('@/helpers/frequently-used')

    const result = FrequentlyUsed.get({ maxFrequentRows: 1, perLine: 4 })
    expect(result).toEqual(FrequentlyUsed.DEFAULTS.slice(0, 4))
  })

  test('add incrementa a contagem de uso e persiste no Store', async () => {
    const { default: FrequentlyUsed } = await import('@/helpers/frequently-used')
    const { default: Store } = await import('@/helpers/store')

    FrequentlyUsed.add('cat')
    FrequentlyUsed.add('cat')
    FrequentlyUsed.add('dog')

    expect(Store.get<Record<string, number>>('frequently')).toEqual({ cat: 2, dog: 1 })
    expect(Store.get('last')).toBe('dog')
  })

  test('get ordena por uso mais frequente primeiro (empate por ordem alfabética)', async () => {
    const { default: FrequentlyUsed } = await import('@/helpers/frequently-used')

    FrequentlyUsed.add('cat')
    FrequentlyUsed.add('cat')
    FrequentlyUsed.add('dog')

    const result = FrequentlyUsed.get({ maxFrequentRows: 4, perLine: 9 })
    expect(result).toEqual(['cat', 'dog'])
  })
})
