import type { InjectionKey, Ref } from 'vue'
import type { AugmentedEmoji } from '../types/data'

/**
 * Shared "grid context" injected once by `Picker.vue` and consumed only by
 * `PickerEmojiButton.vue`. This is the Vue equivalent of the original's
 * `PureInlineComponent` + per-button listener strategy documented in the
 * port plan's performance table: `pos`/`keyboard` are refs read directly by
 * each button's own `selected` computed, so a hover/keyboard-nav change only
 * schedules an update for components that actually read `pos.value` —
 * `PickerCategoryRow.vue`/`Picker.vue` never subscribe to it, avoiding the
 * "re-render entire grid on hover" problem without event delegation.
 */
export interface PickerGridContext {
  pos: Ref<[number, number]>
  keyboard: Ref<boolean>
  onEmojiOver: (pos?: [number, number]) => void
  onEmojiClick: (emoji: AugmentedEmoji, event: Event) => void
}

export const PICKER_GRID_CONTEXT: InjectionKey<PickerGridContext> = Symbol('picker-grid-context')
