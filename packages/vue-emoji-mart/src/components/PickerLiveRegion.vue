<script setup lang="ts">
/** Port of `Picker.tsx`'s `renderLiveRegion()`. */
defineProps<{ text: string }>()
</script>

<template>
  <div aria-live="polite" class="sr-only">{{ text }}</div>
</template>
