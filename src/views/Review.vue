<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MapPin, Calendar, Sparkles, Copy, Check, RefreshCw, Trash2, Save } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import LoadingMask from '@/components/LoadingMask.vue'
import Toast from '@/components/Toast.vue'
import { storage, llm } from '@/services'
import type { Trip, Review, DailyFeedback, DayPlan } from '@/types'

const route = useRoute()
const router = useRouter()

const tripId = route.params.tripId as string
const trip = ref<Trip | null>(null)
const review = ref<Review | null>(null)
const currentDayIndex = ref(1)
const feedback = ref<DailyFeedback[]>([])
const showFeedbackForm = ref(false)
const isSubmitting = ref(false)
const showSettings = ref(false)

const showAddExpense = ref(false)
const newExpense = ref({
  category: '',
  amount: 0,
  description: ''
})

const expenseCategories = [
  { icon: '🍜', name: '餐饮' },
  { icon: '🚗', name: '交通' },
  { icon: '🎫', name: '门票' },
  { icon: '🏨', name: '住宿' },
  { icon: '🛍️', name: '购物' },
  { icon: '🧩', name: '其他' }
]

const highlightInput = ref('')
const showHighlightInput = ref(false)

const toast = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

const copiedIndex = ref<number | null>(null)

const currentDay = computed<DayPlan | undefined>(() => {
  return trip.value?.days.find(d => d.dayIndex === currentDayIndex.value)
})

const currentFeedback = computed<DailyFeedback | undefined>(() => {
  return feedback.value.find(f => f.dayIndex === currentDayIndex.value)
})

const hasAnyFeedback = computed(() => {
  return feedback.value.some(f => f.highlights && f.highlights.length > 0)
})

const currentDayExpenses = computed(() => {
  const fb = feedback.value.find(f => f.dayIndex === currentDayIndex.value)
  return fb?.expenses || []
})

const currentDayTotalCost = computed(() => {
  return currentDayExpenses.value.reduce((sum, e) => sum + e.amount, 0)
})

async function loadTrip() {
  try {
    trip.value = await storage.getTripDetail(tripId)
    if (!trip.value) {
      router.push('/')
      return
    }
    
    const existingReview = await storage.getReview(tripId)
    if (existingReview) {
      review.value = existingReview
    }
  } catch {
    router.push('/')
  }
}

async function startFeedback() {
  const initialFeedback = trip.value?.days.map(day => ({
    dayIndex: day.dayIndex,
    highlights: [] as string[],
    expenses: [] as any[],
    actualCost: 0,
    feeling: ''
  })) || []
  
  for (const fb of initialFeedback) {
    const savedExpenses = await storage.getExpenses(tripId, fb.dayIndex)
    fb.expenses = savedExpenses
    fb.actualCost = savedExpenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
  }
  
  feedback.value = initialFeedback as any
  currentDayIndex.value = 1
  showFeedbackForm.value = true
}

function openAddExpense() {
  showAddExpense.value = true
}

function closeAddExpense() {
  showAddExpense.value = false
  newExpense.value = { category: '', amount: 0, description: '' }
}

async function addExpense() {
  if (!newExpense.value.category || newExpense.value.amount <= 0) {
    showToast('请填写完整的花费信息', 'error')
    return
  }
  
  const fb = feedback.value.find(f => f.dayIndex === currentDayIndex.value)
  if (!fb) return
  
  if (!fb.expenses) fb.expenses = []
  
  const expense = {
    expenseId: crypto.randomUUID(),
    category: newExpense.value.category as any,
    amount: newExpense.value.amount,
    description: newExpense.value.description || undefined,
    createdAt: new Date().toISOString()
  }
  
  fb.expenses.push(expense)
  fb.actualCost = fb.expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
  
  await storage.saveExpense(tripId, currentDayIndex.value, expense)
  
  closeAddExpense()
  showToast('花费添加成功', 'success')
}

async function removeExpense(expenseId: string) {
  const fb = feedback.value.find(f => f.dayIndex === currentDayIndex.value)
  if (!fb || !fb.expenses) return
  
  fb.expenses = fb.expenses.filter(e => e.expenseId !== expenseId)
  fb.actualCost = fb.expenses.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0)
  
  await storage.deleteExpense(tripId, currentDayIndex.value, expenseId)
}

function goToNextDay() {
  if (currentDayIndex.value < trip.value!.days.length) {
    currentDayIndex.value++
  }
}

function goToPrevDay() {
  if (currentDayIndex.value > 1) {
    currentDayIndex.value--
  }
}

function addHighlight() {
  if ((currentFeedback.value?.highlights?.length || 0) >= 5) {
    showToast('最多添加5个高光时刻', 'error')
    return
  }
  showHighlightInput.value = true
}

function confirmHighlight() {
  const value = highlightInput.value.trim()
  if (!value) {
    showHighlightInput.value = false
    return
  }
  
  const fbIndex = feedback.value.findIndex(f => f.dayIndex === currentDayIndex.value)
  if (fbIndex === -1) {
    feedback.value.push({
      dayIndex: currentDayIndex.value,
      highlights: [value],
      expenses: [],
      actualCost: 0,
      feeling: ''
    })
  } else {
    const fb = feedback.value[fbIndex]
    if (!fb.highlights) fb.highlights = [] as string[]
    fb.highlights.push(value)
    feedback.value[fbIndex] = { ...fb }
  }
  
  highlightInput.value = ''
  showHighlightInput.value = false
}

function cancelHighlight() {
  highlightInput.value = ''
  showHighlightInput.value = false
}

function removeHighlight(index: number) {
  const fb = feedback.value.find(f => f.dayIndex === currentDayIndex.value)
  if (fb && fb.highlights) {
    fb.highlights.splice(index, 1)
  }
}

function updateFeeling(value: string) {
  const fb = feedback.value.find(f => f.dayIndex === currentDayIndex.value)
  if (fb) {
    fb.feeling = value
  }
}

async function saveDailyFeedback() {
  const fb = feedback.value.find(f => f.dayIndex === currentDayIndex.value)
  if (!fb) return
  
  await storage.saveDailyFeedback(tripId, fb)
  showToast('保存成功', 'success')
}

async function submitReview() {
  isSubmitting.value = true
  
  try {
    for (const fb of feedback.value) {
      await storage.saveDailyFeedback(tripId, fb)
    }
    
    const reviewData = await llm.generateReview({
      tripId,
      dailyFeedback: feedback.value
    })
    
    review.value = reviewData
    await storage.saveReview(tripId, reviewData)
    showFeedbackForm.value = false
    showToast('回顾生成成功', 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : '生成回顾失败', 'error')
  } finally {
    isSubmitting.value = false
  }
}

function restartFeedback() {
  showFeedbackForm.value = true
  review.value = null
}

async function copyToClipboard(text: string, index: number) {
  try {
    await navigator.clipboard.writeText(text)
    copiedIndex.value = index
    showToast('已复制到剪贴板', 'success')
    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  } catch {
    showToast('复制失败', 'error')
  }
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, message, type }
}

function closeToast() {
  toast.value.visible = false
}

function goBack() {
  router.push('/')
}

function handleSettingsSaved() {
  showSettings.value = false
}

onMounted(() => {
  loadTrip()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader :title="trip?.tripName || '旅行回顾'" :showBack="true" @back="goBack" @settings="showSettings = true" />
    
    <main v-if="trip" class="pt-14 pb-8 px-4 max-w-[720px] mx-auto">
      <div class="mt-6 mb-6">
        <div class="flex items-center gap-2 mb-2">
          <MapPin class="w-5 h-5 text-primary" />
          <span class="text-lg font-medium text-foreground">{{ trip.destination }}</span>
        </div>
        <div class="flex items-center gap-4 text-sm text-muted-foreground">
          <span class="flex items-center gap-1">
            <Calendar class="w-4 h-4" />
            {{ trip.startDate }} - {{ trip.endDate }}
          </span>
        </div>
      </div>
      
      <div v-if="!review && !showFeedbackForm" class="mt-12 text-center">
        <div class="w-24 h-24 mx-auto bg-accent/30 rounded-full flex items-center justify-center mb-4">
          <Sparkles class="w-10 h-10 text-primary" />
        </div>
        <h3 class="text-xl font-medium text-foreground mb-2">记录美好回忆</h3>
        <p class="text-muted-foreground mb-6">分享你的旅行高光时刻，生成专属旅行回顾</p>
        <button
          @click="startFeedback"
          class="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          开始记录
        </button>
      </div>
      
      <div v-else-if="showFeedbackForm" class="space-y-6">
        <div class="flex items-center justify-between">
          <button
            @click="goToPrevDay"
            :disabled="currentDayIndex === 1"
            class="px-4 py-2 bg-input rounded-lg text-foreground hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            上一天
          </button>
          <div class="text-center">
            <span class="text-lg font-medium text-foreground">Day {{ currentDayIndex }}</span>
            <span class="text-muted-foreground"> / {{ trip.days.length }}</span>
          </div>
          <button
            @click="goToNextDay"
            :disabled="currentDayIndex === trip.days.length"
            class="px-4 py-2 bg-input rounded-lg text-foreground hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            下一天
          </button>
        </div>
        
        <div v-if="currentDay" class="bg-card rounded-2xl p-4 border border-border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-foreground">{{ currentDay.theme }}</h3>
            <span class="text-sm text-muted-foreground">{{ currentDay.date }}</span>
          </div>
        </div>
        
        <div class="bg-card rounded-2xl p-4 border border-border">
          <h4 class="text-base font-medium text-foreground mb-4">今日高光时刻</h4>
          
          <div class="flex flex-wrap gap-2 mb-3">
            <span
              v-for="(highlight, index) in (currentFeedback?.highlights || [])"
              :key="index"
              class="relative inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
            >
              {{ highlight }}
              <button
                @click="removeHighlight(index)"
                class="ml-1.5 w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-colors"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </span>
          </div>
          
          <div v-if="showHighlightInput" class="flex gap-2">
            <input
              v-model="highlightInput"
              type="text"
              placeholder="输入高光时刻..."
              @keyup.enter="confirmHighlight"
              class="flex-1 px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
            <button
              @click="confirmHighlight"
              class="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              确认
            </button>
            <button
              @click="cancelHighlight"
              class="px-4 py-3 bg-input text-foreground rounded-xl font-medium"
            >
              取消
            </button>
          </div>
          
          <button
            v-else
            @click="addHighlight"
            :disabled="(currentFeedback?.highlights?.length || 0) >= 5"
            class="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            + 添加高光时刻
          </button>
        </div>
        
        <div class="bg-muted rounded-2xl p-5">
          <div class="flex items-baseline justify-between gap-2 mb-4">
            <h4 class="text-lg font-semibold text-foreground">今日花费</h4>
            <span class="text-sm whitespace-nowrap tabular-nums text-muted-foreground">已花费 ¥{{ currentDayTotalCost.toLocaleString() }}</span>
          </div>
          <div class="space-y-3">
            <div
              v-for="expense in currentDayExpenses"
              :key="expense.expenseId"
              class="flex items-start gap-3"
            >
              <span class="shrink-0 text-lg leading-none pt-0.5">
                {{ expenseCategories.find(c => c.name === expense.category)?.icon || '🧩' }}
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-sm font-medium truncate text-foreground">{{ expense.category }}</span>
                  <span class="shrink-0 text-sm font-medium tabular-nums text-foreground">¥{{ expense.amount }}</span>
                </div>
                <p v-if="expense.description" class="mt-0.5 truncate text-xs text-muted-foreground">{{ expense.description }}</p>
              </div>
              <button
                @click="removeExpense(expense.expenseId)"
                class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
            <div v-if="currentDayExpenses.length === 0" class="text-center py-4 text-muted-foreground text-sm">
              暂无花费记录
            </div>
          </div>
          <button
            @click="openAddExpense"
            class="mt-4 text-sm font-medium text-muted-foreground hover:opacity-70 transition-opacity"
          >
            + 添加花费
          </button>
        </div>
        
        <div class="bg-card rounded-2xl p-4 border border-border">
          <h4 class="text-base font-medium text-foreground mb-4">今日感受</h4>
          <textarea
            :value="currentFeedback?.feeling"
            @input="(e: Event) => updateFeeling((e.target as HTMLTextAreaElement).value)"
            rows="3"
            placeholder="记录下今天的心情和感受..."
            class="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
          ></textarea>
        </div>
        
        <div class="flex gap-4">
          <button
            v-if="currentDayIndex > 1"
            @click="goToPrevDay"
            class="flex-1 py-4 bg-input text-foreground rounded-xl font-medium"
          >
            上一天
          </button>
          <button
            @click="saveDailyFeedback"
            class="flex-1 py-4 bg-accent text-accent-foreground rounded-xl font-medium flex items-center justify-center gap-2"
          >
            <Save class="w-5 h-5" />
            保存
          </button>
          <button
            v-if="currentDayIndex < trip.days.length"
            @click="goToNextDay"
            class="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-medium"
          >
            下一天
          </button>
          <button
            v-else
            @click="submitReview"
            :disabled="!hasAnyFeedback"
            class="flex-1 py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles class="w-5 h-5" />
            {{ isSubmitting ? '生成中...' : '生成回顾' }}
          </button>
        </div>
      </div>
      
      <div v-else-if="review" class="space-y-6">
        <div class="bg-card rounded-2xl p-6 border border-border">
          <div class="text-center">
            <p class="text-sm text-muted-foreground mb-1">预算总结</p>
            <div class="flex items-center justify-center gap-4 mt-4">
              <div>
                <p class="text-xs text-muted-foreground">预估</p>
                <p class="text-lg font-medium text-foreground">¥{{ review.budgetSummary.estimatedTotal }}</p>
              </div>
              <div class="w-px h-10 bg-border"></div>
              <div>
                <p class="text-xs text-muted-foreground">实际</p>
                <p class="text-lg font-medium text-foreground">¥{{ review.budgetSummary.actualTotal }}</p>
              </div>
              <div class="w-px h-10 bg-border"></div>
              <div>
                <p class="text-xs text-muted-foreground">结余</p>
                <p class="text-lg font-medium" :class="review.budgetSummary.variance >= 0 ? 'text-green-500' : 'text-destructive'">
                  {{ review.budgetSummary.variance >= 0 ? '+' : '' }}¥{{ review.budgetSummary.variance }}
                </p>
              </div>
            </div>
            <div class="mt-4 h-2 bg-input rounded-full overflow-hidden">
              <div
                class="h-full rounded-full bg-primary"
                :style="{ width: `${Math.min((review.budgetSummary.actualTotal / review.budgetSummary.estimatedTotal) * 100, 100)}%` }"
              ></div>
            </div>
            <p class="text-sm text-muted-foreground mt-2">{{ review.budgetSummary.comment }}</p>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium text-foreground mb-4">每日回顾</h3>
          <div class="space-y-4">
            <div
              v-for="card in review.dailyCards"
              :key="card.dayIndex"
              class="bg-card rounded-xl p-4 border border-border"
            >
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-foreground">Day {{ card.dayIndex }}</span>
                <span class="text-xs text-muted-foreground">{{ card.date }}</span>
              </div>
              <p class="text-sm text-muted-foreground mb-2">{{ card.theme }}</p>
              <p class="text-sm text-foreground mb-3">{{ card.summary }}</p>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="(highlight, index) in card.highlights"
                  :key="index"
                  class="px-3 py-1 bg-accent/30 rounded-full text-xs text-accent-foreground"
                >
                  {{ highlight }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 class="text-lg font-medium text-foreground mb-4">朋友圈文案</h3>
          <div class="space-y-3">
            <div
              v-for="(copy, index) in review.momentsCopy"
              :key="index"
              class="bg-card rounded-xl p-4 border border-border"
            >
              <p class="text-sm text-foreground mb-3">{{ copy }}</p>
              <button
                @click="copyToClipboard(copy, index)"
                class="flex items-center gap-2 text-sm text-primary hover:opacity-80 transition-opacity"
              >
                <Check v-if="copiedIndex === index" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
                {{ copiedIndex === index ? '已复制' : '复制' }}
              </button>
            </div>
          </div>
        </div>
        
        <button
          @click="restartFeedback"
          class="w-full py-4 bg-input text-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-accent/30 transition-colors"
        >
          <RefreshCw class="w-5 h-5" />
          重新填写
        </button>
      </div>
    </main>
    
    <LoadingMask :loading="isSubmitting" message="正在生成回顾..." />
    
    <SettingsModal :visible="showSettings" @close="showSettings = false" @saved="handleSettingsSaved" />
    
    <Toast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="closeToast"
    />
    
    <div v-if="showAddExpense" class="fixed inset-0 z-[70] flex items-end justify-center">
      <div class="absolute inset-0 bg-foreground/30 backdrop-blur-sm" @click="closeAddExpense"></div>
      <div class="relative bg-background w-full md:w-[90%] md:max-w-[480px] rounded-t-3xl md:rounded-3xl p-6">
        <h3 class="text-lg font-medium text-foreground mb-4">添加花费</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">分类</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="category in expenseCategories"
                :key="category.name"
                @click="newExpense.category = category.name"
                class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                :class="newExpense.category === category.name
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-input border border-border text-foreground hover:border-primary'"
              >
                <span>{{ category.icon }}</span>
                {{ category.name }}
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">金额</label>
            <input
              v-model.number="newExpense.amount"
              type="number"
              placeholder="0.00"
              class="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">备注（可选）</label>
            <input
              v-model="newExpense.description"
              type="text"
              placeholder="备注信息..."
              class="w-full px-4 py-4 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>
          
          <div class="flex gap-4">
            <button
              @click="closeAddExpense"
              class="flex-1 py-3 bg-input text-foreground rounded-xl font-medium"
            >
              取消
            </button>
            <button
              @click="addExpense"
              :disabled="!newExpense.category || !newExpense.amount || newExpense.amount <= 0"
              class="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
