# Auditoria de Performance — vue-emoji-mart (packages/vue-emoji-mart/src)

Auditoria read-only comparando a implementação Vue 3 contra a tabela de
técnicas de performance do plano (`vue-emoji-mart-port.md`, seção "Decisões
de Performance") e o original em Preact
(`emoji-mart-main/packages/emoji-mart/src/components/Picker/Picker.tsx`).

---

## 1. Dataset fora da reatividade profunda

**Status: correto, sem achados.**

- `src/config.ts:29-30` — `Data`/`I18n` são `shallowRef`, não `ref`/`reactive`.
  Evita o proxy profundo do Vue sobre milhares de objetos de emoji.
- `_init()` (`src/config.ts:93-315`) muta o objeto em lugar e chama
  `triggerRef(Data)`/`triggerRef(I18n)` uma única vez ao final — não há
  reatribuições intermediárias que disparariam notificações extras.
- `useEmojiGrid.ts:60-93` — `grid` é um `computed()`. Vue não faz
  `toReactive()` sobre o valor retornado por um `computed` (diferente de
  `ref(obj)`), então o array de linhas/emojis fica fora da reatividade
  profunda também nesse ponto — coerente com a decisão do plano.
- `useRowVirtualizer.ts:34` usa `reactive(new Set<number>())` para
  `visibleRowBuckets`. É um Set pequeno (uma entrada por bucket de 10 linhas,
  tipicamente <30 itens), o overhead do proxy é desprezível; não é um
  problema real, só vale registrar que um `shallowReactive` ou `ref(new
  Set())` com reatribuição teria o mesmo resultado sem proxy.

---

## 2. Virtual scroll real

**Grid principal: implementado corretamente.**

- `PickerEmojiGrid.vue:87-109` só monta `PickerCategoryRow` para as linhas do
  grid principal, e `PickerCategoryRow.vue:57` (`v-if="visible"`) não
  renderiza nenhum `PickerEmojiButton` filho quando a linha está fora do
  `isRowVisible()`. `useRowVirtualizer.ts:38-49` usa buckets de 10 linhas
  (`ROWS_PER_RENDER`, `useEmojiGrid.ts:25`) com apenas 1 sentinela real por
  bucket — replica fielmente a proporção custo/precisão do original
  (`rowIndex % Performance.rowsPerRender ? {} : createRef()` em
  `Picker.tsx:173`).
- `rootMargin` (`useRowVirtualizer.ts:79`) usa `emojiButtonSize *
  (rowsPerRender + 5)` acima e `emojiButtonSize * rowsPerRender` abaixo — dá
  margem de pré-render coerente com scroll rápido.

**Resultados de busca: NÃO são virtualizados** — `PickerEmojiGrid.vue:49-65`
renderiza todas as linhas/botões de `searchResults` de uma vez,
incondicionalmente, sem checar `isRowVisible`. Isso é **paridade 1:1 com o
original** (`Picker.tsx:846-880`, `renderSearchResults()`, mesmo padrão: `
searchResults.map(...)` sem verificação de visibilidade) — não é uma
regressão introduzida no port. O impacto prático é limitado porque
`SearchIndex.search()` já capa o resultado em `maxResults = 90`
(`src/helpers/search-index.ts:37,92-93`), então o pior caso é ~90 emojis
montados de uma vez (10 linhas a `perLine=9`), não 1900. Ainda assim, é uma
lacuna real de virtualização se algum consumidor da API pública aumentar
`maxResults` via `SearchIndex.search(value, { maxResults: N })` — o grid de
busca escala linearmente com N sem limite de montagem no DOM.
**Severidade: baixa** (parity intencional + resultado já limitado a 90).

---

## 3. Hover/preview — re-render isolado ou propagação para a grade toda?

- `PickerPreview.vue` não está no caminho do hover — `activeEmoji`
  (`Picker.vue:143`) e `previewBindings` (`Picker.vue:208-226`) são
  `computed`s dedicados que só a preview lê; a grade de botões não depende
  de `previewBindings`. Isolamento correto.
- O hover em si passa por `picker-context.ts` (`PICKER_GRID_CONTEXT`): `pos`
  é um `Ref` **compartilhado e injetado em todos os ~1800
  `PickerEmojiButton`** (`PickerEmojiButton.vue:37,42`). Cada botão tem seu
  próprio `computed selected = deepEqual(context.pos.value, props.pos)`
  (`PickerEmojiButton.vue:42`), então **toda vez que `pos` muda (hover ou
  teclado), a dependência reativa de `pos` é tocada em todos os botões
  montados simultaneamente** — não só no botão de origem e no botão de
  destino. O `v-memo="[selected, skin, emojiButtonSize]"`
  (`PickerEmojiButton.vue:64`) evita o *patch* de VDOM/DOM para os botões cujo
  array de memo não mudou, mas para chegar a essa comparação o Vue ainda
  precisa reavaliar `selected` (portanto o `computed` de cada botão) a cada
  hover — ou seja, o custo é O(botões montados) em recomputações de
  `computed`/dirty-check por hover, não O(1). Isso é **exatamente a mesma
  characterística do original** (`PureInlineComponent.shouldComponentUpdate`
  também roda para todo botão a cada `setState({pos})` do pai — ver
  `Picker.tsx` + comentário em `picker-context.ts:4-13`), então não é uma
  regressão de arquitetura, mas o comentário do código já reconhece esse
  trade-off. Para ~1800 emojis com virtualização ativa, o número de botões
  *montados* de fato (não o total do dataset) é o que importa — tipicamente
  algumas dezenas a poucas centenas dependendo do viewport/margem do
  `IntersectionObserver`, então o custo por hover é O(botões visíveis), não
  O(1800). Ainda assim, **vale medir com o profiler do Vue Devtools quantos
  `computed` recomputam por `mouseenter`** antes de fechar o objetivo "sem
  re-render fora do botão hoverado" da Fase 7 do plano, porque hoje a garantia
  vem inteiramente do `v-memo`, não da ausência de leitura do `pos`
  compartilhado.
  **Severidade: média** — funciona, mas o texto de "zero re-render fora do
  botão hoverado" do plano (linha 293 da tabela) é impreciso: o que existe é
  "zero *patch de DOM* fora do botão", não zero trabalho reativo.

---

## 4. v-memo / keys em PickerCategoryRow / PickerEmojiGrid — efetivos ou inócuos?

- `PickerEmojiButton.vue:64` — `v-memo="[selected, skin, emojiButtonSize]"`:
  efetivo pelas razões do item 3 (bloqueia o patch de DOM quando os 3 valores
  não mudam).
- `PickerCategoryRow.vue` **não usa `v-memo`** no elemento raiz (`<div
  :data-index="rowIndex" ...>`, linhas 51-56). Isso significa que, quando o
  Picker.vue re-renderiza por qualquer motivo que toque props passadas para
  baixo (ex.: `skin`, `tempSkin`, `theme`), toda `PickerCategoryRow`
  atualmente marcada `visible` reavalia seu template inteiro — inócuo hoje
  porque a maior parte das props (`row`, `top`, `isSentinel`, `perLine`,
  `setSize`, `emojiButtonSize` etc.) muda raramente, mas ainda assim o Vue
  precisa rodar o render da linha inteira (incluindo `paddedRow` computed,
  `PickerCategoryRow.vue:38-43`) sempre que qualquer prop object-like mudar
  de identidade — o que ocorre a cada troca de `skin`, por exemplo, já que
  `skin`/`tempSkin` mudam simultaneamente para todas as linhas.
  **Severidade: baixa** (o `v-memo` do botão filho já intercepta o custo
  real de DOM; faltar `v-memo` na linha só custa o re-run do `paddedRow`
  computed e a criação de vnodes intermediários, barato comparado ao patch).
- `PickerNavigation.vue:65` — `v-memo="[activeCategoryId, theme, unfocused,
  categories]"` inclui `categories` (array) na chave, mas **não inclui
  `icons`** (a prop `props.icons`, usada em `categoryIconSet()`,
  `PickerNavigation.vue:54-61`). Trocar `icons` em runtime (`auto` /
  `outline` / `solid`) não vai atualizar os ícones da navegação enquanto
  `activeCategoryId`/`theme`/`unfocused`/`categories` não mudarem também —
  bug de memoização (correção, não perf pura), mas nasce da mesma técnica
  auditada aqui. **Severidade: baixa** (prop raramente muda em runtime, mas
  é um `v-memo` "quase certo").
- `PickerEmojiGrid.vue` não tem `v-memo` próprio — é esperado, é só um
  container que repassa callbacks; nenhuma prop cara é recomputada nele além
  do que os filhos já memoizam.

---

## 5. Listener por botão de emoji vs. delegação (~1800 emojis)

- Confirmado: `PickerEmojiButton.vue:75-77` registra `@click`, `@mouseenter`,
  `@mouseleave` **por instância de botão**, sem delegação no container
  `.scroll`. Isso é a mesma decisão documentada no plano (linhas 315-325,
  "Riscos #2") — parity intencional com o original, que também não delega.
  Como a virtualização (item 2) já limita o número de botões *montados* a um
  subconjunto do viewport, o número real de listeners ativos ao mesmo tempo é
  proporcional a linhas visíveis × `perLine`, não a 1800. Não é um problema
  de escala hoje.
  **Severidade: informativo** — nenhuma ação recomendada; documentado como
  decisão consciente no plano, mantendo paridade de acessibilidade
  (`tabindex`/foco por botão).

---

## 6. useSearch — debounce? recria grade inteira?

- `useSearch.ts:46-82` (`handleInput`) **não debounça**: cada keystroke
  dispara `SearchIndex.search(value)` de forma síncrona/imediata e
  reconstrói o array `grid` inteiro do zero (`useSearch.ts:63-76`, loop
  `for (const emoji of results)`). Isso é igual ao original
  (`handleSearchInput` também chama `SearchIndex.search` sem debounce a cada
  tecla) — decisão de paridade documentada no plano (linha 300: "o original
  não debounça mas o `SearchIndex.search` já é síncrono/rápido o bastante").
  `SearchIndex.search` é assíncrono (`await SearchIndex.search(value)`,
  `useSearch.ts:51`) mas resolve rápido o bastante na prática (índice
  pré-construído, resultado limitado a `maxResults=90`).
- `searchResults` é `shallowRef` (`useSearch.ts:39`) — correto, evita
  proxying profundo dos ~90 resultados a cada tecla.
- Efeito colateral de não debouncar: como o item 3 mostra que resetar `pos`
  (`useSearch.ts:55,80`) também é lido por todo botão montado via o mesmo
  `PICKER_GRID_CONTEXT`, cada tecla digitada **também** dispara o mesmo
  fan-out de recomputação de `selected` em todos os botões da grade principal
  que ainda estão montados por trás da busca (mesmo escondidos via
  `display:none` em `PickerEmojiGrid.vue:70-76`, os `PickerCategoryRow`
  "visíveis" continuam montados e reagindo). **Severidade: baixa-média** —
  funcional, mas é trabalho reativo supérfluo em cada tecla digitada, sobre
  uma grade que está com `display: none` e portanto não seria visualmente
  observável de qualquer forma.

---

## 7. Bundle 24.4 kB gzip — algo desnecessário?

Medi o bundle real: `dist/vue-emoji-mart.js` (76 KB raw) gzipa para **23.86
KB** — bate com o número citado. Porém a auditoria do bundle revelou um
problema mais sério que o tamanho em si:

- **`vite.config.ts:6-9`** ainda traz o comentário "builds only the
  framework-agnostic core + composables for now (Picker.vue /
  custom-element.ts entries are added by the components wave)" e só declara
  **um** entry point (`src/index.ts`, formatos `es`/`cjs`). Isso está
  desatualizado: `Picker.vue` e os demais componentes (Fase 4/5 do plano) já
  existem e já são exportados por `src/index.ts:1-2` — mas `custom-element.ts`
  nunca é buildado como entry separado, e **nenhum CSS é extraído**: não
  existe `dist/style.css` (verificado — `ls dist/` não lista nenhum `.css`),
  apesar de `package.json:14` declarar o export `"./style.css":
  "./dist/style.css"`.
- **`Picker.vue` não tem bloco `<style>` e não importa
  `styles/picker.scss`/`tokens.scss` em lugar nenhum.** As 532 linhas de
  `styles/picker.scss` só são referenciadas em `custom-element.ts:5`
  (`import pickerStyles from './styles/picker.scss?inline'`), e
  `custom-element.ts` não é importado por `index.ts` nem é um entry do Vite.
  **Consequência prática: quem consome `import { Picker } from
  '@luquinhasbrito/vue-emoji-mart'` (o caso de uso padrão, não custom element) recebe
  o componente sem NENHUM CSS** — o picker renderiza funcionalmente
  quebrado/sem estilo a menos que o consumidor importe manualmente o SCSS
  fonte (`packages/vue-emoji-mart/src/styles/picker.scss`), contornando o
  pacote publicado. Isso não é "peso desnecessário no bundle", é o oposto:
  **o bundle está incompleto** e o número de 24.4 kB gzip mede um artefato
  que não inclui a folha de estilo que o picker precisa para ser usável.
  **Severidade: alta** — trata-se de build/completude, mas afeta diretamente
  a métrica de bundle pedida na auditoria e bloqueia o critério de sucesso do
  plano ("Bundle da lib buildado... tree-shakeable").
- Dentro do que É buildado, não há gordura óbvia: ícones SVG (`icons.ts`) são
  strings estáticas (baratas, sem VNode overhead, ver comentário
  `icons.ts:1-7`), sem dependência de ícone externa (lucide, heroicons etc.).
  `dependencies` do `package.json` é só `@luquinhasbrito/emoji-mart-data` (workspace,
  dados sob demanda) — nenhuma lib de terceiro pesada (ex.: sem
  `vue-virtual-scroller`, conforme decisão do plano). `vue-tsc --noEmit`
  não gera `.d.ts` no `dist/` atual (não há `index.d.ts` em `dist/`) —
  segundo achado de build incompleto, fora do escopo estrito de performance
  mas correlato ao mesmo `vite.config.ts` desatualizado.

---

## 8. defineCustomElement — duplicação de estilos por instância?

- `custom-element.ts:20` — `defineCustomElement(Picker, { styles:
  [pickerStyles] })` injeta a mesma string de 532 linhas de CSS por
  definição de elemento (não por instância — é compartilhada na definição do
  Custom Element registrado uma vez via `customElements.define`,
  `custom-element.ts:24-30`). O Vue 3.5 aplica essas `styles` via
  `adoptedStyleSheets` quando o navegador suporta (Constructable
  Stylesheets), o que deduplica o objeto `CSSStyleSheet` entre instâncias do
  mesmo Custom Element — múltiplos `<em-emoji-picker>` na mesma página não
  deveriam multiplicar o custo de parse de CSS. Não consegui confirmar em
  runtime (sem harness de browser nesta auditoria read-only) se o fallback
  para navegadores sem `adoptedStyleSheets` (`<style>` por Shadow Root) está
  ativo no target de build do projeto — vale validação manual/E2E (já
  prevista como T5.2 no plano) com múltiplos pickers montados
  simultaneamente, medindo `document.styleSheets`/memory por instância.
  **Severidade: baixa** (mecanismo do próprio Vue, fora do controle direto
  do código do port), mas bloqueada pelo achado #7: como `custom-element.ts`
  não é sequer buildado como entry hoje, esse comportamento não está sendo
  exercitado em nenhum build de produção.

---

## Top 3 priorizados

1. **[Alta] Bundle incompleto — CSS do `<Picker>` padrão nunca é emitido**
   (`vite.config.ts:6-31`, `src/index.ts`, `Picker.vue` sem `<style>`,
   ausência de `dist/style.css`). O export público principal do pacote
   (`import { Picker } from '@luquinhasbrito/vue-emoji-mart'`) não carrega nenhum CSS
   — o consumidor recebe um picker sem estilo a menos que importe o SCSS
   fonte manualmente. Fix recomendado: adicionar um segundo entry de estilo
   no `vite.config.ts` (ex.: importar `styles/picker.scss` a partir de
   `Picker.vue` via `<style lang="scss">` com `@use`, ou configurar
   `build.lib` para múltiplos entries incluindo `custom-element.ts` e deixar
   o Vite extrair `dist/style.css` via `cssCodeSplit`/`emitCss`), e então
   remeasure o gzip real do bundle + CSS combinados antes de validar o
   critério "24.4 kB gzip" contra qualquer meta.

2. **[Média] Hover/keyboard-nav toca a reatividade de todos os botões
   montados a cada movimento** (`picker-context.ts` +
   `PickerEmojiButton.vue:37-42`). O design documentado promete "nenhum
   evento de mouseenter/mouseleave dispara re-render de mais de 1 botão"
   (plano, linha 43), mas na implementação atual o `v-memo` só evita o
   *patch* de DOM — o `computed selected` de cada botão montado é
   reavaliado a cada hover porque todos compartilham o mesmo `pos` ref via
   `provide`/`inject`. Fix recomendado: medir com Vue Devtools/profiler
   quantos componentes efetivamente re-executam render por hover com a
   virtualização ativa (o número real de botões montados simultaneamente,
   não 1800); se o custo for perceptível em dispositivos mais fracos,
   considerar granularizar a leitura de `pos` (ex.: expor só um
   `isSelected(pos)` lookup baseado em `Map`/`Set` de posições ativas ao
   invés de comparação `deepEqual` por componente, ou usar `triggerRef`
   seletivo/`shallowRef` de "apenas os 2 pos afetados" ao invés de um ref
   único global lido por todos).

3. **[Baixa-Média] Grid de busca não é virtualizado**
   (`PickerEmojiGrid.vue:43-68`) e reconstrução da grade a cada tecla sem
   debounce (`useSearch.ts:46-82`) somados propagam trabalho reativo
   supérfluo para a grade principal escondida atrás da busca (mesmo
   problema do item 2, mas disparado por digitação em vez de hover). É
   paridade com o original e hoje limitado por `maxResults=90`, então não é
   urgente, mas se a API pública permitir aumentar `maxResults`
   (`SearchIndex.search(value, { maxResults })`) o grid de resultados escala
   sem limite de montagem no DOM. Fix recomendado: reaproveitar
   `useRowVirtualizer` também para `searchResults` (hoje só é usado para o
   grid principal) e considerar debounce leve (~100-150ms) na busca para
   reduzir o número de vezes que a grade é reconstruída e `pos` é resetado
   durante digitação rápida.
