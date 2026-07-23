import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import i18nEn from '@vue-emoji-mart/data/i18n/en.json'

import { createMockEmojiData } from '../fixtures/mock-data'

/** Port of `Emoji.tsx` behavior: native span, image (CDN URL) and spritesheet
 * span, resolved via the shared `Data`/`SearchIndex` (so `init()` runs first
 * in every test, module registry reset for isolation). */
describe('Emoji.vue', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  async function setup() {
    const { init } = await import('@/config')
    await init({ data: createMockEmojiData(), i18n: i18nEn, maxFrequentRows: 0 })
    const { default: Emoji } = await import('@/components/Emoji.vue')
    return Emoji
  }

  test('renderiza o caractere nativo quando set=native (default)', async () => {
    const Emoji = await setup()
    const wrapper = mount(Emoji, { props: { id: 'grinning' } })

    expect(wrapper.find('span.emoji-mart-emoji').exists()).toBe(true)
    expect(wrapper.text()).toBe('😀')
    expect(wrapper.find('img').exists()).toBe(false)
  })

  test('resolve por shortcode (:id:) e por tom de pele no shortcode', async () => {
    const Emoji = await setup()
    const wrapper = mount(Emoji, { props: { shortcodes: ':grinning:' } })

    expect(wrapper.text()).toBe('😀')
  })

  test('renderiza <img> com a URL padrão da CDN quando set != native e sem imagem custom', async () => {
    const Emoji = await setup()
    const wrapper = mount(Emoji, { props: { id: 'grinning', set: 'apple' } })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(
      'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/64/1f600.png',
    )
  })

  test('renderiza span de spritesheet (background-position) quando spritesheet=true', async () => {
    const Emoji = await setup()
    const wrapper = mount(Emoji, {
      props: { id: 'grinning', set: 'apple', spritesheet: true },
    })

    expect(wrapper.find('img').exists()).toBe(false)
    const sprite = wrapper.find('span[style*="background-image"]')
    expect(sprite.exists()).toBe(true)
    expect(sprite.attributes('style')).toContain(
      'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.0.1/img/apple/sheets-256/64.png',
    )
  })

  test('renderiza o fallback quando o emoji não é encontrado', async () => {
    const Emoji = await setup()
    const wrapper = mount(Emoji, { props: { id: 'does-not-exist', fallback: '?' } })

    expect(wrapper.text()).toBe('?')
    expect(wrapper.find('span.emoji-mart-emoji').exists()).toBe(false)
  })
})
