<script setup lang="ts">
import { computed } from 'vue'

import { Data } from '../config'
import { px } from '../utils'
import { SearchIndex } from '../helpers'

import type { AugmentedEmoji, AugmentedSkin } from '../types/data'
import type { EmojiPropsValues } from '../types'

/**
 * Port of `Emoji.tsx`. Functional in the original (a plain function
 * component, no state) — stays functional here too: everything is derived
 * via `computed()` from props + the module-level `Data` shallowRef, no local
 * reactive state of its own.
 */
const props = withDefaults(defineProps<EmojiPropsValues>(), {
  fallback: '',
  id: '',
  native: '',
  shortcodes: '',
  size: '',
  set: 'native',
  skin: 1,
})

const resolved = computed<{ id?: string; skin: number }>(() => {
  let id = props.id
  let skin: number = props.skin

  if (props.shortcodes) {
    const matches = props.shortcodes.match(SearchIndex.SHORTCODES_REGEX)

    if (matches) {
      id = matches[1]

      if (matches[2]) {
        skin = Number(matches[2])
      }
    }
  }

  return { id, skin }
})

const emoji = computed<AugmentedEmoji | undefined>(() => {
  if (props.emoji) return props.emoji as AugmentedEmoji
  return SearchIndex.get(resolved.value.id || props.native)
})

const emojiSkin = computed<AugmentedSkin | undefined>(() => {
  const current = emoji.value
  if (!current) return undefined
  return current.skins[resolved.value.skin - 1] || current.skins[0]
})

const imageSrc = computed<string | undefined>(() => {
  const skin = emojiSkin.value
  if (!skin) return undefined

  if (skin.src) return skin.src
  if (props.set == 'native' || props.spritesheet) return undefined

  return typeof props.getImageURL === 'function'
    ? props.getImageURL(props.set as string, skin.unified)
    : `https://cdn.jsdelivr.net/npm/emoji-datasource-${props.set}@15.0.1/img/${props.set}/64/${skin.unified}.png`
})

const spritesheetSrc = computed<string>(() => {
  return typeof props.getSpritesheetURL === 'function'
    ? props.getSpritesheetURL(props.set as string)
    : `https://cdn.jsdelivr.net/npm/emoji-datasource-${props.set}@15.0.1/img/${props.set}/sheets-256/64.png`
})

const spritesheetStyle = computed(() => {
  const sheet = Data.value?.sheet
  const skin = emojiSkin.value
  if (!sheet || !skin) return {}

  return {
    display: 'block',
    width: px(props.size),
    height: px(props.size),
    backgroundImage: `url(${spritesheetSrc.value})`,
    backgroundSize: `${100 * sheet.cols}% ${100 * sheet.rows}%`,
    backgroundPosition: `${(100 / (sheet.cols - 1)) * (skin.x ?? 0)}% ${(100 / (sheet.rows - 1)) * (skin.y ?? 0)}%`,
  }
})
</script>

<template>
  <template v-if="!emoji">{{ fallback }}</template>
  <span v-else class="emoji-mart-emoji" :data-emoji-set="set">
    <img
      v-if="imageSrc"
      :style="{ maxWidth: px(size) || '1em', maxHeight: px(size) || '1em', display: 'inline-block' }"
      :alt="emojiSkin?.native || emojiSkin?.shortcodes"
      :src="imageSrc"
    />
    <span
      v-else-if="set == 'native'"
      :style="{
        fontSize: px(size),
        fontFamily:
          '\'EmojiMart\', \'Segoe UI Emoji\', \'Segoe UI Symbol\', \'Segoe UI\', \'Apple Color Emoji\', \'Twemoji Mozilla\', \'Noto Color Emoji\', \'Android Emoji\'',
      }"
      >{{ emojiSkin?.native }}</span
    >
    <span v-else :style="spritesheetStyle"></span>
  </span>
</template>
