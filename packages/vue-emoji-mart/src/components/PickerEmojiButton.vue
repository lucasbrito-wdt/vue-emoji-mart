<script setup lang="ts">
import { computed, inject } from 'vue'

import Emoji from './Emoji.vue'
import { PICKER_GRID_CONTEXT } from './picker-context'
import { deepEqual, px } from '../utils'

import type { AugmentedEmoji } from '../types/data'
import type { EmojiPropsValues } from '../types'

/**
 * Port of `Picker.tsx`'s `renderEmojiButton()`. `selected` is derived from
 * the shared `pos` ref (see `picker-context.ts`) instead of being passed
 * down as a prop by the parent row/category — this is what lets a hover or
 * keyboard-nav change skip re-rendering every other button: only components
 * that read `pos.value` (i.e. every mounted button, exactly like the
 * original re-runs `shouldComponentUpdate` on every `PureInlineComponent`)
 * are notified, and `v-memo` below skips the actual DOM patch for any button
 * whose `[selected, skin, emojiButtonSize]` triple didn't change — the exact
 * equivalent of `PureInlineComponent`'s `{selected, skin, size}` comparison.
 */
const props = defineProps<{
  emoji: AugmentedEmoji
  pos: [number, number]
  posinset: number
  setSize: number
  skin: number
  emojiButtonSize: number
  emojiSize: number
  emojiButtonRadius: string
  emojiButtonColors?: string[]
  title?: string
  set: string
  getSpritesheetURL?: (set: string) => string
}>()

const context = inject(PICKER_GRID_CONTEXT, null)

const emojiSkin = computed(() => props.emoji.skins[props.skin - 1] || props.emoji.skins[0])
const native = computed(() => emojiSkin.value?.native)

const selected = computed(() => (context ? deepEqual(context.pos.value, props.pos) : false))

const backgroundColor = computed(() => {
  if (!props.emojiButtonColors?.length) return undefined
  return props.emojiButtonColors[(props.posinset - 1) % props.emojiButtonColors.length]
})

function handleClick(e: Event): void {
  context?.onEmojiClick(props.emoji, e)
}

function handleMouseEnter(): void {
  context?.onEmojiOver(props.pos)
}

function handleMouseLeave(): void {
  context?.onEmojiOver()
}
</script>

<template>
  <button
    v-memo="[selected, skin, emojiButtonSize]"
    :aria-label="native"
    :aria-selected="selected || undefined"
    :aria-posinset="posinset"
    :aria-setsize="setSize"
    :data-keyboard="context?.keyboard.value"
    :title="title"
    type="button"
    class="flex flex-center flex-middle"
    tabindex="-1"
    :style="{ width: px(emojiButtonSize), height: px(emojiButtonSize), fontSize: px(emojiSize), lineHeight: 0 }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      aria-hidden="true"
      class="background"
      :style="{ borderRadius: emojiButtonRadius, backgroundColor }"
    ></div>
    <Emoji
      :emoji="emoji"
      :set="(set as EmojiPropsValues['set'])"
      :size="emojiSize"
      :skin="(skin as EmojiPropsValues['skin'])"
      :spritesheet="true"
      :getSpritesheetURL="getSpritesheetURL"
    />
  </button>
</template>
