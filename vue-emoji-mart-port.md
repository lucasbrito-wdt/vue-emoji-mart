# Port emoji-mart (Preact) para Vue 3 — vue-emoji-mart

## Overview

Recriar o emoji-mart (picker de emoji da Missive, hoje escrito em Preact/TSX,
~2.500 linhas em `packages/emoji-mart/src`) como uma biblioteca Vue 3.5 nativa,
mantendo paridade de API pública (props do `Picker`, `SearchIndex`, `init`,
`getEmojiDataFromNative`, i18n, sets de imagem, custom element via
`defineCustomElement`) e otimizando para alta performance: virtual scroll de
linhas, sem re-render por hover, dados grandes fora da reatividade profunda,
lazy fetch dos JSONs de dados.

Fonte lida integralmente:
- `emoji-mart/src/index.ts`, `config.ts`, `utils.ts`, `icons.tsx`
- `emoji-mart/src/helpers/{search-index,native-support,store,frequently-used}.ts`
- `emoji-mart/src/components/Picker/{Picker.tsx,PickerElement.tsx,PickerProps.ts,PickerStyles.scss}`
- `emoji-mart/src/components/{Navigation,Emoji,HTMLElement,HOCs}/*`
- `emoji-mart-data/{build.js,index.d.ts,package.json}` + `sets/*/*.json` + `i18n/*.json`

## Project Type

WEB (biblioteca de componente, framework-agnostic quanto a consumo, mas UI é Vue 3).
Agentes primários: `frontend-specialist` (build da lib Vue) e, para o pacote de
dados, tratamos como um pacote utilitário puro (sem UI) — sem `backend-specialist`
porque não há servidor: `packages/data` é só JSON + script de build Node.

## Success Criteria

- `packages/vue-emoji-mart` exporta um componente `<Picker>` (Composition API,
  `<script setup>`) com as mesmas props públicas do `PickerProps.ts` original
  (mesmos nomes, defaults e `choices`), incluindo `data`, `i18n`, `custom`,
  `categories`, `set`, `theme`, `skin`, `perLine`, `dynamicWidth`,
  `previewPosition`, `searchPosition`, `navPosition`, `skinTonePosition`,
  `getImageURL`, `getSpritesheetURL`, `onEmojiSelect` (evento `@select`),
  `onClickOutside` (evento `@click-outside`), `onAddCustomEmoji`.
- `SearchIndex.search/get/reset`, `init(options)`, `Data`/`I18n` reativos
  exportados, `getEmojiDataFromNative`, `FrequentlyUsed`, `Store`,
  `NativeSupport`, `SafeFlags` — todos portados 1:1 em `packages/vue-emoji-mart/src/helpers`.
- Custom element opcional `<em-emoji-picker>` via `defineCustomElement` +
  Shadow DOM com estilos injetados (equivalente a `PickerElement`/`ShadowElement`).
- Scroll com 1000+ emojis a 60fps: nenhuma linha fora do viewport (+ margem)
  é montada; nenhum evento de `mouseenter`/`mouseleave` dispara re-render de
  mais de 1 botão por vez (delegação de evento no container, não handler por botão).
- `packages/data` gera os mesmos JSONs de `emoji-mart-data` (sets, i18n,
  index.d.ts) via `pnpm --filter data build`, sem alterar o schema.
- Suite Vitest portada de `__tests__/{config,utils}.test.js` e
  `helpers/__tests__/*` passando (`pnpm test`).
- Bundle da lib buildado em modo library (Vite `build.lib`) com ESM + CJS +
  `.d.ts`, tree-shakeable (`sideEffects: false` exceto CSS/custom-element).

## Tech Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Monorepo | pnpm workspaces | já pedido; leve, sem necessidade de Turborepo pro escopo (2 pacotes) |
| UI framework | Vue 3.5 + `<script setup>` + TypeScript | Composition API dá controle fino de reatividade (shallowRef, watchEffect manual) exigido pra paridade de performance com Preact classComponent |
| Build da lib | Vite (`build.lib`, `vue-tsc` p/ types) | padrão de facto pra libs Vue, gera ESM/CJS/UMD + custom element build separado |
| Estilo | SCSS portado quase 1:1 de `PickerStyles.scss` | evita reescrever 532 linhas de CSS já testado visualmente |
| Testes | Vitest + `@vue/test-utils` + `happy-dom` | substitui Jest/Preact Testing Library original, mais rápido, já é o padrão do ecossistema Vite |
| Dados | `packages/data`: mesmo `build.js` (Node puro, sem dependência de framework) + JSONs versionados | dados são agnósticos de framework — não há motivo pra reescrever, só copiar/adaptar package.json e paths de import |
| Virtual scroll | Implementação própria baseada em `IntersectionObserver` (replica a técnica original), não uma lib terceira (`vue-virtual-scroller`) | o algoritmo original já é sofisticado (linhas fixas de 10 em 10, refs por linha, categorias com scroll-snap por `IntersectionObserver` duplo); reescrever com lib genérica quebraria o comportamento de navegação por teclado/scrollTo por categoria |
| Custom Element | `defineCustomElement` do Vue + Shadow DOM manual pra CSS | via API nativa do Vue, evita reimplementar `HTMLElement`/`ShadowElement` do zero |

## File Structure

```
vue-emoji-mart/
├── pnpm-workspace.yaml
├── package.json                       # root: scripts (build, test, dev) via pnpm -r
├── tsconfig.base.json
├── .gitignore
├── vue-emoji-mart-port.md             # este plano
│
├── packages/
│   ├── data/
│   │   ├── package.json               # @vue-emoji-mart/data
│   │   ├── build.js                   # port quase 1:1 de emoji-mart-data/build.js
│   │   ├── index.d.ts                 # port 1:1 de index.d.ts (EmojiMartData, Emoji, Skin, Sheet...)
│   │   ├── sets/                      # gerado pelo build.js (1,2,3,4,5,11,12,12.1,13,13.1,14,15 x 5 sets)
│   │   │   └── {version}/{set}.json
│   │   ├── i18n/                      # copiado 1:1 (21 locales + en)
│   │   │   └── {locale}.json
│   │   └── README.md
│   │
│   └── vue-emoji-mart/
│       ├── package.json               # @vue-emoji-mart/core (nome final a definir com usuário)
│       ├── vite.config.ts             # 2 builds: lib padrão (Picker.vue export) + custom-element
│       ├── vitest.config.ts
│       ├── tsconfig.json
│       ├── src/
│       │   ├── index.ts               # barrel: Picker, Emoji, SearchIndex, Store, FrequentlyUsed, init, Data, I18n, getEmojiDataFromNative
│       │   ├── custom-element.ts      # defineCustomElement(Picker) -> em-emoji-picker / em-emoji
│       │   ├── config.ts              # init(), getProps(), getProp() — Data/I18n como shallowRef exportados
│       │   ├── utils.ts               # deepEqual, sleep, getEmojiData, getEmojiDataFromNative
│       │   ├── icons.ts               # ports dos SVGs (funções que retornam string/h(), não JSX)
│       │   ├── types/
│       │   │   ├── picker-props.ts    # port de PickerProps.ts (defaults + choices), usado tanto p/ runtime quanto p/ defineProps
│       │   │   ├── emoji-props.ts
│       │   │   └── index.ts
│       │   ├── helpers/
│       │   │   ├── search-index.ts    # port 1:1 (função pura, sem estado Vue)
│       │   │   ├── native-support.ts  # port 1:1 (canvas-based detection)
│       │   │   ├── store.ts           # port 1:1 (localStorage wrapper)
│       │   │   ├── frequently-used.ts # port 1:1
│       │   │   └── index.ts
│       │   ├── composables/
│       │   │   ├── useEmojiGrid.ts    # substitui Picker.initGrid()/getPerLine() — grid + posinset + setsize
│       │   │   ├── useDynamicPerLine.ts # substitui initDynamicPerLine() — ResizeObserver -> perLine
│       │   │   ├── useCategoryObserver.ts # substitui observeCategories() — IntersectionObserver p/ Navigation ativa
│       │   │   ├── useRowVirtualizer.ts   # substitui observeRows() — IntersectionObserver p/ visibleRows (10 em 10)
│       │   │   ├── useSearch.ts       # substitui handleSearchInput/handleSearchClick/clearSearch
│       │   │   ├── useKeyboardNav.ts  # substitui navigate()/scrollTo() (ArrowKeys, Enter, Escape)
│       │   │   ├── useSkinTone.ts     # substitui openSkins/closeSkins/handleSkinClick/handleSkinMouseOver
│       │   │   └── useTheme.ts        # substitui initTheme()/darkMediaCallback (prefers-color-scheme)
│       │   ├── components/
│       │   │   ├── Picker.vue         # orquestrador — equivalente a Picker.tsx render()
│       │   │   ├── PickerSearch.vue    # equivalente a renderSearch()
│       │   │   ├── PickerPreview.vue   # equivalente a renderPreview()
│       │   │   ├── PickerNavigation.vue # port de Navigation.tsx (PureComponent -> v-memo/computed)
│       │   │   ├── PickerCategoryRow.vue # equivalente ao map de `rows` dentro de renderCategories() — unidade de virtualização
│       │   │   ├── PickerEmojiButton.vue # equivalente a renderEmojiButton() — SEM listeners individuais (ver Performance)
│       │   │   ├── PickerSkinTones.vue # equivalente a renderSkins()
│       │   │   ├── PickerLiveRegion.vue # equivalente a renderLiveRegion() (aria-live)
│       │   │   └── Emoji.vue           # port de Emoji.tsx (img / native span / spritesheet span)
│       │   └── styles/
│       │       ├── picker.scss         # port quase 1:1 de PickerStyles.scss (532 linhas)
│       │       └── tokens.scss         # variáveis CSS extraídas (cores, spacing) já presentes no scss original
│       │
│       └── __tests__/
│           ├── config.test.ts          # port de config.test.js
│           ├── utils.test.ts           # port de utils.test.js
│           ├── helpers/
│           │   ├── search-index.test.ts
│           │   ├── native-support.test.ts
│           │   ├── store.test.ts
│           │   └── frequently-used.test.ts
│           └── components/
│               ├── Picker.test.ts      # novo: monta Picker, valida grid/props (não existia no original)
│               └── Emoji.test.ts       # novo
│
└── examples/
    └── vite-demo/                      # app mínimo (não obrigatório, só p/ QA manual do agente frontend)
```

## Mapeamento arquivo-fonte -> arquivo-Vue

| Origem (Preact) | Destino (Vue) | Natureza |
|---|---|---|
| `emoji-mart-data/build.js`, `index.d.ts`, `sets/*`, `i18n/*` | `packages/data/*` | **port direto** (framework-agnostic, copiar e ajustar `package.json`/paths) |
| `src/config.ts` (`init`, `getProps`, `getProp`, `Data`, `I18n`) | `src/config.ts` | **port direto** da lógica; `Data`/`I18n` viram `shallowRef` exportados em vez de `let` module-level (ver Performance) |
| `src/utils.ts` | `src/utils.ts` | port direto (funções puras) |
| `src/icons.tsx` | `src/icons.ts` | port direto, troca JSX por strings SVG cruas ou `h()` (preferir strings + `v-html`/`innerHTML` estático, mais barato) |
| `src/helpers/search-index.ts` | `src/helpers/search-index.ts` | port direto (função pura, zero Preact) |
| `src/helpers/native-support.ts` | `src/helpers/native-support.ts` | port direto (canvas API, zero Preact) |
| `src/helpers/store.ts` | `src/helpers/store.ts` | port direto (localStorage) |
| `src/helpers/frequently-used.ts` | `src/helpers/frequently-used.ts` | port direto |
| `src/components/Picker/PickerProps.ts` | `src/types/picker-props.ts` | port direto dos defaults/choices; reused tanto para runtime `getProps` quanto para gerar `defineProps` com defaults |
| `src/components/Picker/Picker.tsx` (1135 linhas, classe) | `src/components/Picker.vue` + composables (`useEmojiGrid`, `useDynamicPerLine`, `useCategoryObserver`, `useRowVirtualizer`, `useSearch`, `useKeyboardNav`, `useSkinTone`, `useTheme`) + subcomponentes (`PickerSearch`, `PickerPreview`, `PickerNavigation`, `PickerCategoryRow`, `PickerEmojiButton`, `PickerSkinTones`, `PickerLiveRegion`) | **redesign estrutural, port funcional** — cada método da classe (`initGrid`, `observeRows`, `observeCategories`, `navigate`, `scrollTo`, `openSkins/closeSkins`, `handleSkinClick`, `initDynamicPerLine`, `handleSearchInput`) migra quase 1:1 em lógica para um composable equivalente; o `render()` gigante é quebrado em subcomponentes menores mas o algoritmo de grid/virtualização é preservado byte-a-byte |
| `src/components/Picker/PickerElement.tsx` | `src/custom-element.ts` | **redesign**: usa `defineCustomElement` nativo do Vue em vez do par `HTMLElement`/`ShadowElement` handwritten |
| `src/components/HTMLElement/HTMLElement.ts` + `ShadowElement.ts` | (eliminado) | **não portado** — Vue `defineCustomElement` já resolve `attributeChangedCallback`, Shadow DOM e reatividade de props; ver Riscos |
| `src/components/Navigation/Navigation.tsx` | `src/components/PickerNavigation.vue` | port direto da lógica (`renderIcon`, cálculo de `selectedCategoryIndex`, barra deslizante); `PureComponent` -> componente Vue puro com props readonly (reatividade fina do Vue já evita re-render desnecessário) |
| `src/components/Emoji/Emoji.tsx` + `EmojiElement.jsx` + `EmojiProps.ts` | `src/components/Emoji.vue` + `src/custom-element.ts` (registra `em-emoji` também) + `src/types/emoji-props.ts` | port direto da lógica de resolução de imagem/native/spritesheet |
| `src/components/HOCs/PureInlineComponent.ts` | (eliminado, substituído por `v-memo` no `PickerEmojiButton`) | **não portado** — Vue já oferece `v-memo`/render fino via `computed`, dispensa HOC memoization manual |
| `src/components/Picker/PickerStyles.scss` | `src/styles/picker.scss` | port quase 1:1 (mesmas classes: `.category`, `.row`, `.menu`, `.skin-tone`, seletores `[data-*]`) — só remove dependências de Shadow DOM específicas do Preact se houver |
| `src/index.ts` | `src/index.ts` | port direto do barrel de exports públicos |
| `src/__tests__/*.test.js`, `src/helpers/__tests__/*.test.js` | `__tests__/**/*.test.ts` | port direto (Jest -> Vitest, troca de runner apenas) |

## Task Breakdown

Convenção: `[P0]`..`[P3]` = prioridade/fase; `(||)` = pode rodar em paralelo com outras tasks marcadas `(||)` na mesma fase; `->` = depende de.

### Fase 0 — Scaffolding (bloqueante para tudo)

- **T0.1** `database-architect`: N/A (sem banco de dados neste projeto — pular).
- **T0.1** `frontend-specialist`: Criar monorepo (`pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`, `.gitignore`).
  INPUT: estrutura acima. OUTPUT: workspace instalável (`pnpm install` roda sem erro).
  VERIFY: `pnpm -r ls` lista os 2 pacotes.

### Fase 1 — Dados (P0, paralelizável com P1 depois que P0 termina)

- **T1.1** `frontend-specialist` (ou agente genérico de dados, não há `database-architect` aplicável — é JSON estático, não schema de banco): Portar `packages/data`
  (`build.js`, `index.d.ts`, `package.json`, copiar `sets/*` e `i18n/*` de
  `emoji-mart-data`). -> depende de T0.1.
  INPUT: `emoji-mart-data/*`. OUTPUT: `pnpm --filter data build` gera os mesmos
  JSONs (diff vazio contra o original, exceto path).
  VERIFY: `diff -rq packages/data/sets emoji-mart-data/sets` sem diferenças de conteúdo.

- **T1.2** (||, depende de T1.1) `frontend-specialist`: Portar `types/picker-props.ts`,
  `types/emoji-props.ts` a partir de `PickerProps.ts`/`EmojiProps.ts`.
  VERIFY: `tsc --noEmit` limpo nesses arquivos.

### Fase 2 — Core lógico sem UI (P0/P1, todas paralelizáveis entre si após T1.1)

Todas as tasks abaixo são portas de funções puras — podem rodar em paralelo
por serem arquivos independentes sem interdependência forte:

- **T2.1** (||) `frontend-specialist`: Portar `utils.ts` (`deepEqual`, `sleep`,
  `getEmojiData`, `getEmojiDataFromNative`).
  VERIFY: `__tests__/utils.test.ts` (portado de `utils.test.js`) passa.
- **T2.2** (||) `frontend-specialist`: Portar `helpers/search-index.ts`.
  VERIFY: `__tests__/helpers/search-index.test.ts` passa.
- **T2.3** (||) `frontend-specialist`: Portar `helpers/native-support.ts`.
  VERIFY: `__tests__/helpers/native-support.test.ts` passa (mock de `document`/canvas via happy-dom).
- **T2.4** (||) `frontend-specialist`: Portar `helpers/store.ts`.
  VERIFY: `__tests__/helpers/store.test.ts` passa.
- **T2.5** (||) `frontend-specialist`: Portar `helpers/frequently-used.ts`.
  VERIFY: `__tests__/helpers/frequently-used.test.ts` passa.
- **T2.6** (||) `frontend-specialist`: Portar `icons.ts` (SVGs como strings/const).
  VERIFY: import sem erro de tipo; snapshot visual manual não necessário (SVG estático).

- **T2.7** (depende de T1.2, T2.1-T2.5) `frontend-specialist`: Portar `config.ts`
  (`init`, `getProps`, `getProp`, `Data`/`I18n` como `shallowRef`).
  VERIFY: `__tests__/config.test.ts` (portado de `config.test.js`) passa;
  `init({ data: mockData })` resolve e popula `Data.value.categories`.

### Fase 3 — Composables de comportamento do Picker (depende de T2.7, paralelizáveis entre si)

- **T3.1** (||) `frontend-specialist`: `useEmojiGrid` (porta `initGrid`/`getPerLine`/`getEmojiByPos`).
  VERIFY: teste unitário — grid gerado bate em tamanho/posinset com fixture de categorias.
- **T3.2** (||) `frontend-specialist`: `useDynamicPerLine` (porta `initDynamicPerLine`, ResizeObserver).
  VERIFY: teste com ResizeObserver mockado dispara recálculo de `perLine`.
- **T3.3** (||) `frontend-specialist`: `useRowVirtualizer` (porta `observeRows`, `visibleRows`, `rowsPerRender = 10`).
  VERIFY: teste com IntersectionObserver mockado — linhas fora do viewport não aparecem em `visibleRows`.
- **T3.4** (||) `frontend-specialist`: `useCategoryObserver` (porta `observeCategories` -> categoria ativa na Navigation).
  VERIFY: teste — ao simular interseção da categoria "nature", `activeCategoryId` muda.
- **T3.5** (||) `frontend-specialist`: `useSearch` (porta `handleSearchInput`/`handleSearchClick`/`clearSearch`, debouncing opcional).
  VERIFY: teste — digitar "cat" retorna grid de resultados via `SearchIndex.search`.
- **T3.6** (||) `frontend-specialist`: `useKeyboardNav` (porta `navigate`/`scrollTo`, Arrow keys, Enter, Escape).
  VERIFY: teste — sequência de ArrowRight/ArrowDown move `pos` conforme grid.
- **T3.7** (||) `frontend-specialist`: `useSkinTone` (porta `openSkins`/`closeSkins`/`handleSkinClick`/`handleSkinMouseOver`).
  VERIFY: teste — clique em skin 3 atualiza `Store.set('skin', 3)`.
- **T3.8** (||) `frontend-specialist`: `useTheme` (porta `initTheme`/`darkMediaCallback`, `matchMedia`).
  VERIFY: teste — mock de `matchMedia` com `prefers-color-scheme: dark` resulta em `theme === 'dark'`.

### Fase 4 — Componentes Vue (depende de Fase 3; alguns paralelizáveis)

- **T4.1** (depende de T2.7) `frontend-specialist`: `Emoji.vue` (porta `Emoji.tsx`: resolução
  de `imageSrc`/native/spritesheet).
  VERIFY: `__tests__/components/Emoji.test.ts` — snapshot com `set=native` renderiza `<span>` com caractere nativo; `set=apple` renderiza `<img>`.
- **T4.2** (|| com T4.1, depende de T3.1-T3.8) `frontend-specialist`: `PickerEmojiButton.vue`
  (porta `renderEmojiButton`, usa `Emoji.vue`).
  VERIFY: teste — clique dispara `emit('select', emojiData)`; hover NÃO dispara re-render de outros botões (checar via contagem de render).
- **T4.3** (|| com T4.2) `frontend-specialist`: `PickerNavigation.vue` (porta `Navigation.tsx`).
  VERIFY: teste — categoria ativa reflete prop `activeCategoryId`; clique emite `category-click`.
- **T4.4** (|| com T4.2) `frontend-specialist`: `PickerSearch.vue` (porta `renderSearch`).
  VERIFY: teste — input dispara `useSearch`; botão clear aparece só com `searchResults` setado.
- **T4.5** (|| com T4.2) `frontend-specialist`: `PickerPreview.vue` (porta `renderPreview`).
- **T4.6** (|| com T4.2) `frontend-specialist`: `PickerSkinTones.vue` (porta `renderSkins`, popover de 6 opções).
- **T4.7** (|| com T4.2) `frontend-specialist`: `PickerLiveRegion.vue` (porta `renderLiveRegion`, `aria-live`).
- **T4.8** (depende de T3.1, T3.3) `frontend-specialist`: `PickerCategoryRow.vue`
  (unidade de virtualização — substitui o `rows.map` inline do original).
  VERIFY: teste — linha fora do viewport (mockado) não monta `PickerEmojiButton` filhos.

- **T4.9** (depende de T4.1-T4.8) `frontend-specialist`: `Picker.vue` orquestrador
  (compõe subcomponentes, replica `render()` final: ordem preview/nav/search/scroll conforme props de posição).
  VERIFY: teste de integração — montar com `data` mockado, `perLine=9`, validar
  contagem de botões renderizados == soma de emojis visíveis; navegação por
  teclado move seleção; `onEmojiSelect` chamado ao Enter.

### Fase 5 — Estilo e Custom Element (paralelizável com Fase 4 depois de T0.1)

- **T5.1** (||) `frontend-specialist`: Portar `PickerStyles.scss` -> `styles/picker.scss` + `tokens.scss`.
  VERIFY: visual QA manual (`examples/vite-demo`) — layout idêntico ao original nas 3 posições de preview/search/nav.
- **T5.2** (depende de T4.9, T5.1) `frontend-specialist`: `custom-element.ts`
  via `defineCustomElement(Picker, { styles: [pickerScss] })`, registra
  `em-emoji-picker` e `em-emoji`.
  VERIFY: `customElements.get('em-emoji-picker')` definido; montado em Shadow
  DOM isolado (estilos não vazam pro host).

### Fase 6 — Build & Barrel (depende de Fase 4 e 5)

- **T6.1** `frontend-specialist`: `src/index.ts` barrel + `vite.config.ts`
  (lib mode ESM/CJS + `.d.ts` via `vue-tsc`).
  VERIFY: `pnpm --filter vue-emoji-mart build` gera `dist/*.mjs`, `dist/*.cjs`, `dist/*.d.ts` sem erro.

### Fase 7 — Testes finais e QA

- **T7.1** `test-engineer`: Rodar suite completa Vitest (`pnpm -r test`), revisar
  cobertura de `helpers/` (deve ter paridade com testes originais) e dos
  composables/componentes novos criados na Fase 3-4.
  VERIFY: todos os testes verdes; nenhum teste `.skip` sem justificativa (o
  original tinha `store.test.js` com `test.skip`, decidir se implementa ou mantém skip documentado).
- **T7.2** `performance-optimizer`: Validar que scroll com dataset completo
  (categorias nativas, ~1900 emojis) não excede orçamento de frame; validar
  que hover não causa re-render em cascata (Vue devtools / `console.count` em dev).
  VERIFY: relatório sem re-render fora do botão hoverado; scroll fluido a 1000+ emojis.

## Decisões de Performance (como o original evita re-render e como replicar)

| Técnica no original (Preact) | Onde | Replicação em Vue 3 |
|---|---|---|
| `visibleRows` state + `IntersectionObserver` com `rootMargin` de ±(rowsPerRender+5) linhas — só linhas próximas do viewport são montadas; linhas "de referência" (1 a cada 10) recebem `createRef()` real, as outras `{}` (ref falso, nunca observado individualmente) | `Picker.tsx` `observeRows()`, `initGrid()` | `useRowVirtualizer` composable com `IntersectionObserver` nativo apontando pro container `.scroll`; estado `visibleRows` como `reactive(Set<number>)` (não array/objeto grande) para lookup O(1); só 1 em cada `rowsPerRender=10` linhas vira "sentinela" observada, replicando exatamente a proporção original de custo/precisão |
| `PureInlineComponent` (HOC com `shouldComponentUpdate` manual comparando só `selected`, `skin`, `size`) envolve cada botão de emoji pra evitar re-render em cascata quando o `Picker` re-renderiza inteiro | `renderEmojiButton()` | `v-memo="[selected, skin, size]"` no `<button>` de `PickerEmojiButton.vue` — equivalente direto e nativo do Vue, sem HOC |
| Delegação de hover: `onMouseEnter`/`onMouseLeave` por botão só chama `setState({pos})` no componente pai (`Picker`), que por sua vez só re-renderiza o botão cujo `pos` mudou (porque os outros são `PureInlineComponent` e comparam `selected` via `deepEqual([p1,p2])`) — ou seja, elimina-se o "re-render de todos os botões" pelo memoization, não pela ausência de listener | `handleEmojiOver`, `renderEmojiButton` | Mesma estratégia: cada `PickerEmojiButton` mantém seu próprio listener local mas a prop `selected` é um `computed` derivado comparando `pos` global (via `provide/inject` ou store leve) contra a própria posição; combinado com `v-memo`, Vue pula o re-render de VDOM de quem não mudou. Alternativa avaliada e descartada: delegação real de evento único no container (`@mouseover` no `.scroll`) — mais próxima do "zero listener por botão", mas perde `aria`/foco nativo por botão; decisão: manter paridade com o original (listener por botão + memo), documentar a alternativa como otimização futura se profiling mostrar necessidade |
| `Data`/`I18n` como variáveis module-level (fora de qualquer reatividade Preact) — nunca disparam re-render ao serem populadas, só o `Picker` decide quando re-renderizar via `setState` | `config.ts` | `shallowRef` (não `ref`/`reactive`) para `Data`/`I18n` — evita proxy profundo em milhares de objetos de emoji; componentes leem `Data.value.categories` uma vez em `computed`, nunca fazem watch profundo do objeto inteiro |
| Grid pré-computado uma única vez em `initGrid()` (não recalculado a cada render) — recalculado só quando `categories`/`custom`/resize mudam | `initGrid()` | `useEmojiGrid` expõe `grid` como resultado de um `computed` cujas dependências são só `perLine` e a lista (imutável) `Data.value.categories` — Vue já memoiza automaticamente, replicando o comportamento "computa uma vez, invalida só quando necessário" |
| `PureComponent` na `Navigation` (evita re-render a cada tecla digitada na busca, já que só state relevante é `categoryId`) | `Navigation.tsx` | Vue componente com props read-only + reatividade granular já evita isso por padrão (Vue só re-renderiza se prop usada no template mudar); reforçar com `v-memo="[activeCategoryId, theme]"` no root do componente |
| Refs por linha (`createRef()`) usados tanto pra IntersectionObserver quanto pra medir altura, evitando `getBoundingClientRect` em loop a cada scroll | `initGrid()`/`observeRows()` | Mesma técnica: `ref` do Vue por linha sentinela; altura de linha é constante (`emojiButtonSize`), evitando medição em runtime — port direto do cálculo `top: i * emojiButtonSize` |
| Sprite sheet único por `set` (não uma imagem por emoji) — `background-position` calculado a partir de `x`/`y` do dado + `Data.sheet.cols/rows` | `Emoji.tsx` | Port direto; manter `set` como parte da key do `computed` de `backgroundPosition` pra não recalcular à toa |
| Grid de busca reconstrói array plano só quando `searchResults` muda (não em cada keystroke se resultado for igual) | `handleSearchInput` | `useSearch` debounça levemente (opcional, o original não debounça mas o `SearchIndex.search` já é síncrono/rápido o bastante) e usa `shallowRef` pro grid de resultados |
| `dynamicWidth` usa 1 `ResizeObserver` só, desconectado e reconectado (`unobserve except`) pra não empilhar observers a cada resize | `initDynamicPerLine` | Port direto em `useDynamicPerLine`, usando `onUnmounted` do Vue pra garantir `disconnect()` (paridade com `componentWillUnmount`/`unregister`) |

## Riscos / Pontos de Atenção

1. **Shadow DOM + estilos**: o original injeta `PickerStyles` como `<style>`
   dentro do próprio Shadow Root (`ShadowElement.injectStyles`). Com
   `defineCustomElement` do Vue, o mecanismo de injeção de CSS é diferente
   (`styles` option do `defineCustomElement`, compilado do `<style>` do SFC).
   Risco: CSS com `@import` de fontes externas ou seletores que dependem de
   `:host`/`::slotted` pode não portar 1:1 — validar cada seletor do
   `PickerStyles.scss` (532 linhas) contra o suporte de `:host` do Vue
   custom element build. Mitigação: task dedicada de QA visual (T5.1) comparando
   lado a lado com o picker original antes de fechar a Fase 5.

2. **Delegação de eventos vs. paridade de comportamento**: o original NÃO faz
   delegação real de evento único — cada botão tem seu próprio
   `onMouseEnter`/`onMouseLeave`, mas evita custo via memoization agressiva
   (`PureInlineComponent`). Se o pedido do usuário for interpretado como
   "zero listener por botão", isso é uma mudança de arquitetura (event
   delegation real no container `.scroll` com `event.target.closest()`) que
   muda como foco/`tabindex="-1"`/roving tabindex funcionam. Decisão tomada:
   manter paridade functional com o original (listener por botão + `v-memo`)
   e registrar a delegação real como otimização opcional de Fase 7 caso o
   profiling (T7.2) mostre necessidade — não implementar preventivamente
   pra não introduzir regressão de acessibilidade sem medição.

3. **Sprite sheets — CDN hardcoded**: o original tem fallback pra
   `https://cdn.jsdelivr.net/npm/emoji-datasource-{set}@15.0.1/...` quando
   `getSpritesheetURL`/`getImageURL` não são passados. Isso é uma dependência
   de rede externa em produção — portar o mesmo default, mas documentar
   claramente na API pública (JSDoc) que passar `getSpritesheetURL` customizado
   é recomendado para uso offline/self-hosted. Nenhuma mudança de
   comportamento, só risco a comunicar.

4. **Frequently-used no localStorage**: chave `emoji-mart.{key}` no
   `window.localStorage`, com fallback silencioso (`try/catch` vazio) se
   indisponível (SSR, modo privado, quota excedida). Portar exatamente esse
   comportamento silencioso — não adicionar warnings novos que quebrem
   paridade, mas SIM adicionar guard extra `typeof window !== 'undefined'`
   já que Vue costuma rodar em contexto SSR (Nuxt) onde `window` não existe
   no primeiro render; o original assume DOM sempre presente (é uma lib
   client-only).

5. **`emoji-mart-data` como dependência externa vs. pacote portado**: decisão
   tomada de portar `packages/data` como pacote próprio no monorepo (não
   depender do pacote npm `@emoji-mart/data` original) para manter controle
   total do pipeline de build e evitar drift de versão. Risco: manutenção
   dobrada quando o upstream atualizar o Unicode CLDR/emoji version — mitigar
   documentando no README de `packages/data` como fazer merge de atualizações
   futuras do `build.js` original.

6. **`init()` é singleton global com `Promise` module-level** (`promise`,
   `initiated`, `initCallback`, `initialized` como variáveis de módulo, não
   por instância) — isso significa que múltiplos `<Picker>` na mesma página
   compartilham o mesmo `Data`/`I18n` carregado uma única vez (comportamento
   original, intencional para performance). Ao portar para Vue, resistir à
   tentação de "corrigir" isso com estado por-instância — quebraria a
   premissa de custo único de fetch para múltiplos pickers na mesma página.
   Documentar explicitamente essa decisão de design no JSDoc de `init()`.

7. **`getProp`/atributos de custom element com coerção de tipo** (`getProp`
   converte string de atributo HTML pro tipo do default: boolean, number,
   array via `constructor(value)`) é uma área frágil no original (`@ts-nocheck`
   em vários arquivos). Ao portar para `defineProps` do Vue, usar os
   `PickerProps`/`EmojiProps` portados como fonte única de verdade tanto para
   defaults do componente quanto para `attributeChangedCallback` do custom
   element, evitando duas implementações divergentes de coerção de tipo.

8. **Testes do original são majoritariamente `.skip` ou mínimos**
   (`store.test.js` é só `test.skip('', () => {})`). Ao portar, decidir com
   o usuário se a Fase 7 deve **escrever testes reais** para essas áreas
   (recomendado, já que é objetivo declarado "Testes com Vitest") ou apenas
   portar a estrutura — marcar como pergunta em aberto antes de fechar T7.1.

## Phase X — Verificação Final (executada pelos agentes implementadores, não nesta etapa de planejamento)

- [ ] Lint + typecheck passam (`pnpm -r lint`, `vue-tsc --noEmit` nos pacotes tocados)
- [ ] Security scan limpo (`skills/vulnerability-scanner/scripts/security_scan.py .`) — relevante por causa do `dangerouslySetInnerHTML`/`v-html` usado nos ícones SVG
- [ ] Build da lib com sucesso (`pnpm --filter vue-emoji-mart build`, ESM+CJS+d.ts)
- [ ] `pnpm --filter data build` gera JSONs idênticos ao `emoji-mart-data` original
- [ ] Suite Vitest completa verde (`pnpm -r test`)
- [ ] QA manual/E2E: `examples/vite-demo` — busca, navegação por teclado, troca de skin tone, scroll de 1900+ emojis, custom element em Shadow DOM, tema dark/light automático
- [ ] Nenhum hex code roxo/violeta introduzido (paleta segue tokens portados do original)
- [ ] Plano marcado como `PHASE X COMPLETE`
