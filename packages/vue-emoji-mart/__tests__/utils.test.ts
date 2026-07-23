import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import i18nEn from '@vue-emoji-mart/data/i18n/en.json'

import { createMockEmojiData } from './fixtures/mock-data'

/** Port of `__tests__/utils.test.js` (`deepEqual`/`sleep`), plus new
 * coverage for `getEmojiDataFromNative` (not covered by the original). */
describe('deepEqual', () => {
  test('valida igualdade profunda entre arrays', async () => {
    const { deepEqual } = await import('@/utils')

    expect(deepEqual([], [])).toBe(true)
    expect(deepEqual([0, 0], [0, 0])).toBe(true)
    expect(deepEqual([0, 1], [1, 0])).toBe(false)
    expect(deepEqual([0], 'not-an-array')).toBe(false)
  })
})

describe('sleep', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('aguarda um requestAnimationFrame por frame solicitado', async () => {
    const { sleep } = await import('@/utils')

    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(0)
    await sleep(1)
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)
    await sleep(2)
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(3)
  })
})

describe('getEmojiDataFromNative', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('resolve o EmojiData a partir do caractere nativo correspondente', async () => {
    const { init } = await import('@/config')
    const { getEmojiDataFromNative } = await import('@/utils')

    await init({ data: createMockEmojiData(), i18n: i18nEn, maxFrequentRows: 0 })

    const result = await getEmojiDataFromNative('😀')
    expect(result).toMatchObject({ id: 'grinning', native: '😀', unified: '1f600' })
  })

  test('retorna null quando nenhum emoji corresponde ao caractere nativo', async () => {
    const { init } = await import('@/config')
    const { getEmojiDataFromNative } = await import('@/utils')

    await init({ data: createMockEmojiData(), i18n: i18nEn, maxFrequentRows: 0 })

    expect(await getEmojiDataFromNative('🙈')).toBeNull()
  })
})
