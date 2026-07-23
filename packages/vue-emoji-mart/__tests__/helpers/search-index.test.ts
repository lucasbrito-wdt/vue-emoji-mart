import { beforeEach, describe, expect, test, vi } from 'vitest'
import i18nEn from '@luquinhasbrito/emoji-mart-data/i18n/en.json'

import { createMockEmojiData } from '../fixtures/mock-data'

/**
 * `SearchIndex` reads from `config.ts`'s module-level `Data` shallowRef, so
 * every test resets the module registry and re-imports `init`/`SearchIndex`
 * fresh — otherwise `Data`/`Pool` would leak state between tests (see
 * `config.ts`'s singleton `init()` design note).
 */
describe('SearchIndex', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function setup() {
    const { init } = await import('@/config')
    const { default: SearchIndex } = await import('@/helpers/search-index')
    await init({ data: createMockEmojiData(), i18n: i18nEn, maxFrequentRows: 0 })
    return SearchIndex
  }

  test('get resolve por id, alias e caractere nativo', async () => {
    const SearchIndex = await setup()

    expect(SearchIndex.get('grinning')?.id).toBe('grinning')
    expect(SearchIndex.get('smile')?.id).toBe('grinning')
    expect(SearchIndex.get('😀')?.id).toBe('grinning')
    expect(SearchIndex.get('does-not-exist')).toBeUndefined()
  })

  test('search retorna null para valor vazio', async () => {
    const SearchIndex = await setup()

    expect(await SearchIndex.search('')).toBeNull()
    expect(await SearchIndex.search('   ')).toBeNull()
  })

  test('search filtra por keyword e ordena resultados por score (empate por id)', async () => {
    const SearchIndex = await setup()

    const results = await SearchIndex.search('pet')
    expect(results?.map((emoji) => emoji.id)).toEqual(['cat', 'dog'])
  })

  test('search por múltiplas palavras restringe o pool a cada termo', async () => {
    const SearchIndex = await setup()

    const results = await SearchIndex.search('happy')
    expect(results?.map((emoji) => emoji.id).sort()).toEqual(['grinning', 'joy'])

    const noMatch = await SearchIndex.search('happy meow')
    expect(noMatch).toEqual([])
  })

  test('reset limpa o pool em cache sem quebrar buscas subsequentes', async () => {
    const SearchIndex = await setup()

    await SearchIndex.search('pet')
    SearchIndex.reset()

    const results = await SearchIndex.search('pet')
    expect(results?.map((emoji) => emoji.id)).toEqual(['cat', 'dog'])
  })
})
