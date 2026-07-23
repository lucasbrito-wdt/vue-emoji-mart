import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import i18nEn from '@vue-emoji-mart/data/i18n/en.json'

import { createMockEmojiData } from '../fixtures/mock-data'

/**
 * Integration test for `Picker.vue`, mounted with local data (no fetch, per
 * the mock fixture) — new coverage, not present in the original (mostly
 * `.skip`d) suite. The fixture is deliberately small (5 emojis, <10 rows)
 * so every row falls in `useRowVirtualizer`'s default-visible bucket 0
 * without depending on `IntersectionObserver` actually firing in happy-dom.
 */
describe('Picker.vue', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function mountPicker(props: Record<string, unknown> = {}) {
    const { default: Picker } = await import('@/components/Picker.vue')
    const wrapper = mount(Picker, {
      props: {
        data: createMockEmojiData(),
        i18n: i18nEn,
        maxFrequentRows: 0,
        ...props,
      },
    })

    await flushPromises()
    return wrapper
  }

  test('monta com dados locais e renderiza um botão por emoji do grid', async () => {
    const wrapper = await mountPicker()

    const buttons = wrapper.findAll('button[aria-posinset]')
    // 5 emojis no fixture (people: grinning, wink, joy; nature: cat, dog).
    expect(buttons).toHaveLength(5)
  })

  test('busca filtra o grid exibido para os resultados correspondentes', async () => {
    const wrapper = await mountPicker()

    const input = wrapper.find('input[type="search"]')
    await input.setValue('pet')
    await input.trigger('input')
    await flushPromises()

    // A grade principal continua no DOM (oculta via CSS `display: none`,
    // não removida com `v-if` — ver `PickerEmojiGrid.vue`), então o escopo da
    // busca precisa se limitar ao container de resultados (`.category`, o
    // primeiro na ordem do template quando `searchResults` está setado).
    const resultsContainer = wrapper.find('.category')
    const buttons = resultsContainer.findAll('button[aria-posinset]')
    expect(buttons).toHaveLength(2)

    const labels = buttons.map((button) => button.attributes('aria-label'))
    expect(labels).toEqual(['🐱', '🐶'])
  })

  test('clique em um emoji emite select com o EmojiData resolvido', async () => {
    const wrapper = await mountPicker()

    const grinningButton = wrapper
      .findAll('button[aria-posinset]')
      .find((button) => button.attributes('aria-label') === '😀')
    expect(grinningButton).toBeDefined()

    await grinningButton!.trigger('click')

    const emitted = wrapper.emitted('select')
    expect(emitted).toBeDefined()
    expect(emitted![0][0]).toMatchObject({ id: 'grinning', native: '😀' })
  })
})
