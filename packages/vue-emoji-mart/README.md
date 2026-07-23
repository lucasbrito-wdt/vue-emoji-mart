# @luquinhasbrito/vue-emoji-mart

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Vue 3](https://img.shields.io/badge/vue-3.x-42b883.svg?logo=vue.js&logoColor=white)](https://vuejs.org)

The Vue 3 emoji picker component, composables, and framework-agnostic helpers. A native port of [emoji-mart](https://github.com/missive/emoji-mart)'s `emoji-mart` package.

## Install

```bash
pnpm add @luquinhasbrito/vue-emoji-mart @luquinhasbrito/emoji-mart-data
```

`vue` `^3.5.0` is a peer dependency.

## Data

Emoji data is decoupled from the picker, so you control how and when it loads.

### Bundled

```ts
import data from '@luquinhasbrito/emoji-mart-data'
import { Picker } from '@luquinhasbrito/vue-emoji-mart'
```

### Fetched remotely

```ts
import { Picker } from '@luquinhasbrito/vue-emoji-mart'

const data = async () => {
  const response = await fetch('https://your-cdn.example.com/emoji-data.json')
  return response.json()
}
```

Pass either form directly as the `data` prop, or call `init({ data })` once per page load to share the dataset across every `<Picker>`/`<em-emoji-picker>` instance.

## Picker component

```vue
<script setup lang="ts">
import { Picker } from '@luquinhasbrito/vue-emoji-mart'
import '@luquinhasbrito/vue-emoji-mart/style.css'
import data from '@luquinhasbrito/emoji-mart-data'
import type { EmojiData } from '@luquinhasbrito/vue-emoji-mart'

function onSelect(emoji: EmojiData, event: Event) {
  console.log(emoji.native)
}
</script>

<template>
  <Picker
    :data="data"
    :perLine="9"
    theme="auto"
    @emoji-select="onSelect"
    @click-outside="() => console.log('closed')"
  />
</template>
```

### Props

| Prop | Type | Default | Choices |
| --- | --- | --- | --- |
| `data` | `unknown \| (() => Promise<unknown>)` | — | — |
| `i18n` | `unknown \| (() => Promise<unknown>)` | — | — |
| `categories` | `string[]` | — | `frequent`, `people`, `nature`, `foods`, `activity`, `places`, `objects`, `symbols`, `flags` |
| `categoryIcons` | `Record<string, unknown>` | — | — |
| `custom` | `AugmentedCategory[]` | — | — |
| `autoFocus` | `boolean` | `false` | — |
| `dynamicWidth` | `boolean` | `false` | — |
| `emojiButtonColors` | `string[]` | — | — |
| `emojiButtonRadius` | `string \| number` | `100%` | — |
| `emojiButtonSize` | `number` | `36` | — |
| `emojiSize` | `number` | `24` | — |
| `emojiVersion` | `number` | `15` | `1`, `2`, `3`, `4`, `5`, `11`, `12`, `12.1`, `13`, `13.1`, `14`, `15` |
| `exceptEmojis` | `string[]` | `[]` | — |
| `icons` | `string` | `auto` | `auto`, `outline`, `solid` |
| `locale` | `string` | `en` | `en`, `ar`, `be`, `cs`, `de`, `es`, `fa`, `fi`, `fr`, `hi`, `it`, `ja`, `ko`, `nl`, `pl`, `pt`, `ru`, `sa`, `tr`, `uk`, `vi`, `zh` |
| `maxFrequentRows` | `number` | `4` | — |
| `navPosition` | `string` | `top` | `top`, `bottom`, `none` |
| `noCountryFlags` | `boolean` | `false` | — |
| `noResultsEmoji` | `string` | — | — |
| `perLine` | `number` | `9` | — |
| `previewEmoji` | `string` | — | — |
| `previewPosition` | `string` | `bottom` | `top`, `bottom`, `none` |
| `searchPosition` | `string` | `sticky` | `sticky`, `static`, `none` |
| `set` | `string` | `native` | `native`, `apple`, `facebook`, `google`, `twitter` |
| `skin` | `number` | `1` | `1`, `2`, `3`, `4`, `5`, `6` |
| `skinTonePosition` | `string` | `preview` | `preview`, `search`, `none` |
| `theme` | `string` | `auto` | `auto`, `light`, `dark` |
| `getImageURL` | `(set: string, unified: string) => string` | — | — |
| `getSpritesheetURL` | `(set: string) => string` | — | — |

### Events

| Event | Payload | Description |
| --- | --- | --- |
| `emoji-select` (`onEmojiSelect`) | `(emoji: EmojiData, event: Event)` | Fired when an emoji is picked |
| `click-outside` (`onClickOutside`) | `(event: Event)` | Fired on an outside click |
| `add-custom-emoji` (`onAddCustomEmoji`) | `(event: Event)` | Fired by the "add custom emoji" button, shown only when this handler is bound and a search returns no results |

### Custom emojis

```ts
const custom = [
  {
    id: 'github',
    name: 'GitHub',
    emojis: [
      {
        id: 'octocat',
        name: 'Octocat',
        keywords: ['github'],
        skins: [{ src: './octocat.png' }],
      },
    ],
  },
]
```

```vue
<Picker :data="data" :custom="custom" />
```

## Emoji component

```vue
<script setup lang="ts">
import { Emoji } from '@luquinhasbrito/vue-emoji-mart'
</script>

<template>
  <Emoji id="+1" size="2em" />
  <Emoji id="+1" :skin="2" />
  <Emoji shortcodes=":+1::skin-tone-2:" />
</template>
```

| Prop | Description |
| --- | --- |
| `id` | An emoji ID, e.g. `+1` |
| `shortcodes` | An emoji shortcode, e.g. `:+1::skin-tone-2:` |
| `native` | A native emoji character |
| `size` | The inline element size (px number or CSS unit) |
| `fallback` | String rendered when the emoji can't be found |
| `set` | `native`, `apple`, `facebook`, `google`, `twitter` |
| `skin` | `1`–`6` |

## Custom element

```ts
import '@luquinhasbrito/vue-emoji-mart/custom-element'
import '@luquinhasbrito/vue-emoji-mart/style.css'
```

```html
<em-emoji-picker></em-emoji-picker>
<em-emoji id="+1" skin="2"></em-emoji>
```

Registered with Vue's native `defineCustomElement`, rendered inside a Shadow Root with styles scoped to the element — safe to drop into any framework or a plain HTML page.

## Headless search

```ts
import { init, SearchIndex } from '@luquinhasbrito/vue-emoji-mart'
import data from '@luquinhasbrito/emoji-mart-data'

await init({ data })

const results = await SearchIndex.search('christmas')
console.log(results.map((emoji) => emoji.skins[0].native))
// => ['🎄', '🧑‍🎄', '🔔', '🤶', '🎁', ...]
```

## Get emoji data from a native character

```ts
import { init, getEmojiDataFromNative } from '@luquinhasbrito/vue-emoji-mart'
import data from '@luquinhasbrito/emoji-mart-data'

await init({ data })

const emoji = await getEmojiDataFromNative('🤞🏿')
// { id: 'crossed_fingers', native: '🤞🏿', skin: 6, unified: '1f91e-1f3ff', ... }
```

## Themes

`theme` accepts `light`, `dark`, or `auto` (default). `auto` follows the `prefers-color-scheme` media query and updates reactively when the OS setting changes.

## Sets and data sources

`set` controls how emojis are rendered: `native` uses the OS's built-in emoji font (fastest, no images), while `apple`, `facebook`, `google`, and `twitter` render from spritesheets. Provide `getImageURL`/`getSpritesheetURL` to point at a self-hosted copy of `@luquinhasbrito/emoji-mart-data`'s sprite sheets instead of the default CDN.

## Internationalization

```ts
import i18n from '@luquinhasbrito/emoji-mart-data/i18n/pt.json'
```

```vue
<Picker :data="data" :i18n="i18n" />
```

English (`en`) is built in and doesn't need to be provided. See [`packages/data`](../data) for the full locale list.

## Exported helpers

| Export | Description |
| --- | --- |
| `Picker`, `Emoji` | Vue components |
| `init(options)` | Loads and caches `data`/`i18n` once per page |
| `Data`, `I18n` | `shallowRef`s exposing the loaded dataset |
| `SearchIndex` | `search`, `get`, `reset` — the emoji search index |
| `Store` | `localStorage`-backed preference storage (skin tone, frequently used) |
| `FrequentlyUsed` | Tracks and ranks recently picked emojis |
| `NativeSupport` | Canvas-based detection of native emoji rendering support |
| `getEmojiDataFromNative`, `getEmojiData`, `deepEqual`, `sleep` | Utility functions |
| `useEmojiGrid`, `useDynamicPerLine`, `useCategoryObserver`, `useRowVirtualizer`, `useSearch`, `useKeyboardNav`, `useSkinTone`, `useTheme` | Composables powering `<Picker>`, usable standalone for custom UIs |

## Development

From the monorepo root:

```bash
pnpm install
pnpm --filter @luquinhasbrito/vue-emoji-mart build
pnpm --filter @luquinhasbrito/vue-emoji-mart test
```

## License

MIT — see [`LICENSE`](../../LICENSE) at the repository root.
