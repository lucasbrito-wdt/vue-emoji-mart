# Contributing to vue-emoji-mart

Thanks for taking the time to contribute. This document covers everything you need to get set up and send a useful pull request.

## Getting started

This is a pnpm workspace with two packages (`@luquinhasbrito/vue-emoji-mart`, `@luquinhasbrito/emoji-mart-data`) and one example app.

```bash
git clone https://github.com/lucasbrito/vue-emoji-mart.git
cd vue-emoji-mart
pnpm install
```

### Common commands

```bash
pnpm build          # build all packages
pnpm test           # run the Vitest suite across all packages
pnpm lint           # type-check all packages (vue-tsc --noEmit)
pnpm dev            # watch-build all packages

pnpm --filter @luquinhasbrito/vue-emoji-mart test     # scope any command to one package
pnpm --filter vite-demo dev                 # run the example app
```

## Project structure

```
vue-emoji-mart/
├── packages/
│   ├── vue-emoji-mart/        # @luquinhasbrito/vue-emoji-mart — Picker component, composables, helpers
│   │   ├── src/
│   │   │   ├── components/    # Picker.vue and its subcomponents
│   │   │   ├── composables/   # useEmojiGrid, useRowVirtualizer, useSearch, ...
│   │   │   ├── helpers/       # SearchIndex, Store, FrequentlyUsed, NativeSupport
│   │   │   ├── types/         # picker-props.ts, emoji-props.ts
│   │   │   └── styles/        # picker.scss, tokens.scss
│   │   └── __tests__/
│   └── data/                  # @luquinhasbrito/emoji-mart-data — emoji datasets and i18n
└── examples/vite-demo/        # manual QA app
```

Read [`vue-emoji-mart-port.md`](./vue-emoji-mart-port.md) for the full design rationale behind the port from the original Preact implementation, including the performance techniques each composable replicates.

## Coding conventions

- **Composition API only** — `<script setup lang="ts">`, no Options API.
- **Keep the dataset out of deep reactivity.** `Data`/`I18n` and any large emoji collections must stay in `shallowRef`, never `reactive` or `ref` with deep tracking — see `src/config.ts`.
- **Match the original's public API.** Prop names, defaults, and event names must stay in parity with `emoji-mart`'s `PickerProps`/`EmojiProps` unless a deviation is discussed in an issue first.
- **TypeScript strict mode.** Every exported function, component prop, and composable return value must be typed — no `any`.
- **Tests accompany behavior changes.** New composables or components need a corresponding file in `__tests__/`.
- Run `pnpm --filter <package> lint` (type-check) and `pnpm --filter <package> test` on any package you touch before opening a PR.

## Commit messages

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(picker): add support for custom skin tone default
fix(search-index): correct maxResults default
docs(readme): document custom-element usage
chore(deps): bump vite to 6.1
```

Common types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`.

## Pull request workflow

1. Fork the repository and create a branch off `main`.
2. Make your change, keeping it scoped to a single concern.
3. Add or update tests under `__tests__/` for any behavior change.
4. Run `pnpm lint` and `pnpm test` for the packages you touched.
5. Open a pull request using the provided template, describing the change and linking any related issue.
6. A maintainer will review and may request changes before merging.

## Reporting bugs and requesting features

Use the [issue templates](./.github/ISSUE_TEMPLATE) — they ask for the information needed to reproduce a bug or evaluate a feature request.

## Code of conduct

By participating in this project, you agree to abide by the [Code of Conduct](./CODE_OF_CONDUCT.md).
