<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2, Plus } from '@lucide/vue'
import AppHeader from '@/components/AppHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import FAB from '@/components/FAB.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import Modal from '@/components/Modal.vue'
import Toast from '@/components/Toast.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import { storage } from '@/services/storage'
import type { TripSummary, TripStatus } from '@/types'

const router = useRouter()

const tripList = ref<TripSummary[]>([])
const loading = ref(true)
const showDeleteConfirm = ref(false)
const deletingTripId = ref<string | null>(null)
const showSettings = ref(false)
const showFirstTimeModal = ref(false)

const toast = ref({
  visible: false,
  message: '',
  type: 'success' as 'success' | 'error' | 'info'
})

const groupedTrips = computed(() => {
  const groups: Record<TripStatus, TripSummary[]> = {
    not_started: [],
    ongoing: [],
    completed: []
  }
  
  tripList.value.forEach(trip => {
    const status = calculateStatus(trip.startDate, trip.endDate)
    groups[status].push({ ...trip, status })
  })
  
  return groups
})

async function loadTripList() {
  loading.value = true
  try {
    tripList.value = await storage.getTripList()
  } catch (error) {
    showToast('加载行程列表失败', 'error')
  } finally {
    loading.value = false
  }
}

function calculateStatus(startDate: string, endDate: string): TripStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (today < start) return 'not_started'
  if (today > end) return 'completed'
  return 'ongoing'
}

function getStatusRoute(status: TripStatus, tripId: string): string {
  switch (status) {
    case 'not_started':
      return `/detail/${tripId}`
    case 'ongoing':
      return `/ongoing/${tripId}`
    case 'completed':
      return `/review/${tripId}`
    default:
      return `/detail/${tripId}`
  }
}

function goToCreate() {
  router.push('/create')
}

function confirmDelete(tripId: string) {
  deletingTripId.value = tripId
  showDeleteConfirm.value = true
}

async function deleteTrip() {
  if (!deletingTripId.value) return
  
  try {
    await storage.deleteTrip(deletingTripId.value)
    await loadTripList()
    showToast('行程删除成功', 'success')
  } catch (error) {
    showToast('删除失败', 'error')
  } finally {
    showDeleteConfirm.value = false
    deletingTripId.value = null
  }
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
  toast.value = { visible: true, message, type }
}

function closeToast() {
  toast.value.visible = false
}

function handleSettingsSaved() {
  showSettings.value = false
  showToast('设置保存成功', 'success')
}

function goToDetail(trip: TripSummary) {
  const route = getStatusRoute(trip.status, trip.tripId)
  router.push(route)
}

onMounted(async () => {
  await loadTripList()
  
  const settings = await storage.getSettings()
  if (!settings.apiKey && !settings.hasShownFirstTime) {
    showFirstTimeModal.value = true
    await storage.saveSettings({ ...settings, hasShownFirstTime: true })
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppHeader title="旅伴" @settings="showSettings = true" />
    
    <main class="pt-14 pb-24 md:pb-8 px-4 max-w-[720px] mx-auto">
      <div class="mt-6">
        <h2 class="text-2xl font-medium text-foreground mb-2">我的行程</h2>
        <p class="text-sm text-muted-foreground">探索世界的每一个角落</p>
      </div>
      
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-accent border-t-primary rounded-full animate-spin"></div>
      </div>
      
      <template v-else>
        <div class="flex flex-col gap-8 md:grid md:grid-cols-3 md:gap-6">
          <section class="order-2 md:order-1">
            <div class="flex items-center gap-2 mb-3">
              <h3 class="text-base font-semibold text-foreground">未开始</h3>
              <span class="inline-flex h-5 min-w-5 items-center justify-center px-1.5 text-xs font-semibold bg-muted text-muted-foreground rounded-full">
                {{ groupedTrips.not_started.length }}
              </span>
            </div>
            <div v-if="groupedTrips.not_started.length === 0" class="bg-muted/50 rounded-2xl p-6 text-center">
              <p class="text-sm text-muted-foreground">暂无未开始的行程</p>
            </div>
            <div v-else class="flex flex-col gap-3">
              <div
                v-for="trip in groupedTrips.not_started"
                :key="trip.tripId"
                class="block p-4 bg-card border border-border rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
                @click="goToDetail(trip)"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="truncate text-base font-semibold text-card-foreground">{{ trip.tripName }}</h4>
                  <StatusBadge :status="trip.status" />
                </div>
                <p class="mt-2 text-sm text-muted-foreground">{{ trip.startDate }} - {{ trip.endDate }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ trip.budgetLevel }}</p>
              </div>
            </div>
          </section>
          
          <section class="order-1 md:order-2">
            <div class="flex items-center gap-2 mb-3">
              <h3 class="text-base font-semibold text-foreground">进行中</h3>
              <span class="inline-flex h-5 min-w-5 items-center justify-center px-1.5 text-xs font-semibold bg-secondary text-secondary-foreground rounded-full">
                {{ groupedTrips.ongoing.length }}
              </span>
            </div>
            <div v-if="groupedTrips.ongoing.length === 0" class="bg-muted/50 rounded-2xl p-6 text-center">
              <p class="text-sm text-muted-foreground">暂无进行中的行程</p>
            </div>
            <div v-else class="flex flex-col gap-3">
              <div
                v-for="trip in groupedTrips.ongoing"
                :key="trip.tripId"
                class="block p-4 bg-card border border-border rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
                @click="goToDetail(trip)"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="truncate text-base font-semibold text-card-foreground">{{ trip.tripName }}</h4>
                  <StatusBadge :status="trip.status" />
                </div>
                <p class="mt-2 text-sm text-muted-foreground">{{ trip.startDate }} - {{ trip.endDate }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ trip.budgetLevel }}</p>
              </div>
            </div>
          </section>
          
          <section class="order-3">
            <div class="flex items-center gap-2 mb-3">
              <h3 class="text-base font-semibold text-foreground">已完成</h3>
              <span class="inline-flex h-5 min-w-5 items-center justify-center px-1.5 text-xs font-semibold bg-muted text-muted-foreground rounded-full">
                {{ groupedTrips.completed.length }}
              </span>
            </div>
            <div v-if="groupedTrips.completed.length === 0" class="bg-muted/50 rounded-2xl p-6 text-center">
              <p class="text-sm text-muted-foreground">暂无已完成的行程</p>
            </div>
            <div v-else class="flex flex-col gap-3">
              <div
                v-for="trip in groupedTrips.completed"
                :key="trip.tripId"
                class="block p-4 bg-card border border-border rounded-2xl transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer relative"
                @click="goToDetail(trip)"
              >
                <button
                  @click.stop="confirmDelete(trip.tripId)"
                  class="absolute right-2 top-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 hover:opacity-100"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
                <div class="flex items-start justify-between gap-2">
                  <h4 class="truncate text-base font-semibold text-card-foreground">{{ trip.tripName }}</h4>
                  <StatusBadge :status="trip.status" />
                </div>
                <p class="mt-2 text-sm text-muted-foreground">{{ trip.startDate }} - {{ trip.endDate }}</p>
                <p class="mt-1 text-sm text-muted-foreground">{{ trip.budgetLevel }}</p>
              </div>
            </div>
          </section>
        </div>
        
        <div v-if="tripList.length === 0" class="mt-12 text-center">
          <div class="w-24 h-24 mx-auto bg-accent/30 rounded-full flex items-center justify-center mb-4">
            <Plus class="w-10 h-10 text-primary" />
          </div>
          <h3 class="text-xl font-medium text-foreground mb-2">开始你的旅程</h3>
          <p class="text-muted-foreground mb-6">创建第一个行程，开启美好的旅行时光</p>
          <button
            @click="goToCreate"
            class="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            新建行程
          </button>
        </div>
      </template>
    </main>
    
    <FAB v-if="tripList.length > 0" @click="goToCreate" />
    
    <BottomNav active="/" @navigate="router.push" />
    
    <Modal :visible="showDeleteConfirm" title="确认删除">
      <p class="text-muted-foreground mb-6">确定要删除这个行程吗？此操作无法撤销。</p>
      <div class="flex gap-4">
        <button
          @click="showDeleteConfirm = false"
          class="flex-1 py-3 bg-muted text-foreground rounded-xl font-medium"
        >
          取消
        </button>
        <button
          @click="deleteTrip"
          class="flex-1 py-3 bg-destructive text-destructive-foreground rounded-xl font-medium"
        >
          删除
        </button>
      </div>
    </Modal>
    
    <SettingsModal :visible="showSettings" @close="showSettings = false" @saved="handleSettingsSaved" />
    
    <SettingsModal :visible="showFirstTimeModal" @close="showFirstTimeModal = false" @saved="handleSettingsSaved" />
    
    <Toast
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="closeToast"
    />
  </div>
</template>
