<script setup lang="ts">
import Icons from '../icons'

import type { ComponentPublicInstance } from 'vue'

/**
 * Port of `Picker.tsx`'s `renderSearch()`. Doesn't own `useSearch` itself —
 * `Picker.vue` does (it also feeds `useKeyboardNav`/`scrollTo`), this
 * component only forwards native DOM events and exposes the ref registration
 * callbacks the composables need (`inputRef`, and — when the skin-tone
 * button lives here — the button ref used later to position the popover).
 */
defineProps<{
  dir: 'ltr' | 'rtl'
  placeholder: string
  hasSearchResults: boolean
  showSkinTone: boolean
  skin: number
  choose: string
  showSkins: boolean
  registerInputRef: (el: Element | ComponentPublicInstance | null) => void
  registerSkinToneButtonRef: (el: Element | ComponentPublicInstance | null) => void
}>()

const emit = defineEmits<{
  click: []
  input: []
  keydown: [event: KeyboardEvent]
  clear: []
  'open-skins': [event: MouseEvent]
}>()

function preventDefault(e: Event): void {
  e.preventDefault()
}
</script>

<template>
  <div>
    <div class="spacer"></div>
    <div class="flex flex-middle">
      <div class="search relative flex-grow">
        <input
          type="search"
          :ref="registerInputRef"
          :placeholder="placeholder"
          autocomplete="off"
          @click="emit('click')"
          @input="emit('input')"
          @keydown="emit('keydown', $event)"
        />
        <span class="icon loupe flex" v-html="Icons.search.loupe"></span>
        <button
          v-if="hasSearchResults"
          title="Clear"
          aria-label="Clear"
          type="button"
          class="icon delete flex"
          @click="emit('clear')"
          @mousedown="preventDefault"
        >
          <span v-html="Icons.search.delete"></span>
        </button>
      </div>

      <div
        v-if="showSkinTone"
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
  </div>
</template>
