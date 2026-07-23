<script setup lang="ts">
import { computed } from 'vue'

import PickerEmojiButton from './PickerEmojiButton.vue'
import { px } from '../utils'

import type { ComponentPublicInstance } from 'vue'
import type { EmojiGridRow } from '../composables/useEmojiGrid'

/**
 * The unit of virtualization — port of the `rows.map(...)` block inline in
 * `Picker.tsx`'s `renderCategories()`. Only rows flagged `isSentinel` (1 in
 * `ROWS_PER_RENDER`, see `useEmojiGrid`) register themselves with
 * `registerSentinel`, matching the original's `rowIndex % rowsPerRender ?
 * {} : createRef()`. When `visible` is false the row still occupies its
 * `top` offset (absolutely positioned) but renders no `PickerEmojiButton`
 * children at all, keeping mounted DOM proportional to the viewport.
 */
const props = defineProps<{
  row: EmojiGridRow | undefined
  rowIndex: number
  posinset: number
  top: number
  isSentinel: boolean
  visible: boolean
  perLine: number
  setSize: number
  skin: number
  emojiButtonSize: number
  emojiSize: number
  emojiButtonRadius: string
  emojiButtonColors?: string[]
  previewPositionNone: boolean
  set: string
  getSpritesheetURL?: (set: string) => string
  registerSentinel: (index: number, el: Element | null) => void
}>()

const paddedRow = computed(() => {
  const row = props.row ?? []
  if (row.length >= props.perLine) return row

  return [...row, ...new Array(props.perLine - row.length)]
})

function bindSentinel(el: Element | ComponentPublicInstance | null): void {
  props.registerSentinel(props.rowIndex, el as Element | null)
}
</script>

<template>
  <div
    :data-index="rowIndex"
    :ref="isSentinel ? bindSentinel : undefined"
    class="flex row"
    :style="{ top: px(top) }"
  >
    <template v-if="visible">
      <template v-for="(emoji, i) in paddedRow" :key="i">
        <PickerEmojiButton
          v-if="emoji"
          :emoji="emoji"
          :pos="[rowIndex, i]"
          :posinset="posinset + i"
          :set-size="setSize"
          :skin="skin"
          :emoji-button-size="emojiButtonSize"
          :emoji-size="emojiSize"
          :emoji-button-radius="emojiButtonRadius"
          :emoji-button-colors="emojiButtonColors"
          :title="previewPositionNone ? emoji.name : undefined"
          :set="set"
          :getSpritesheetURL="getSpritesheetURL"
        />
        <div v-else :style="{ width: px(emojiButtonSize), height: px(emojiButtonSize) }"></div>
      </template>
    </template>
  </div>
</template>
