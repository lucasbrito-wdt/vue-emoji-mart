import { defineCustomElement } from 'vue'

import Picker from './components/Picker.vue'
import Emoji from './components/Emoji.vue'
import pickerStyles from './styles/picker.scss?inline'

/**
 * Port of `PickerElement.tsx`/`EmojiElement.jsx`. Uses Vue's native
 * `defineCustomElement` + Shadow DOM instead of the original's hand-rolled
 * `HTMLElement`/`ShadowElement` pair (see port plan risk #1): attribute ->
 * prop type coercion (risk #7) is handled by Vue itself from the runtime
 * prop types the `defineProps<PickerPropsValues>()`/`defineProps<EmojiPropsValues>()`
 * compiler macros generate from the TS types in `Picker.vue`/`Emoji.vue` —
 * there is no second, hand-written coercion table to drift out of sync with.
 *
 * `init()`'s module-level singleton (see `config.ts`) still applies: every
 * `<em-emoji-picker>`/`<em-emoji>` instance on the page shares the same
 * `Data`/`I18n` fetch, by design.
 */
export const EmEmojiPicker = defineCustomElement(Picker, { styles: [pickerStyles] })
export const EmEmoji = defineCustomElement(Emoji)

if (typeof customElements !== 'undefined') {
  if (!customElements.get('em-emoji-picker')) {
    customElements.define('em-emoji-picker', EmEmojiPicker)
  }

  if (!customElements.get('em-emoji')) {
    customElements.define('em-emoji', EmEmoji)
  }
}
