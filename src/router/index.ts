import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'TripOverview',
    component: () => import('@/views/TripOverview.vue')
  },
  {
    path: '/create',
    name: 'CreateTrip',
    component: () => import('@/views/CreateTrip.vue')
  },
  {
    path: '/detail/:tripId',
    name: 'TripDetail',
    component: () => import('@/views/TripDetail.vue')
  },
  {
    path: '/ongoing/:tripId',
    name: 'OnGoing',
    component: () => import('@/views/OnGoing.vue')
  },
  {
    path: '/review/:tripId',
    name: 'Review',
    component: () => import('@/views/Review.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
