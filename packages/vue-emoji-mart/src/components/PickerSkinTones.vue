<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

/**
 * Port of `Picker.tsx`'s `renderSkins()` — the skin-tone popover. Position
 * (`top`/`bottom`/`left`/`right`) is computed by `Picker.vue` (it needs the
 * root element's and the skin-tone button's `getBoundingClientRect()`, both
 * of which live outside this component) and passed down as a ready-made
 * style object, same values the original computes inline before returning
 * the JSX.
 */
const props = defineProps<{
  dir: 'ltr' | 'rtl'
  choose: string
  skinLabels: Record<string | number, string>
  skin: number
  position: Record<string, string | number>
  dataPosition: 'top' | 'bottom'
  registerMenuRef: (el: Element | ComponentPublicInstance | null) => void
  registerCheckedRadioRef: (el: Element | ComponentPublicInstance | null) => void
}>()

const emit = defineEmits<{ hover: [skin?: number]; select: [skin: number] }>()

const skins = [1, 2, 3, 4, 5, 6]

function handleRadioKeydown(e: KeyboardEvent, skin: number): void {
  if (e.code == 'Enter' || e.code == 'Space' || e.code == 'Tab') {
    e.preventDefault()
    emit('select', skin)
  }
}
</script>

<template>
  <div
    :ref="registerMenuRef"
    role="radiogroup"
    :dir="dir"
    :aria-label="choose"
    class="menu hidden"
    :data-position="dataPosition"
    :style="position"
  >
    <div v-for="s in skins" :key="s">
      <input
        type="radio"
        name="skin-tone"
        :value="s"
        :aria-label="skinLabels[s]"
        :ref="skin == s ? registerCheckedRadioRef : undefined"
        :checked="skin == s"
        @change="emit('hover', s)"
        @keydown="handleRadioKeydown($event, s)"
      />

      <button
        aria-hidden="true"
        tabindex="-1"
        type="button"
        class="option flex flex-grow flex-middle"
        @click="emit('select', s)"
        @mouseenter="emit('hover', s)"
        @mouseleave="emit('hover')"
      >
        <span :class="`skin-tone skin-tone-${s}`"></span>
        <span class="margin-small-lr">{{ skinLabels[s] }}</span>
      </button>
    </div>
  </div>
</template>
