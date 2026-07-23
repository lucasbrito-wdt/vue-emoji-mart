<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Picker, init } from '@vue-emoji-mart/core'
import data from '@vue-emoji-mart/data'

const selectedEmoji = ref<any>(null)
const isInitialized = ref(false)

onMounted(async () => {
  await init({ data })
  isInitialized.value = true
})

const handleEmojiSelect = (emoji: any) => {
  selectedEmoji.value = emoji
  console.log('Selected emoji:', emoji)
}
</script>

<template>
  <div class="app">
    <h1>Vue Emoji Mart Demo</h1>
    
    <div class="container">
      <div class="picker-wrapper" v-if="isInitialized">
        <Picker
          :data="data"
          :i18n="undefined"
          set="native"
          theme="light"
          :per-line="9"
          :preview-position="'top'"
          :search-position="'top'"
          :nav-position="'bottom'"
          @select="handleEmojiSelect"
        />
      </div>
      <div v-else class="loading">
        Carregando dados de emoji...
      </div>

      <div class="preview" v-if="selectedEmoji">
        <h2>Selecionado</h2>
        <div class="emoji-display">
          {{ selectedEmoji.native }}
        </div>
        <p><strong>Nome:</strong> {{ selectedEmoji.name }}</p>
        <p v-if="selectedEmoji.shortcodes"><strong>Códigos:</strong> {{ selectedEmoji.shortcodes.join(', ') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}

.picker-wrapper {
  display: flex;
  justify-content: center;
}

.loading {
  padding: 20px;
  text-align: center;
  color: #666;
}

.preview {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9f9f9;
}

.preview h2 {
  margin-top: 0;
  color: #333;
}

.emoji-display {
  font-size: 64px;
  text-align: center;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 20px;
}

.preview p {
  margin: 10px 0;
  color: #555;
  word-break: break-all;
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}
</style>
