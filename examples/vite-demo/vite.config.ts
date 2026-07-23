import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/vue-emoji-mart/' : '/',
  plugins: [vue()],
  server: {
    port: 5173,
    open: true,
  },
}))
