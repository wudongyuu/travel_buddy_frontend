<script setup lang="ts">
defineProps<{
  visible: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Transition name="modal">
    <div
      v-if="visible"
      class="fixed inset-0 z-[80] flex items-end md:items-center justify-center"
    >
      <div
        class="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        @click="emit('close')"
      ></div>
      <div class="relative bg-background w-full md:w-[90%] md:max-w-[480px] rounded-t-3xl md:rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
        <div v-if="title" class="text-xl font-medium text-foreground mb-4">{{ title }}</div>
        <slot></slot>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: translateY(100%);
}

@media (min-width: 768px) {
  .modal-enter-from .relative,
  .modal-leave-to .relative {
    transform: scale(0.95);
  }
}
</style>
