import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
      insertTypesEntry: true,
      exclude: ['**/*.test.ts', '__tests__/**'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        'custom-element': fileURLToPath(new URL('./src/custom-element.ts', import.meta.url)),
      },
      name: 'VueEmojiMart',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        const base = entryName === 'index' ? 'vue-emoji-mart' : entryName
        return `${base}.${ext}`
      },
      // Nome fixo (sem hash) para casar com o export "./style.css" já
      // declarado no package.json; sem isso o Vite deriva o nome do CSS a
      // partir do nome do pacote ("@luquinhasbrito/vue-emoji-mart" -> core.css).
      cssFileName: 'style',
    },
    // Em lib mode com múltiplos entries, extrai todo o CSS gerado (o
    // `<style>` de Picker.vue, alcançado por ambos os entries) em um único
    // `dist/style.css`, casando com o export "./style.css" do package.json.
    cssCodeSplit: false,
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    sourcemap: true,
  },
})
