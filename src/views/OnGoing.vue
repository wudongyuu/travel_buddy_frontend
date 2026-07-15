<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MapPin, Calendar, Plus, Trash2, Sparkles, RefreshCw } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import LoadingMask from '@/components/LoadingMask.vue'
import Toast from '@/components/Toast.vue'
import { storage, llm } from '@/services'
import type { Trip, DayPlan, Expense, ExpenseCategory, AdjustmentResult, Priority } from '@/types'

const route = useRoute()
const router = useRouter()

const tripId = route.params.tripId as string
const trip = ref<Trip | null>(null)
const currentDayIndex = ref(1)
const expenses = ref<Expense[]>([])
const showAddExpense = ref(false)
const newExpense = ref({
  category: '餐饮' as ExpenseCategory,
  amount: 0,
  description: ''
})
const adjustmentContext = ref('')
const adjustmentPriority = ref<Priority>('体验优先')
const adjustmentResult = ref<AdjustmentResult | null>(null)
const loading = ref(false)
const showSettings = ref(false)

const toast = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

const currentDay = computed<DayPlan | undefined>(() => {
  return trip.value?.days.find(d => d.dayIndex === currentDayIndex.value)
})

const totalExpenses = computed(() => {
  return expenses.value.reduce((sum, e) => sum + e.amount, 0)
})

const expenseCategories: ExpenseCategory[] = ['餐饮', '交通', '门票', '住宿', '购物', '其他']

const priorityOptions: { label: string; value: Priority }[] = [
  { label: '预算优先', value: '预算优先' },
  { label: '时间优先', value: '时间优先' },
  { label: '体验优先', value: '体验优先' }
]

async function loadTrip() {
  try {
    trip.value = await storage.getTripDetail(tripId)
    if (!trip.value) {
      router.push('/')
      return
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (const day of trip.value.days) {
      const dayDate = new Date(day.date)
      dayDate.setHours(0, 0, 0, 0)
      if (dayDate.getTime() === today.getTime()) {
        currentDayIndex.value = day.dayIndex
        break
      }
    }
    
    await loadExpenses()
  } catch {
    router.push('/')
  }
}

async function loadExpenses() {
  expenses.value = await storage.getExpenses(tripId, currentDayIndex.value)
}

function addExpense() {
  if (newExpense.value.amount <= 0) {
    showToast('请输入有效金额', 'error')
    return
  }
  
  const expense: Expense = {
    expenseId: crypto.randomUUID(),
    category: newExpense.value.category,
    amount: newExpense.value.amount,
    description: newExpense.value.description,
    createdAt: new Date().toISOString()
  }
  
  storage.saveExpense(tripId, currentDayIndex.value, expense).then(() => {
    loadExpenses()
    showToast('花费记录成功', 'success')
    showAddExpense.value = false
    newExpense.value = { category: '餐饮', amount: 0, description: '' }
  })
}

async function deleteExpense(expenseId: string) {
  await storage.deleteExpense(tripId, currentDayIndex.value, expenseId)
  await loadExpenses()
  showToast('删除成功', 'success')
}

async function getAdjustment() {
  if (!adjustmentContext.value.trim()) {
    showToast('请描述你遇到的状况', 'error')
    return
  }
  
  loading.value = true
  
  try {
    const result = await llm.generateAdjustment({
      tripId,
      dayIndex: currentDayIndex.value,
      currentSpotName: currentDay.value?.spots[0]?.name || '',
      userContext: adjustmentContext.value,
      priority: adjustmentPriority.value
    })
    
    adjustmentResult.value = result
    showToast('调整建议已生成', 'success')
  } catch (error) {
    showToast(error instanceof Error ? error.message : '获取调整建议失败', 'error')
  } finally {
    loading.value = false
  }
}

function resetAdjustment() {
  adjustmentContext.value = ''
  adjustmentResult.value = null
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

async function loadAdjustmentSuggestion() {
  if (!trip.value || !currentDay.value) return
  
  loading.value = true
  try {
    const result = await llm.generateAdjustment({
      tripId,
      dayIndex: currentDayIndex.value,
      currentSpotName: currentDay.value?.spots[0]?.name || '',
      userContext: '天气不错，有什么更好的建议吗？',
      priority: adjustmentPriority.value
    })
    adjustmentResult.value = result
  } catch {
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadTrip()
  await loadAdjustmentSuggestion()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader :title="trip?.tripName || '临场应变'" :showBack="true" @back="goBack" @settings="showSettings = true" />
    
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
      
      <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        <button
          v-for="day in trip.days"
          :key="day.dayIndex"
          @click="currentDayIndex = day.dayIndex; loadExpenses()"
          class="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all"
          :class="currentDayIndex === day.dayIndex
            ? 'bg-secondary text-secondary-foreground'
            : 'bg-input text-foreground hover:bg-accent/30'"
        >
          Day {{ day.dayIndex }}
        </button>
      </div>
      
      <div v-if="currentDay" class="space-y-6">
        <div class="bg-card rounded-2xl p-4 border border-border">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-medium text-foreground">今日计划</h3>
            <span class="text-sm text-muted-foreground">{{ currentDay.date }}</span>
          </div>
          
          <div class="space-y-3">
            <div v-if="currentDay.spots.length > 0" class="bg-accent/30 rounded-xl p-3">
              <p class="text-xs text-accent-foreground mb-1">当前景点</p>
              <p class="font-medium text-foreground">{{ currentDay.spots[0].name }}</p>
            </div>
            
            <div v-if="currentDay.spots.length > 1" class="space-y-2">
              <p class="text-xs text-muted-foreground">接下来</p>
              <div
                v-for="(spot, index) in currentDay.spots.slice(1)"
                :key="index"
                class="flex items-center gap-2 text-sm text-foreground"
              >
                <span class="w-6 h-6 rounded-full bg-input flex items-center justify-center text-xs">
                  {{ index + 2 }}
                </span>
                {{ spot.name }}
              </div>
            </div>
            
            <div v-if="currentDay.restaurants.length > 0" class="pt-2 border-t border-border">
              <p class="text-xs text-muted-foreground mb-1">午餐推荐</p>
              <p class="text-sm text-foreground">{{ currentDay.restaurants[0].name }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-card rounded-2xl p-4 border border-border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-foreground">今日花费</h3>
            <button
              @click="showAddExpense = true"
              class="flex items-center gap-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus class="w-4 h-4" />
              记一笔
            </button>
          </div>
          
          <div class="text-center mb-4">
            <p class="text-sm text-muted-foreground">今日总计</p>
            <p class="text-2xl font-medium text-foreground">¥{{ totalExpenses.toLocaleString() }}</p>
          </div>
          
          <div v-if="expenses.length === 0" class="text-center py-4 text-muted-foreground">
            暂无花费记录
          </div>
          
          <div v-else class="space-y-3">
            <div
              v-for="expense in expenses"
              :key="expense.expenseId"
              class="flex items-center justify-between p-3 bg-input rounded-lg"
            >
              <div>
                <span class="text-sm font-medium text-foreground">{{ expense.category }}</span>
                <p v-if="expense.description" class="text-xs text-muted-foreground">{{ expense.description }}</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-foreground">-¥{{ expense.amount }}</span>
                <button
                  @click="deleteExpense(expense.expenseId)"
                  class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-card rounded-2xl p-4 border border-border">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-foreground">调整助手</h3>
            <button
              v-if="adjustmentResult"
              @click="resetAdjustment"
              class="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <RefreshCw class="w-4 h-4" />
              换一个
            </button>
          </div>
          
          <div v-if="!adjustmentResult" class="space-y-4">
            <textarea
              v-model="adjustmentContext"
              rows="3"
              placeholder="描述你遇到的状况，例如：下雨了，不想去户外景点..."
              class="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
            ></textarea>
            
            <div>
              <p class="text-sm text-muted-foreground mb-2">优先级</p>
              <div class="flex gap-2">
                <button
                  v-for="option in priorityOptions"
                  :key="option.value"
                  @click="adjustmentPriority = option.value"
                  class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  :class="adjustmentPriority === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-input text-foreground hover:bg-accent/30'"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            
            <button
              @click="getAdjustment"
              :disabled="!adjustmentContext.trim()"
              class="w-full py-4 bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles class="w-5 h-5" />
              获取调整建议
            </button>
          </div>
          
          <div v-else class="space-y-4">
            <div class="bg-accent/30 rounded-xl p-4">
              <p class="text-sm text-accent-foreground">{{ adjustmentResult.suggestion.reason }}</p>
            </div>
            
            <div class="bg-secondary/20 rounded-xl p-4">
              <h4 class="font-medium text-foreground mb-2">{{ adjustmentResult.suggestion.newSpot.name }}</h4>
              <p class="text-sm text-muted-foreground mb-2">{{ adjustmentResult.suggestion.newSpot.description }}</p>
              <div class="flex items-center gap-4 text-xs text-muted-foreground">
                <span>时长：{{ adjustmentResult.suggestion.newSpot.estimatedDuration }}</span>
                <span>费用：{{ adjustmentResult.suggestion.newSpot.estimatedCost }}</span>
              </div>
              <p class="mt-2 text-sm text-primary">{{ adjustmentResult.suggestion.savedTimeOrCost }}</p>
            </div>
            
            <div>
              <p class="text-sm text-muted-foreground mb-2">备选方案</p>
              <div class="space-y-2">
                <div
                  v-for="(alt, index) in adjustmentResult.alternatives"
                  :key="index"
                  class="flex items-center gap-3 p-3 bg-input rounded-lg"
                >
                  <span class="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-xs text-accent-foreground">
                    {{ index + 1 }}
                  </span>
                  <div>
                    <p class="text-sm font-medium text-foreground">{{ alt.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ alt.reason }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="showToast('建议已采纳', 'success')"
                class="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                采纳建议
              </button>
              <button
                @click="resetAdjustment"
                class="flex-1 py-3 bg-input text-foreground rounded-xl font-medium hover:bg-accent/30 transition-colors"
              >
                换方案
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <div v-if="showAddExpense" class="fixed inset-0 z-[70] flex items-end justify-center">
      <div class="absolute inset-0 bg-foreground/30 backdrop-blur-sm" @click="showAddExpense = false"></div>
      <div class="relative bg-background w-full md:w-[90%] md:max-w-[480px] rounded-t-3xl md:rounded-3xl p-6">
        <h3 class="text-lg font-medium text-foreground mb-4">记一笔</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">分类</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="category in expenseCategories"
                :key="category"
                @click="newExpense.category = category"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                :class="newExpense.category === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-input text-foreground hover:bg-accent/30'"
              >
                {{ category }}
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
              @click="showAddExpense = false"
              class="flex-1 py-3 bg-input text-foreground rounded-xl font-medium"
            >
              取消
            </button>
            <button
              @click="addExpense"
              class="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <LoadingMask :loading="loading" message="正在获取调整建议..." />
    
    <SettingsModal :visible="showSettings" @close="showSettings = false" @saved="handleSettingsSaved" />
    
    <Toast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="closeToast"
    />
  </div>
</template>
