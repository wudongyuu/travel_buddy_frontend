<script setup lang="ts">
import type { TripStatus } from '@/types'

defineProps<{
  status: TripStatus
}>()

const statusConfig = {
  not_started: { label: '未开始', class: 'bg-muted text-muted-foreground' },
  ongoing: { label: '进行中', class: 'bg-secondary text-secondary-foreground' },
  completed: { label: '已完成', class: 'bg-primary text-primary-foreground' }
}
</script>

<template>
  <span
    class="px-3 py-1 rounded-full text-xs font-medium"
    :class="statusConfig[status].class"
  >
    {{ statusConfig[status].label }}
  </span>
</template>
