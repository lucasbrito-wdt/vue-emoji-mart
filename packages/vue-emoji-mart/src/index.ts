export { default as Picker } from './components/Picker.vue'
export { default as Emoji } from './components/Emoji.vue'
// Custom element registration (`em-emoji-picker`, `em-emoji`) lives in
// `./custom-element.ts` and is intentionally not exported from here (the
// original only registers it as a side effect of importing `PickerElement`);
// consumers opt in with `import '@vue-emoji-mart/core/custom-element'` (or
// the package's dedicated entry point once wired into `vite.config.ts`).

export { FrequentlyUsed, SafeFlags, SearchIndex, Store, NativeSupport } from './helpers'

export { init, Data, I18n, getProps, getProp } from './config'
export type { InitOptions } from './config'

export { getEmojiDataFromNative, getEmojiData, deepEqual, sleep } from './utils'

export {
  useEmojiGrid,
  useDynamicPerLine,
  useCategoryObserver,
  useRowVirtualizer,
  useSearch,
  useKeyboardNav,
  useSkinTone,
  useTheme,
  ROWS_PER_RENDER,
} from './composables'

export { default as Icons } from './icons'

export * from './types'
