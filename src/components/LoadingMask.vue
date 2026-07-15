<script setup lang="ts">
defineProps<{
  loading: boolean
  message?: string
}>()
</script>

<template>
  <Transition name="fade">
    <div
      v-if="loading"
      class="fixed inset-0 z-[100] bg-background/90 flex flex-col items-center justify-center"
    >
      <div class="w-12 h-12 border-4 border-accent border-t-primary rounded-full animate-spin"></div>
      <p v-if="message" class="mt-4 text-lg text-foreground">{{ message }}</p>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
