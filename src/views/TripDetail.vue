<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MapPin, Calendar, Clock, Utensils, Bus, Check } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { storage } from '@/services/storage'
import type { Trip, DayPlan, PackingCategory } from '@/types'

const route = useRoute()
const router = useRouter()

const tripId = route.params.tripId as string
const trip = ref<Trip | null>(null)
const currentDayIndex = ref(1)
const activeTab = ref<'itinerary' | 'packing' | 'budget'>('itinerary')
const showSettings = ref(false)

const currentDay = computed<DayPlan | undefined>(() => {
  return trip.value?.days.find(d => d.dayIndex === currentDayIndex.value)
})

const budgetCategories = computed(() => {
  if (!trip.value?.totalBudget) return []
  const { breakdown } = trip.value.totalBudget
  return [
    { name: '住宿', value: breakdown.accommodation, color: 'bg-chart-2' },
    { name: '餐饮', value: breakdown.food, color: 'bg-chart-4' },
    { name: '交通', value: breakdown.transport, color: 'bg-chart-3' },
    { name: '门票', value: breakdown.tickets, color: 'bg-chart-1' },
    { name: '购物', value: breakdown.shopping, color: 'bg-chart-5' }
  ]
})

const maxBudget = computed(() => {
  return Math.max(...budgetCategories.value.map(b => b.value))
})

async function loadTrip() {
  try {
    trip.value = await storage.getTripDetail(tripId)
    if (!trip.value) {
      router.push('/')
    }
  } catch {
    router.push('/')
  }
}

async function togglePackingItem(category: PackingCategory, itemName: string) {
  const item = category.items.find(i => i.name === itemName)
  if (item) {
    item.checked = !item.checked
    await storage.saveTrip(trip.value!)
  }
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
    <AppHeader :title="trip?.tripName || '行程详情'" :showBack="true" @back="goBack" @settings="showSettings = true" />
    
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
          <span>{{ trip.days.length }}天</span>
          <span>{{ trip.budgetLevel }}</span>
        </div>
      </div>
      
      <div class="flex gap-2 mb-6">
        <button
          v-for="tab in ['itinerary', 'packing', 'budget'] as const"
          :key="tab"
          @click="activeTab = tab"
          class="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
          :class="activeTab === tab
            ? 'bg-primary text-primary-foreground'
            : 'bg-input text-foreground hover:bg-accent/30'"
        >
          {{ tab === 'itinerary' ? '行程' : tab === 'packing' ? '行李' : '预算' }}
        </button>
      </div>
      
      <div v-if="activeTab === 'itinerary'" class="space-y-6">
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            v-for="day in trip.days"
            :key="day.dayIndex"
            @click="currentDayIndex = day.dayIndex"
            class="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            :class="currentDayIndex === day.dayIndex
              ? 'bg-primary text-primary-foreground'
              : 'bg-input text-foreground hover:bg-accent/30'"
          >
            Day {{ day.dayIndex }}
          </button>
        </div>
        
        <div v-if="currentDay" class="space-y-6">
          <div class="bg-card rounded-2xl p-4 border border-border">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-lg font-medium text-foreground">{{ currentDay.theme }}</h3>
              <span class="text-sm text-muted-foreground">{{ currentDay.date }}</span>
            </div>
            <p v-if="currentDay.notes" class="text-sm text-muted-foreground">{{ currentDay.notes }}</p>
          </div>
          
          <div class="space-y-4">
            <h4 class="text-base font-medium text-foreground flex items-center gap-2">
              <MapPin class="w-5 h-5 text-primary" />
              景点
            </h4>
            <div
              v-for="(spot, index) in currentDay.spots"
              :key="index"
              class="bg-card rounded-xl p-4 border border-border"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h5 class="font-medium text-foreground">{{ spot.name }}</h5>
                  <span class="text-xs text-muted-foreground">{{ spot.type }}</span>
                </div>
                <span class="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock class="w-4 h-4" />
                  {{ spot.estimatedDuration }}
                </span>
              </div>
              <p class="text-sm text-muted-foreground mt-2">{{ spot.description }}</p>
              <div class="mt-3 bg-accent/30 rounded-lg p-2">
                <p class="text-xs text-accent-foreground">{{ spot.tips }}</p>
              </div>
            </div>
          </div>
          
          <div class="space-y-4">
            <h4 class="text-base font-medium text-foreground flex items-center gap-2">
              <Utensils class="w-5 h-5 text-primary" />
              餐饮
            </h4>
            <div
              v-for="(restaurant, index) in currentDay.restaurants"
              :key="index"
              class="bg-card rounded-xl p-4 border border-border"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h5 class="font-medium text-foreground">{{ restaurant.name }}</h5>
                  <span class="text-xs text-muted-foreground">{{ restaurant.type }}</span>
                </div>
                <span class="text-sm text-muted-foreground">{{ restaurant.priceRange }}</span>
              </div>
              <p class="text-sm text-muted-foreground mt-2">{{ restaurant.recommendation }}</p>
            </div>
          </div>
          
          <div class="space-y-4">
            <h4 class="text-base font-medium text-foreground flex items-center gap-2">
              <Bus class="w-5 h-5 text-primary" />
              交通
            </h4>
            <div
              v-for="(transport, index) in currentDay.transport"
              :key="index"
              class="bg-card rounded-xl p-4 border border-border"
            >
              <div class="flex items-center gap-3">
                <span class="font-medium text-foreground">{{ transport.from }}</span>
                <span class="text-muted-foreground">→</span>
                <span class="font-medium text-foreground">{{ transport.to }}</span>
              </div>
              <div class="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{{ transport.method }}</span>
                <span v-if="transport.cost">{{ transport.cost }}</span>
                <span>{{ transport.duration }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="activeTab === 'packing'" class="space-y-6">
        <div
          v-for="category in trip.packingList"
          :key="category.category"
          class="bg-card rounded-2xl p-4 border border-border"
        >
          <h4 class="font-medium text-foreground mb-3">{{ category.category }}</h4>
          <div class="space-y-2">
            <div
              v-for="item in category.items"
              :key="item.name"
              @click="togglePackingItem(category, item.name)"
              class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors"
              :class="item.checked ? 'bg-accent/30' : 'bg-input hover:bg-accent/20'"
            >
              <div
                class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                :class="item.checked ? 'bg-primary border-primary' : 'border-border'"
              >
                <Check v-if="item.checked" class="w-3 h-3 text-white" />
              </div>
              <span class="text-sm" :class="item.checked ? 'text-muted-foreground line-through' : 'text-foreground'">
                {{ item.name }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else-if="activeTab === 'budget'" class="space-y-6">
        <div class="bg-card rounded-2xl p-6 border border-border">
          <div class="text-center mb-6">
            <p class="text-sm text-muted-foreground mb-1">总预算</p>
            <p class="text-3xl font-medium text-foreground">
              {{ trip.totalBudget.currency }}{{ trip.totalBudget.estimatedTotal.toLocaleString() }}
            </p>
          </div>
          
          <div class="space-y-4">
            <div
              v-for="category in budgetCategories"
              :key="category.name"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-foreground">{{ category.name }}</span>
                <span class="text-sm text-muted-foreground">{{ category.value }}</span>
              </div>
              <div class="h-2 bg-input rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all"
                  :class="category.color"
                  :style="{ width: `${(category.value / maxBudget) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-accent/30 rounded-xl p-4">
          <p class="text-sm text-accent-foreground">
            <strong>提示：</strong>此预算为预估费用，实际花费可能会有所不同。
          </p>
        </div>
      </div>
    </main>
    
    <SettingsModal :visible="showSettings" @close="showSettings = false" @saved="handleSettingsSaved" />
  </div>
</template>
