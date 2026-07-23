<script setup lang="ts">
import { computed } from 'vue'

import Icons from '../icons'
import { I18n } from '../config'

import type { AugmentedCategory } from '../types/data'

/**
 * Port of `Navigation.tsx`. The original is a `PureComponent` holding its
 * own `categoryId` state, mutated imperatively by `Picker`'s
 * `observeCategories()` via a `createRef()`. Here `activeCategoryId` is a
 * plain prop fed by `useCategoryObserver` (owned by `Picker.vue`) — Vue's
 * fine-grained reactivity plus `v-memo` already give the same "skip
 * re-render while typing in search" behavior the original got from
 * `PureComponent`, without needing imperative `ref.setState`.
 */
const props = defineProps<{
  categories: AugmentedCategory[]
  icons: 'auto' | 'outline' | 'solid'
  theme: 'light' | 'dark'
  dir: 'ltr' | 'rtl'
  unfocused: boolean
  position: 'top' | 'bottom' | 'none'
  activeCategoryId: string | null
}>()

const emit = defineEmits<{ 'category-click': [category: AugmentedCategory, index: number] }>()

const THEME_ICONS = { light: 'outline', dark: 'solid' } as const

const selectedCategoryIndex = computed(() => {
  if (props.unfocused) return null
  const index = props.categories.findIndex((category) => category.id == props.activeCategoryId)
  return index == -1 ? null : index
})

function categoryTitle(category: AugmentedCategory): string {
  return category.name || I18n.value?.categories[category.id] || category.id
}

function categoryIconHtml(category: AugmentedCategory): string | null {
  const { icon } = category as unknown as { icon?: { svg?: string; src?: string } }
  if (icon?.svg) return icon.svg
  return null
}

function categoryIconSrc(category: AugmentedCategory): string | null {
  const { icon } = category as unknown as { icon?: { svg?: string; src?: string } }
  if (icon && !icon.svg && icon.src) return icon.src
  return null
}

function categoryIconSet(category: AugmentedCategory): string {
  const categoryIcons = (Icons.categories as Record<string, unknown>)[category.id] ?? Icons.categories.custom
  if (typeof categoryIcons == 'string') return categoryIcons

  const style = props.icons == 'auto' ? THEME_ICONS[props.theme] : props.icons
  const iconSet = categoryIcons as { outline: string; solid: string }
  return iconSet[style as 'outline' | 'solid'] ?? iconSet.outline
}
</script>

<template>
  <nav id="nav" v-memo="[activeCategoryId, theme, unfocused, categories, icons]" class="padding" :data-position="position" :dir="dir">
    <div class="flex relative">
      <button
        v-for="(category, i) in categories"
        :key="category.id"
        :aria-label="categoryTitle(category)"
        :aria-selected="(!unfocused && category.id == activeCategoryId) || undefined"
        :title="categoryTitle(category)"
        type="button"
        class="flex flex-grow flex-center"
        @mousedown.prevent
        @click="emit('category-click', category, i)"
      >
        <span v-if="categoryIconHtml(category)" class="flex" v-html="categoryIconHtml(category)"></span>
        <img v-else-if="categoryIconSrc(category)" :src="categoryIconSrc(category) as string" />
        <span v-else class="flex" v-html="categoryIconSet(category)"></span>
      </button>

      <div
        class="bar"
        :style="{
          width: `${100 / categories.length}%`,
          opacity: selectedCategoryIndex == null ? 0 : 1,
          transform:
            dir === 'rtl'
              ? `scaleX(-1) translateX(${(selectedCategoryIndex ?? 0) * 100}%)`
              : `translateX(${(selectedCategoryIndex ?? 0) * 100}%)`,
        }"
      ></div>
    </div>
  </nav>
</template>
