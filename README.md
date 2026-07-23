<div align="center">

# vue-emoji-mart

**A fast, fully-typed emoji picker for Vue 3 — a native port of [emoji-mart](https://github.com/missive/emoji-mart).**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Vue 3](https://img.shields.io/badge/vue-3.x-42b883.svg?logo=vue.js&logoColor=white)](https://vuejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-f69220.svg?logo=pnpm&logoColor=white)](https://pnpm.io)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

[Live demo](https://lucasbrito-wdt.github.io/vue-emoji-mart/)

</div>

---

`vue-emoji-mart` brings the emoji picker used by [Missive](https://missiveapp.com) to the Vue 3 ecosystem, rebuilt from the ground up with the Composition API. It keeps the public API and visual design of the original library while replacing every internal performance trick — virtual scrolling, hover isolation, memoized rows — with idiomatic Vue equivalents.

## Features

- **Virtual scrolling** — rows are mounted and unmounted with `IntersectionObserver` as you scroll, so a 1,900+ emoji dataset never taxes the DOM.
- **Small footprint** — ~24 kB gzipped JS and ~2.9 kB gzipped CSS, no runtime dependencies beyond Vue and the data package.
- **Tree-shakeable** — import only `Picker` and `Emoji`, or bring in the framework-agnostic helpers (`SearchIndex`, `Store`, `FrequentlyUsed`) on their own.
- **Web Component support** — `<em-emoji-picker>` and `<em-emoji>` custom elements, built with Vue's native `defineCustomElement` and Shadow DOM.
- **Internationalization** — 22 bundled locales (see [`packages/data/i18n`](./packages/data/i18n)), with English built in by default.
- **Skin tones, frequently used, custom emoji** — full parity with the original picker's data model and callbacks.
- **Strict TypeScript** — every public prop, event, and helper is typed; `.d.ts` files are generated for both packages.
- **Automatic theming** — `light`, `dark`, or `auto` (follows `prefers-color-scheme`).

## Quick Start

### Install

```bash
pnpm add @luquinhasbrito/vue-emoji-mart @luquinhasbrito/emoji-mart-data
```

### As a component

```vue
<script setup lang="ts">
import { Picker } from '@luquinhasbrito/vue-emoji-mart'
import '@luquinhasbrito/vue-emoji-mart/style.css'
import data from '@luquinhasbrito/emoji-mart-data'

function onSelect(emoji: { native: string }) {
  console.log(emoji.native)
}
</script>

<template>
  <Picker :data="data" @emoji-select="onSelect" />
</template>
```

### As a custom element

```ts
import '@luquinhasbrito/vue-emoji-mart/custom-element'
import '@luquinhasbrito/vue-emoji-mart/style.css'
import data from '@luquinhasbrito/emoji-mart-data'
import { init } from '@luquinhasbrito/vue-emoji-mart'

init({ data })
```

```html
<em-emoji-picker></em-emoji-picker>
<em-emoji id="+1" size="2em"></em-emoji>
```

See [`packages/vue-emoji-mart/README.md`](./packages/vue-emoji-mart/README.md) for the full API, including headless search, `getEmojiDataFromNative`, and custom category icons.

## Props

The most commonly used `<Picker>` props — the full list lives in [`packages/vue-emoji-mart/README.md`](./packages/vue-emoji-mart/README.md#props).

| Prop | Default | Choices | Description |
| --- | --- | --- | --- |
| `data` | — | — | Emoji dataset, required (from `@luquinhasbrito/emoji-mart-data` or your own) |
| `set` | `native` | `native`, `apple`, `facebook`, `google`, `twitter` | Emoji rendering set; `native` is the most performant |
| `theme` | `auto` | `auto`, `light`, `dark` | Color theme |
| `locale` | `en` | 22 locales — see [`packages/data/i18n`](./packages/data/i18n) | UI language |
| `skin` | `1` | `1`–`6` | Default skin tone |
| `perLine` | `9` | — | Emojis per row |
| `dynamicWidth` | `false` | — | Compute `perLine` from the container width instead |
| `previewPosition` | `bottom` | `top`, `bottom`, `none` | Preview panel placement |
| `searchPosition` | `sticky` | `sticky`, `static`, `none` | Search input placement |
| `navPosition` | `top` | `top`, `bottom`, `none` | Category navigation placement |
| `skinTonePosition` | `preview` | `preview`, `search`, `none` | Skin tone selector placement |
| `custom` | — | — | Custom emoji categories |
| `onEmojiSelect` / `@emoji-select` | — | — | Fired when an emoji is picked |

## Performance

The port preserves every optimization from the original Preact implementation, translated into Vue primitives:

| Technique | How |
| --- | --- |
| Dataset outside deep reactivity | Emoji data lives in `shallowRef`, never `reactive`, so populating thousands of emoji objects doesn't walk a Proxy tree |
| Virtual scrolling | Rows mount only near the viewport via `IntersectionObserver`, with one observed "sentinel" row per 10-row bucket |
| Row memoization | `v-memo` on emoji buttons skips DOM patches when `selected`, `skin`, and `size` haven't changed |
| Precomputed grid | The emoji grid is a `computed()`, recalculated only when categories or `perLine` change — never per render |
| Single resize observer | `dynamicWidth` uses one `ResizeObserver`, disconnected on unmount, instead of stacking listeners |

## Monorepo structure

```
vue-emoji-mart/
├── packages/
│   ├── vue-emoji-mart/     # @luquinhasbrito/vue-emoji-mart — the Picker component, composables, and helpers
│   └── data/               # @luquinhasbrito/emoji-mart-data — emoji datasets and i18n locale files
└── examples/
    └── vite-demo/          # minimal Vite app for manual QA
```

## Credits

`vue-emoji-mart` is a Vue 3 port of [**emoji-mart**](https://github.com/missive/emoji-mart), created and maintained by the [Missive](https://missiveapp.com) team. All picker behavior, data schema, and visual design originate from their work — this project reimplements them for the Vue ecosystem. See [`LICENSE`](./LICENSE) for the preserved original copyright notice.

## Contributing

Contributions are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for setup instructions, coding conventions, and the pull request workflow.

## License

MIT — see [`LICENSE`](./LICENSE).
