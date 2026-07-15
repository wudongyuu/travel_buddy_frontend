<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { CheckCircle, AlertCircle, Info, X } from '@lucide/vue'

type ToastType = 'success' | 'error' | 'info'

const props = defineProps<{
  message: string
  type?: ToastType
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const isVisible = ref(false)

const iconConfig = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info
}

const colorConfig = {
  success: 'bg-green-500',
  error: 'bg-destructive',
  info: 'bg-blue-500'
}

const show = () => {
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
  setTimeout(() => emit('close'), 300)
}

watch(() => props.visible, (val) => {
  if (val) show()
})

let timer: ReturnType<typeof setTimeout>

onMounted(() => {
  timer = setTimeout(hide, 3000)
})

onUnmounted(() => {
  clearTimeout(timer)
})
</script>

<template>
  <Transition name="slide">
    <div
      v-if="isVisible"
      class="fixed top-20 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-3 px-4 py-3 rounded-full text-white shadow-lg"
      :class="colorConfig[type || 'info']"
    >
      <component :is="iconConfig[type || 'info']" class="w-5 h-5" />
      <span class="text-sm font-medium">{{ message }}</span>
      <button @click="hide" class="ml-2 hover:opacity-80">
        <X class="w-4 h-4" />
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}
</style>
