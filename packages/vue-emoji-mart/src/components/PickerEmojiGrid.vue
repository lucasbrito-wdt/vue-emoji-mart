<script setup lang="ts">
import { I18n } from '../config'

import PickerCategoryRow from './PickerCategoryRow.vue'
import PickerEmojiButton from './PickerEmojiButton.vue'
import { px } from '../utils'

import type { ComponentPublicInstance } from 'vue'
import type { CategoryGridEntry, EmojiGrid } from '../composables/useEmojiGrid'
import type { AugmentedEmoji } from '../types/data'

/**
 * The scrollable grid body — port of the tail end of `Picker.tsx`'s
 * `render()` (`renderSearchResults()` + `renderCategories()`), extracted out
 * of `Picker.vue` purely to keep the orchestrator under the file size limit;
 * it owns no state of its own, every callback (`isRowVisible`,
 * `registerRowSentinel`, `registerCategoryRoot`, `categoryDataId`) is still
 * owned by the composables in `Picker.vue` and just passed through.
 */
defineProps<{
  dir: 'ltr' | 'rtl'
  searchResults: EmojiGrid | null
  categories: CategoryGridEntry[]
  grid: EmojiGrid
  perLine: number
  emojiButtonSize: number
  emojiSize: number
  emojiButtonRadius: string
  emojiButtonColors?: string[]
  skin: number
  set: string
  getSpritesheetURL?: (set: string) => string
  previewPositionNone: boolean
  onAddCustomEmoji?: (event: Event) => void
  isRowVisible: (rowIndex: number) => boolean
  registerRowSentinel: (index: number, el: Element | null) => void
  registerCategoryRoot: (categoryId: string, el: Element | null) => void
  categoryDataId: (categoryId: string) => string
  registerSearchContainer: (el: Element | ComponentPublicInstance | null) => void
}>()
</script>

<template>
  <div v-if="searchResults" class="category" :ref="registerSearchContainer">
    <div :class="`sticky padding-small align-${dir[0]}`">{{ I18n?.categories.search }}</div>
    <div>
      <div v-if="!searchResults.length" :class="`padding-small align-${dir[0]}`">
        <a v-if="onAddCustomEmoji" @click="onAddCustomEmoji">{{ I18n?.add_custom }}</a>
      </div>
      <div v-for="(row, i) in searchResults" v-else :key="i" class="flex">
        <PickerEmojiButton
          v-for="(emoji, ii) in row"
          :key="ii"
          :emoji="emoji as AugmentedEmoji"
          :pos="[i, ii]"
          :posinset="i * perLine + ii + 1"
          :set-size="searchResults.setsize"
          :skin="skin"
          :emoji-button-size="emojiButtonSize"
          :emoji-size="emojiSize"
          :emoji-button-radius="emojiButtonRadius"
          :emoji-button-colors="emojiButtonColors"
          :title="previewPositionNone ? (emoji as AugmentedEmoji).name : undefined"
          :set="set"
          :getSpritesheetURL="getSpritesheetURL"
        />
      </div>
    </div>
  </div>

  <div
    :style="{
      visibility: searchResults ? 'hidden' : undefined,
      display: searchResults ? 'none' : undefined,
      height: '100%',
    }"
  >
    <div
      v-for="category in categories"
      :key="category.id"
      class="category"
      :data-id="categoryDataId(category.id)"
      :ref="(el) => registerCategoryRoot(categoryDataId(category.id), el as Element | null)"
    >
      <div :class="`sticky padding-small align-${dir[0]}`">
        {{ category.name || I18n?.categories[category.id] }}
      </div>
      <div class="relative" :style="{ height: px(category.rows.length * emojiButtonSize) }">
        <PickerCategoryRow
          v-for="(meta, i) in category.rows"
          :key="meta.index"
          :row="grid[meta.index]"
          :row-index="meta.index"
          :posinset="meta.posinset"
          :top="i * emojiButtonSize"
          :is-sentinel="meta.isSentinel"
          :visible="isRowVisible(meta.index)"
          :per-line="perLine"
          :set-size="grid.setsize"
          :skin="skin"
          :emoji-button-size="emojiButtonSize"
          :emoji-size="emojiSize"
          :emoji-button-radius="emojiButtonRadius"
          :emoji-button-colors="emojiButtonColors"
          :preview-position-none="previewPositionNone"
          :set="set"
          :getSpritesheetURL="getSpritesheetURL"
          :register-sentinel="registerRowSentinel"
        />
      </div>
    </div>
  </div>
</template>
