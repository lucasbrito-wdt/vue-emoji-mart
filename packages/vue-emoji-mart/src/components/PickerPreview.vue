<script setup lang="ts">
import Emoji from './Emoji.vue'
import { px } from '../utils'

import type { ComponentPublicInstance } from 'vue'
import type { AugmentedEmoji } from '../types/data'
import type { EmojiPropsValues } from '../types'

/** Port of `Picker.tsx`'s `renderPreview()`. */
const props = defineProps<{
  emoji?: AugmentedEmoji
  noSearchResults: boolean
  dir: 'ltr' | 'rtl'
  previewPosition: 'top' | 'bottom' | 'none'
  emojiButtonSize: number
  set: string
  skin: number
  getSpritesheetURL?: (set: string) => string
  noResultsEmoji?: string
  previewEmoji?: string
  pick: string
  searchNoResults1: string
  searchNoResults2: string
  showSkinTone: boolean
  choose: string
  showSkins: boolean
  registerSkinToneButtonRef: (el: Element | ComponentPublicInstance | null) => void
}>()

const emit = defineEmits<{ 'open-skins': [event: MouseEvent] }>()

const previewEmojiId = props.noSearchResults
  ? props.noResultsEmoji || 'cry'
  : props.previewEmoji || (props.previewPosition == 'top' ? 'point_down' : 'point_up')
</script>

<template>
  <div id="preview" class="flex flex-middle" :dir="dir" :data-position="previewPosition">
    <div class="flex flex-middle flex-grow">
      <div
        class="flex flex-auto flex-middle flex-center"
        :style="{ height: px(emojiButtonSize), fontSize: px(emojiButtonSize) }"
      >
        <Emoji
          :emoji="emoji"
          :id="previewEmojiId"
          :set="(set as EmojiPropsValues['set'])"
          :size="emojiButtonSize"
          :skin="(skin as EmojiPropsValues['skin'])"
          :spritesheet="true"
          :getSpritesheetURL="getSpritesheetURL"
        />
      </div>

      <div :class="`margin-${dir[0]}`">
        <div v-if="emoji || noSearchResults" :class="`padding-${dir[2]} align-${dir[0]}`">
          <div class="preview-title ellipsis">{{ emoji ? emoji.name : searchNoResults1 }}</div>
          <div class="preview-subtitle ellipsis color-c">
            {{ emoji ? emoji.skins[0].shortcodes : searchNoResults2 }}
          </div>
        </div>
        <div v-else class="preview-placeholder color-c">{{ pick }}</div>
      </div>
    </div>

    <div
      v-if="!emoji && showSkinTone"
      class="flex flex-auto flex-center flex-middle"
      style="position: relative"
    >
      <button
        type="button"
        :ref="registerSkinToneButtonRef"
        class="skin-tone-button flex flex-auto flex-center flex-middle"
        :aria-selected="showSkins ? 'true' : undefined"
        :aria-label="choose"
        :title="choose"
        @click="emit('open-skins', $event)"
      >
        <span :class="`skin-tone skin-tone-${skin}`"></span>
      </button>
    </div>
  </div>
</template>
