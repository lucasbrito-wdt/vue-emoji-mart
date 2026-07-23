import { beforeEach, describe, expect, test, vi } from 'vitest'
import i18nEn from '@luquinhasbrito/emoji-mart-data/i18n/en.json'

import { createMockEmojiData } from './fixtures/mock-data'

/**
 * Port of `__tests__/config.test.js` (originally `test.skip('', () => {})`,
 * asserted nothing). `init()` is a module-level singleton by design (see the
 * port plan's Risco 6) — every test resets the module registry and
 * dynamically re-imports `config.ts` so each scenario starts from a clean
 * `Data`/`I18n`/`promise` state instead of accumulating mutations from prior
 * tests in the same file.
 */
describe('init', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('mescla defaults do PickerProps e popula Data/I18n a partir dos dados fornecidos', async () => {
    const { init, Data, I18n } = await import('@/config')

    await init({ data: createMockEmojiData(), i18n: i18nEn, maxFrequentRows: 0 })

    expect(Data.value).not.toBeNull()
    expect(I18n.value).toEqual(i18nEn)

    // maxFrequentRows: 0 -> a categoria 'frequent' (unshift automático) fica
    // vazia e é removida pelo loop de limpeza de categorias sem emojis.
    expect(Data.value!.categories.map((c) => c.id)).toEqual(['people', 'nature'])

    // alias resolvido nos dois sentidos: data.aliases (id -> alias) e
    // emoji.aliases (alias -> id), como port de `_init`.
    expect(Data.value!.aliases.smile).toBe('grinning')
    expect(Data.value!.emojis.grinning.aliases).toEqual(['smile'])

    // índice de busca computado uma vez por emoji (search field + natives).
    expect(Data.value!.emojis.grinning.search).toContain(',grinning,')
    expect(Data.value!.natives['😀']).toBe('grinning')

    // shortcode de cada skin computado (single skin -> sem sufixo de tom).
    expect(Data.value!.emojis.grinning.skins[0].shortcodes).toBe(':grinning:')
  })

  test('categorias custom são anexadas e mescladas com i18n.categories.custom como nome', async () => {
    const { init, Data } = await import('@/config')

    const custom = [
      {
        emojis: [
          {
            id: 'party_parrot',
            name: 'Party Parrot',
            keywords: ['party'],
            version: 1,
            skins: [{ native: '🦜' }],
          },
        ],
      },
    ]

    await init({ data: createMockEmojiData(), i18n: i18nEn, maxFrequentRows: 0, custom })

    const customCategory = Data.value!.categories.find((c) => c.id === 'custom_1')
    expect(customCategory).toBeDefined()
    expect(customCategory!.name).toBe(i18nEn.categories.custom)
    expect(Data.value!.emojis.party_parrot).toBeDefined()
  })

  test('prop categories filtra e reordena as categorias originais', async () => {
    const { init, Data } = await import('@/config')

    await init({
      data: createMockEmojiData(),
      i18n: i18nEn,
      maxFrequentRows: 0,
      categories: ['nature', 'people'],
    })

    expect(Data.value!.categories.map((c) => c.id)).toEqual(['nature', 'people'])
  })

  test('sem argumentos e sem init prévio, retorna uma Promise pendente e avisa via console.warn', async () => {
    const { init } = await import('@/config')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    let resolved = false
    void init(null, { caller: 'test-caller' }).then(() => {
      resolved = true
    })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('test-caller'))
    expect(resolved).toBe(false)

    warnSpy.mockRestore()
  })
})
