<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'

import { Data, I18n, init } from '../config'
import { FrequentlyUsed, Store } from '../helpers'
import { getEmojiData } from '../utils'
import {
  useCategoryObserver,
  useDynamicPerLine,
  useEmojiGrid,
  useKeyboardNav,
  useRowVirtualizer,
  useSearch,
  useSkinTone,
  useTheme,
} from '../composables'

import PickerEmojiGrid from './PickerEmojiGrid.vue'
import PickerLiveRegion from './PickerLiveRegion.vue'
import PickerNavigation from './PickerNavigation.vue'
import PickerPreview from './PickerPreview.vue'
import PickerSearch from './PickerSearch.vue'
import PickerSkinTones from './PickerSkinTones.vue'
import { PICKER_GRID_CONTEXT } from './picker-context'

import type { InitOptions } from '../config'
import type { AugmentedCategory, AugmentedEmoji, EmojiData } from '../types/data'
import type { PickerPropsValues } from '../types'

/**
 * Orchestrator — port of `Picker.tsx`'s `render()` plus its instance
 * methods, broken up as described in the port plan: each composable owns
 * one behavioral concern (grid, virtualization, search, keyboard nav, skin
 * tone, theme), this component only wires refs/props between them and the
 * presentational subcomponents.
 */
const props = withDefaults(defineProps<PickerPropsValues>(), {
  autoFocus: false,
  dynamicWidth: false,
  emojiButtonRadius: '100%',
  emojiButtonSize: 36,
  emojiSize: 24,
  emojiVersion: 15,
  exceptEmojis: () => [],
  icons: 'auto',
  locale: 'en',
  maxFrequentRows: 4,
  navPosition: 'top',
  noCountryFlags: false,
  perLine: 9,
  previewPosition: 'bottom',
  searchPosition: 'sticky',
  set: 'native',
  skin: 1,
  skinTonePosition: 'preview',
  theme: 'auto',
})

const emit = defineEmits<{
  select: [emoji: EmojiData, event: Event]
  'click-outside': [event: Event]
}>()

const rootRef = ref<HTMLElement | null>(null)
const scrollRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const skinToneButtonRef = ref<HTMLElement | null>(null)
const searchContainerRef = ref<HTMLElement | null>(null)
let checkedRadioEl: HTMLElement | null = null

const pos = ref<[number, number]>([-1, -1])
const keyboard = ref(false)

const ready = computed(() => !!Data.value && !!I18n.value)
const dir = computed<'ltr' | 'rtl'>(() => (I18n.value?.rtl ? 'rtl' : 'ltr'))
const effectiveSearchPosition = computed(() => {
  if (props.stickySearch === false && props.searchPosition === 'sticky') {
    console.warn(
      '[EmojiMart] Deprecation warning: `stickySearch` has been renamed `searchPosition`.',
    )
    return 'static'
  }
  return props.searchPosition
})

const { perLine } = useDynamicPerLine({
  elementRef: rootRef,
  dynamicWidth: () => props.dynamicWidth,
  emojiButtonSize: () => props.emojiButtonSize,
  defaultPerLine: () => props.perLine,
})

const { grid, categories, getEmojiByPos } = useEmojiGrid(perLine)

const { registerRowSentinel, isRowVisible, start: startRows, stop: stopRows } = useRowVirtualizer({
  scrollRootRef: scrollRef,
  emojiButtonSize: () => props.emojiButtonSize,
})

const { activeCategoryId, registerCategoryRoot, getCategoryElement, start: startCategories, stop: stopCategories } =
  useCategoryObserver(scrollRef)

const { theme, init: initTheme } = useTheme(() => props.theme)

let mouseIsIgnored = false
let ignoreMouseTimer: ReturnType<typeof setTimeout> | undefined
function ignoreMouse(): void {
  mouseIsIgnored = true
  clearTimeout(ignoreMouseTimer)
  ignoreMouseTimer = setTimeout(() => { mouseIsIgnored = false }, 100)
}
function focusCheckedRadio(): void {
  checkedRadioEl?.focus()
}

const { skin, tempSkin, showSkins, openSkins, closeSkins, handleSkinMouseOver, handleSkinClick } =
  useSkinTone({ defaultSkin: () => props.skin, baseRef: rootRef, menuRef, focusCheckedRadio, ignoreMouse })

function resolveCategoryElement(categoryId: string): HTMLElement | null | undefined {
  if (categoryId === 'search') return searchContainerRef.value
  return getCategoryElement(categoryId)
}

const {
  searchResults,
  handleInput: handleSearchInput,
  handleClick: handleSearchClickResult,
  clear: clearSearch,
} = useSearch({ perLine: () => perLine.value, inputRef: searchInputRef, pos, scrollRootRef: scrollRef, ignoreMouse })

const { navigate, scrollTo } = useKeyboardNav({
  pos,
  keyboard,
  scrollRootRef: scrollRef,
  getCategoryElement: resolveCategoryElement,
  emojiButtonSize: () => props.emojiButtonSize,
  ignoreMouse,
})

const activeGrid = computed(() => searchResults.value || grid.value)
const activeEmoji = computed(() => getEmojiByPos(pos.value, searchResults.value))
const noSearchResults = computed(() => !!searchResults.value && searchResults.value.length === 0)
const navCategories = computed<AugmentedCategory[]>(
  () => Data.value?.categories.filter((category) => !category.target) ?? [],
)
function categoryDataId(categoryId: string): string {
  // Custom categories without their own icon merge into the previous
  // category's nav tab/IntersectionObserver target (`target`, set by
  // `config.ts`'s `init()`) — `useEmojiGrid`'s stripped-down
  // `CategoryGridEntry` doesn't carry that field, so it's resolved here
  // straight from the raw `Data.value.categories`.
  const raw = Data.value?.categories.find((category) => category.id === categoryId)
  return raw?.target?.id ?? categoryId
}

const previewPositionNone = computed(() => props.previewPosition == 'none')
const emojiButtonRadius = computed(() => String(props.emojiButtonRadius))
const showSkinToneInSearch = computed(
  () => props.previewPosition == 'none' || props.skinTonePosition == 'search',
)
const showSkinToneInPreview = computed(() => props.skinTonePosition == 'preview')
const skinLabels = computed(() => I18n.value?.skins ?? {})
const skinsChoose = computed(() => (I18n.value?.skins?.choose as string) ?? '')

const skinsPosition = computed(() => {
  if (!showSkins.value) return { style: {} as Record<string, string | number>, dataPosition: 'bottom' as const }

  const button = skinToneButtonRef.value
  const root = rootRef.value
  if (!button || !root) return { style: {}, dataPosition: 'bottom' as const }

  const buttonRect = button.getBoundingClientRect()
  const baseRect = root.getBoundingClientRect()
  const style: Record<string, string | number> = {}

  if (dir.value == 'ltr') {
    style.right = baseRect.right - buttonRect.right - 3
  } else {
    style.left = buttonRect.left - baseRect.left - 3
  }

  let dataPosition: 'top' | 'bottom' = 'bottom'
  if (props.previewPosition == 'bottom' && props.skinTonePosition == 'preview') {
    style.bottom = baseRect.bottom - buttonRect.top + 6
  } else {
    style.top = buttonRect.bottom - baseRect.top + 3
    style.bottom = 'auto'
    dataPosition = 'top'
  }

  return { style, dataPosition }
})

const searchBindings = computed(() => ({
  dir: dir.value,
  placeholder: I18n.value?.search ?? '',
  hasSearchResults: !!searchResults.value,
  showSkinTone: showSkinToneInSearch.value,
  skin: skin.value,
  choose: skinsChoose.value,
  showSkins: !!showSkins.value,
  registerInputRef: bindSearchInputRef,
  registerSkinToneButtonRef: bindSkinToneButtonRef,
}))

const previewBindings = computed(() => ({
  emoji: activeEmoji.value,
  noSearchResults: noSearchResults.value,
  dir: dir.value,
  previewPosition: props.previewPosition,
  emojiButtonSize: props.emojiButtonSize,
  set: props.set,
  skin: tempSkin.value || skin.value,
  getSpritesheetURL: props.getSpritesheetURL,
  noResultsEmoji: props.noResultsEmoji,
  previewEmoji: props.previewEmoji,
  pick: I18n.value?.pick ?? '',
  searchNoResults1: I18n.value?.search_no_results_1 ?? '',
  searchNoResults2: I18n.value?.search_no_results_2 ?? '',
  showSkinTone: !activeEmoji.value && showSkinToneInPreview.value,
  choose: skinsChoose.value,
  showSkins: !!showSkins.value,
  registerSkinToneButtonRef: bindSkinToneButtonRef,
}))

const navBindings = computed(() => ({
  categories: navCategories.value,
  icons: props.icons,
  theme: theme.value,
  dir: dir.value,
  unfocused: !!searchResults.value,
  activeCategoryId: activeCategoryId.value,
}))

const lineWidth = computed(() => props.perLine * props.emojiButtonSize)

type RefTarget = Element | ComponentPublicInstance | null

function bindSkinToneButtonRef(el: RefTarget): void {
  skinToneButtonRef.value = el as HTMLElement | null
}
function bindMenuRef(el: RefTarget): void {
  menuRef.value = el as HTMLElement | null
}
function bindCheckedRadioRef(el: RefTarget): void {
  checkedRadioEl = el as HTMLElement | null
}
function bindSearchInputRef(el: RefTarget): void {
  searchInputRef.value = el as HTMLInputElement | null
}
function bindSearchContainer(el: RefTarget): void {
  searchContainerRef.value = el as HTMLElement | null
}

function handleEmojiOver(next?: [number, number]): void {
  if (mouseIsIgnored || showSkins.value) return
  pos.value = next || [-1, -1]
  keyboard.value = false
}

function selectEmoji(emoji: AugmentedEmoji, e: Event): void {
  const emojiData = getEmojiData(emoji, { skinIndex: skin.value - 1 })

  if (props.maxFrequentRows) {
    FrequentlyUsed.add(emojiData)
  }

  props.onEmojiSelect?.(emojiData, e)
  emit('select', emojiData, e)
}

provide(PICKER_GRID_CONTEXT, { pos, keyboard, onEmojiOver: handleEmojiOver, onEmojiClick: selectEmoji })

function handleCategoryClick(category: AugmentedCategory, i: number): void {
  if (i == 0) {
    scrollTo({ row: -1, grid: grid.value })
  } else {
    scrollTo({ categoryId: category.id, grid: grid.value })
  }
}

function handleSearchClick(): void {
  handleSearchClickResult((p) => getEmojiByPos(p as [number, number], searchResults.value))
}

function handleSearchKeydown(e: KeyboardEvent): void {
  const input = e.currentTarget as HTMLInputElement
  e.stopImmediatePropagation()

  switch (e.key) {
    case 'ArrowLeft':
      navigate({ e, input, grid: activeGrid.value, left: true })
      break
    case 'ArrowRight':
      navigate({ e, input, grid: activeGrid.value, right: true })
      break
    case 'ArrowUp':
      navigate({ e, input, grid: activeGrid.value, up: true })
      break
    case 'ArrowDown':
      navigate({ e, input, grid: activeGrid.value, down: true })
      break
    case 'Enter': {
      e.preventDefault()
      const emoji = getEmojiByPos(pos.value, searchResults.value)
      if (emoji) selectEmoji(emoji, e)
      break
    }
    case 'Escape':
      e.preventDefault()
      if (searchResults.value) {
        clearSearch()
      } else {
        searchInputRef.value?.blur()
      }
      break
    default:
      break
  }
}

function handleOpenSkins(e: MouseEvent): void {
  void openSkins(e)
}

function handleDocumentClick(e: MouseEvent): void {
  if (e.target !== rootRef.value) {
    if (showSkins.value) closeSkins()
    props.onClickOutside?.(e)
    emit('click-outside', e)
  }
}

function buildInitOptions(): InitOptions {
  return {
    data: props.data,
    i18n: props.i18n,
    emojiVersion: props.emojiVersion,
    set: props.set,
    locale: props.locale,
    categories: props.categories,
    categoryIcons: props.categoryIcons,
    custom: props.custom,
    exceptEmojis: props.exceptEmojis,
    maxFrequentRows: props.maxFrequentRows,
    perLine: props.perLine,
    noCountryFlags: props.noCountryFlags,
  }
}

async function restartObservers(): Promise<void> {
  await nextTick()
  stopRows()
  stopCategories()
  startCategories()
  startRows()
}

const navKey = computed(() => categories.value.map((category) => category.id).join(','))
watch(navKey, () => {
  if (scrollRef.value) scrollRef.value.scrollTop = 0
  void restartObservers()
})
watch(perLine, () => {
  void restartObservers()
})
watch(
  () => props.theme,
  () => initTheme(),
)
watch(
  () => props.skin,
  (nextSkin) => {
    skin.value = Store.get<number>('skin') || nextSkin
  },
)
watch(
  () => [props.custom, props.categories],
  () => {
    void init(buildInitOptions())
  },
  { deep: true },
)

onMounted(async () => {
  initTheme()
  await init(buildInitOptions())
  await restartObservers()

  document.addEventListener('click', handleDocumentClick)

  if (props.autoFocus) {
    searchInputRef.value?.focus()
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <section
    id="root"
    ref="rootRef"
    class="em-emoji-picker flex flex-column"
    :dir="dir"
    :style="{
      width: props.dynamicWidth ? '100%' : `calc(${lineWidth}px + (var(--padding) + var(--sidebar-width)))`,
    }"
    :data-emoji-set="props.set"
    :data-theme="theme"
    :data-menu="showSkins ? '' : undefined"
  >
    <template v-if="ready">
      <PickerPreview v-if="props.previewPosition == 'top'" v-bind="previewBindings" @open-skins="handleOpenSkins" />

      <PickerNavigation v-if="props.navPosition == 'top'" v-bind="navBindings" position="top" @category-click="handleCategoryClick" />

      <div v-if="effectiveSearchPosition == 'sticky'" class="padding-lr">
        <PickerSearch
          v-bind="searchBindings"
          @click="handleSearchClick"
          @input="handleSearchInput"
          @keydown="handleSearchKeydown"
          @clear="clearSearch"
          @open-skins="handleOpenSkins"
        />
      </div>

      <div ref="scrollRef" class="scroll flex-grow padding-lr">
        <div :style="{ width: props.dynamicWidth ? '100%' : lineWidth, height: '100%' }">
          <PickerSearch
            v-if="effectiveSearchPosition == 'static'"
            v-bind="searchBindings"
            @click="handleSearchClick"
            @input="handleSearchInput"
            @keydown="handleSearchKeydown"
            @clear="clearSearch"
            @open-skins="handleOpenSkins"
          />

          <PickerEmojiGrid
            :dir="dir"
            :search-results="searchResults"
            :categories="categories"
            :grid="grid"
            :per-line="perLine"
            :emoji-button-size="props.emojiButtonSize"
            :emoji-size="props.emojiSize"
            :emoji-button-radius="emojiButtonRadius"
            :emoji-button-colors="props.emojiButtonColors"
            :skin="tempSkin || skin"
            :set="props.set"
            :getSpritesheetURL="props.getSpritesheetURL"
            :preview-position-none="previewPositionNone"
            :on-add-custom-emoji="props.onAddCustomEmoji"
            :is-row-visible="isRowVisible"
            :register-row-sentinel="registerRowSentinel"
            :register-category-root="registerCategoryRoot"
            :category-data-id="categoryDataId"
            :register-search-container="bindSearchContainer"
          />
        </div>
      </div>

      <PickerNavigation v-if="props.navPosition == 'bottom'" v-bind="navBindings" position="bottom" @category-click="handleCategoryClick" />

      <PickerPreview v-if="props.previewPosition == 'bottom'" v-bind="previewBindings" @open-skins="handleOpenSkins" />

      <PickerSkinTones
        v-if="showSkins"
        :dir="dir"
        :choose="skinsChoose"
        :skin-labels="skinLabels"
        :skin="skin"
        :position="skinsPosition.style"
        :data-position="skinsPosition.dataPosition"
        :register-menu-ref="bindMenuRef"
        :register-checked-radio-ref="bindCheckedRadioRef"
        @hover="handleSkinMouseOver"
        @select="handleSkinClick"
      />

      <PickerLiveRegion :text="activeEmoji ? activeEmoji.name : ''" />
    </template>
  </section>
</template>

<style lang="scss">
/*
 * Extraído para o build padrão (não custom-element): permite que
 * `import { Picker } from '@vue-emoji-mart/core'` chegue estilizado sem que
 * o consumidor precise importar o SCSS fonte manualmente. O custom element
 * (`custom-element.ts`) continua injetando a mesma folha via `?inline` +
 * `adoptedStyleSheets`, então este bloco não é scoped (precisa casar com o
 * seletor `#root` de `picker.scss`, não com um hash de componente).
 */
@use '../styles/picker.scss';
</style>
