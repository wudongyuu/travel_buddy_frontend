<script setup lang="ts">
import { Plus } from '@lucide/vue'

defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="emit('click')"
    class="fixed right-4 z-20 flex h-14 w-14 items-center justify-center transition-transform duration-150 hover:scale-105 active:scale-95 md:hidden"
    style="bottom: calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem); background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); border-radius: 50%;"
  >
    <Plus class="w-6 h-6" />
  </button>
</template>
