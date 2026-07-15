<script setup lang="ts">
import { ArrowLeft, Settings } from '@lucide/vue'

defineProps<{
  title?: string
  showBack?: boolean
}>()

const emit = defineEmits<{
  back: []
  settings: []
}>()
</script>

<template>
  <header class="sticky top-0 z-30 w-full bg-background border-b border-border">
    <div class="mx-auto flex h-14 max-w-[720px] items-center px-4">
      <div class="flex items-center gap-3">
        <button
          v-if="showBack"
          @click="emit('back')"
          class="inline-flex h-8 w-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
          style="color: hsl(var(--muted-foreground)); outline-color: hsl(var(--ring));"
        >
          <ArrowLeft class="w-5 h-5" />
        </button>
        <h1 v-if="title" class="text-base font-semibold text-foreground">{{ title }}</h1>
      </div>
      <div class="flex-1"></div>
      <button
        @click="emit('settings')"
        class="inline-flex h-8 w-8 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2"
        style="color: hsl(var(--muted-foreground)); outline-color: hsl(var(--ring));"
      >
        <Settings class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>
