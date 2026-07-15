<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Bell, Shield, HelpCircle, Info } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import Toast from '@/components/Toast.vue'
import { storage } from '@/services/storage'
import type { AppSettings } from '@/types'

const router = useRouter()

const settings = ref<AppSettings>({ useMock: true })
const apiKey = ref('')

const toast = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

const menuItems = [
  { icon: Moon, label: '深色模式', description: '切换明暗主题' },
  { icon: Bell, label: '通知设置', description: '管理消息通知' },
  { icon: Shield, label: '隐私设置', description: '数据安全与隐私' },
  { icon: HelpCircle, label: '帮助中心', description: '常见问题解答' },
  { icon: Info, label: '关于我们', description: '版本信息' }
]

async function loadSettings() {
  settings.value = await storage.getSettings()
  apiKey.value = settings.value.apiKey || ''
}

async function saveSettings() {
  try {
    await storage.saveSettings({
      ...settings.value,
      apiKey: apiKey.value
    })
    showToast('设置保存成功', 'success')
  } catch (error) {
    showToast('保存失败', 'error')
  }
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, message, type }
}

function closeToast() {
  toast.value.visible = false
}

function goBack() {
  router.back()
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader title="我的" :showBack="true" @back="goBack" />
    
    <main class="pt-14 pb-24 md:pb-8 px-4 max-w-[720px] mx-auto">
      <div class="mt-6 mb-8">
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-accent/30 rounded-full flex items-center justify-center">
            <span class="text-2xl font-medium text-primary">旅</span>
          </div>
          <div>
            <h2 class="text-xl font-medium text-foreground">旅伴用户</h2>
            <p class="text-sm text-muted-foreground">欢迎使用旅伴</p>
          </div>
        </div>
      </div>
      
      <div class="bg-card rounded-2xl border border-border mb-6">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-medium text-foreground mb-3">API 设置</h3>
          <div class="space-y-3">
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="settings.useMock"
                  type="checkbox"
                  class="w-5 h-5 rounded border-border bg-input text-primary focus:ring-ring"
                />
                <span class="text-sm text-foreground">使用 Mock 模式</span>
              </label>
              <p class="text-xs text-muted-foreground mt-1">开启后无需 API Key 即可体验全部功能</p>
            </div>
            
            <div v-if="!settings.useMock">
              <label class="block text-sm font-medium text-foreground mb-2">API Key</label>
              <input
                v-model="apiKey"
                type="password"
                placeholder="请输入你的 API Key"
                class="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
            </div>
          </div>
          
          <button
            @click="saveSettings"
            class="w-full mt-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            保存设置
          </button>
        </div>
      </div>
      
      <div class="bg-card rounded-2xl border border-border">
        <div
          v-for="(item, index) in menuItems"
          :key="index"
          class="flex items-center gap-4 p-4 border-b border-border last:border-b-0 hover:bg-accent/10 transition-colors cursor-pointer"
        >
          <div class="w-10 h-10 bg-accent/30 rounded-full flex items-center justify-center">
            <component :is="item.icon" class="w-5 h-5 text-primary" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-foreground">{{ item.label }}</p>
            <p class="text-xs text-muted-foreground">{{ item.description }}</p>
          </div>
        </div>
      </div>
      
      <div class="mt-8 text-center">
        <p class="text-xs text-muted-foreground">旅伴 v1.0.0</p>
        <p class="text-xs text-muted-foreground mt-1">Golden Time Design System</p>
      </div>
    </main>
    
    <BottomNav active="/settings" @navigate="router.push" />
    
    <Toast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="closeToast"
    />
  </div>
</template>