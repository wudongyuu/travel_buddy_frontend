<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Sparkles } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import LoadingMask from '@/components/LoadingMask.vue'
import Toast from '@/components/Toast.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { llm, storage } from '@/services'
import type { TripInput, BudgetLevel, Pace, Interest } from '@/types'

const router = useRouter()

const form = ref<TripInput>({
  destination: '',
  startDate: '',
  days: 3,
  budgetLevel: '舒适型',
  interests: [],
  pace: '标准',
  notes: ''
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)
const showSettings = ref(false)

const toast = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

const budgetOptions: { label: string; value: BudgetLevel }[] = [
  { label: '经济型', value: '经济型' },
  { label: '舒适型', value: '舒适型' },
  { label: '豪华型', value: '豪华型' }
]

const paceOptions: { label: string; value: Pace }[] = [
  { label: '紧凑', value: '紧凑' },
  { label: '标准', value: '标准' },
  { label: '休闲', value: '休闲' }
]

const interestOptions: { label: string; value: Interest; icon: string }[] = [
  { label: '美食', value: '美食', icon: '🍜' },
  { label: '人文', value: '人文', icon: '🏛️' },
  { label: '自然', value: '自然', icon: '🌿' },
  { label: '购物', value: '购物', icon: '🛍️' },
  { label: '摄影', value: '摄影', icon: '📸' },
  { label: '户外', value: '户外', icon: '⛺' },
  { label: '历史', value: '历史', icon: '📜' },
  { label: '艺术', value: '艺术', icon: '🎨' }
]

const canSubmit = computed(() => {
  return form.value.destination && form.value.startDate && form.value.interests.length > 0
})

function validate(): boolean {
  errors.value = {}
  
  if (!form.value.destination.trim()) {
    errors.value.destination = '请输入目的地'
  } else if (form.value.destination.length < 2 || form.value.destination.length > 50) {
    errors.value.destination = '目的地长度需在2-50字符之间'
  }
  
  if (!form.value.startDate) {
    errors.value.startDate = '请选择出发日期'
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(form.value.startDate)
    if (selectedDate < today) {
      errors.value.startDate = '出发日期不能早于今天'
    }
  }
  
  if (form.value.days < 1 || form.value.days > 14) {
    errors.value.days = '行程天数需在1-14天之间'
  }
  
  if (form.value.interests.length === 0) {
    errors.value.interests = '请至少选择一个兴趣'
  } else if (form.value.interests.length > 5) {
    errors.value.interests = '最多选择5个兴趣'
  }
  
  return Object.keys(errors.value).length === 0
}

function toggleInterest(interest: Interest) {
  const index = form.value.interests.indexOf(interest)
  if (index >= 0) {
    form.value.interests.splice(index, 1)
  } else if (form.value.interests.length < 5) {
    form.value.interests.push(interest)
  }
}

async function submitForm() {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const settings = await storage.getSettings()
    
    if (!settings.useMock && !settings.apiKey) {
      showToast('请先在设置中配置API Key或启用Mock模式', 'error')
      loading.value = false
      return
    }
    
    const trip = await llm.generateTrip(form.value)
    await storage.saveTrip(trip)
    
    showToast('行程生成成功', 'success')
    router.push(`/detail/${trip.tripId}`)
  } catch (error) {
    showToast(error instanceof Error ? error.message : '生成行程失败', 'error')
  } finally {
    loading.value = false
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

function handleSettingsSaved() {
  showSettings.value = false
  showToast('设置保存成功', 'success')
}

const today = new Date().toISOString().split('T')[0]
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader title="新建行程" :showBack="true" @back="goBack" @settings="showSettings = true" />
    
    <main class="pt-14 pb-8 px-4 max-w-[720px] mx-auto">
      <div class="mt-6 mb-8">
        <h2 class="text-2xl font-medium text-foreground mb-2">规划你的旅行</h2>
        <p class="text-sm text-muted-foreground">输入你的旅行偏好，AI将为你生成专属行程</p>
      </div>
      
      <form @submit.prevent="submitForm" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">目的地</label>
          <input
            v-model="form.destination"
            type="text"
            placeholder="例如：京都、巴黎、云南"
            class="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            :class="errors.destination ? 'border-destructive' : ''"
          />
          <p v-if="errors.destination" class="text-xs text-destructive mt-2">{{ errors.destination }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">出发日期</label>
          <input
            v-model="form.startDate"
            type="date"
            :min="today"
            class="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            :class="errors.startDate ? 'border-destructive' : ''"
          />
          <p v-if="errors.startDate" class="text-xs text-destructive mt-2">{{ errors.startDate }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">行程天数</label>
          <div class="flex items-center gap-4">
            <input
              v-model.number="form.days"
              type="range"
              min="1"
              max="14"
              class="flex-1 h-2 bg-input rounded-lg appearance-none cursor-pointer"
            />
            <span class="w-12 text-center text-lg font-medium text-foreground">{{ form.days }}天</span>
          </div>
          <p v-if="errors.days" class="text-xs text-destructive mt-2">{{ errors.days }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-3">预算等级</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="option in budgetOptions"
              :key="option.value"
              type="button"
              @click="form.budgetLevel = option.value"
              class="py-3 rounded-xl border transition-all"
              :class="form.budgetLevel === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-input border-border text-foreground hover:border-primary'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-3">旅行节奏</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="option in paceOptions"
              :key="option.value"
              type="button"
              @click="form.pace = option.value"
              class="py-3 rounded-xl border transition-all"
              :class="form.pace === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-input border-border text-foreground hover:border-primary'"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-3">兴趣爱好</label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in interestOptions"
              :key="option.value"
              type="button"
              @click="toggleInterest(option.value)"
              class="px-4 py-2 rounded-full border transition-all text-sm"
              :class="form.interests.includes(option.value)
                ? 'bg-accent text-accent-foreground border-accent'
                : 'bg-input border-border text-foreground hover:border-accent'"
            >
              <span class="mr-1">{{ option.icon }}</span>
              {{ option.label }}
            </button>
          </div>
          <p v-if="errors.interests" class="text-xs text-destructive mt-2">{{ errors.interests }}</p>
          <p v-if="form.interests.length > 0 && !errors.interests" class="text-xs text-muted-foreground mt-2">
            已选择 {{ form.interests.length }} 个兴趣
          </p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">备注（可选）</label>
          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="如有特殊需求，请在此说明..."
            class="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
          ></textarea>
        </div>
        
        <button
          type="submit"
          :disabled="!canSubmit || loading"
          class="w-full py-5 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Sparkles class="w-5 h-5" />
          {{ loading ? '生成中...' : '生成行程' }}
        </button>
        
        <p class="text-center text-xs text-muted-foreground">
          点击生成即表示同意使用AI服务生成行程方案
        </p>
      </form>
    </main>
    
    <LoadingMask :loading="loading" message="正在生成行程..." />
    
    <SettingsModal :visible="showSettings" @close="showSettings = false" @saved="handleSettingsSaved" />
    
    <Toast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="closeToast"
    />
  </div>
</template>
