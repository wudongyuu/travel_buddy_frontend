<script setup lang="ts">
import { MapPin, Settings } from '@lucide/vue'

defineProps<{
  active?: string
}>()

const emit = defineEmits<{
  navigate: [route: string]
}>()

const navItems = [
  { icon: MapPin, route: '/', label: '行程' },
  { icon: Settings, route: '/settings', label: '我的' }
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom md:hidden">
    <div class="max-w-[720px] mx-auto h-16 flex items-center justify-around" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
      <button
        v-for="item in navItems"
        :key="item.route"
        @click="emit('navigate', item.route)"
        class="flex flex-col items-center gap-1 min-w-[48px] transition-opacity duration-150"
        :class="active === item.route ? 'text-foreground' : 'text-muted-foreground'"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>