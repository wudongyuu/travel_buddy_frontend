<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Save, X } from '@lucide/vue'
import { storage } from '@/services/storage'
import type { AppSettings } from '@/types'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const apiKey = ref('')
const useMock = ref(true)
const model = ref('gpt-4o-mini')

onMounted(async () => {
  const settings = await storage.getSettings()
  apiKey.value = settings.apiKey || ''
  useMock.value = settings.useMock
  model.value = settings.model || 'gpt-4o-mini'
})

const saveSettings = async () => {
  const settings: AppSettings = {
    apiKey: apiKey.value || undefined,
    model: model.value || undefined,
    useMock: useMock.value
  }
  await storage.saveSettings(settings)
  emit('saved')
}
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
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-medium text-foreground">设置</h2>
          <button
            @click="emit('close')"
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-accent/30"
          >
            <X class="w-5 h-5 text-foreground" />
          </button>
        </div>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">API Key</label>
            <input
              v-model="apiKey"
              type="text"
              placeholder="输入OpenAI API Key"
              class="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">模型选择</label>
            <select
              v-model="model"
              class="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="gpt-4o-mini">GPT-4o Mini</option>
              <option value="gpt-4o">GPT-4o</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </select>
          </div>
          
          <div class="flex items-center justify-between">
            <div>
              <label class="block text-sm font-medium text-foreground">Mock模式</label>
              <p class="text-xs text-muted-foreground mt-1">使用预置数据，无需API Key</p>
            </div>
            <button
              @click="useMock = !useMock"
              class="w-12 h-7 rounded-full transition-colors relative"
              :class="useMock ? 'bg-primary' : 'bg-muted'"
            >
              <span
                class="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
                :class="useMock ? 'left-6' : 'left-1'"
              ></span>
            </button>
          </div>
          
          <div class="bg-accent/30 rounded-xl p-4">
            <p class="text-sm text-accent-foreground">
              <strong>隐私提示：</strong>API Key仅存储在本地浏览器，不会上传到任何服务器。
            </p>
          </div>
          
          <button
            @click="saveSettings"
            class="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Save class="w-5 h-5" />
            保存设置
          </button>
        </div>
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
