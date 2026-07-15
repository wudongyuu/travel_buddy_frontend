export type BudgetLevel = '经济型' | '舒适型' | '豪华型'
export type Pace = '紧凑' | '标准' | '休闲'
export type TripStatus = 'not_started' | 'ongoing' | 'completed'
export type Interest = '美食' | '人文' | '自然' | '购物' | '摄影' | '户外' | '历史' | '艺术'
export type Priority = '预算优先' | '时间优先' | '体验优先'

export interface TripInput {
  destination: string
  startDate: string
  days: number
  budgetLevel: BudgetLevel
  interests: Interest[]
  pace: Pace
  notes?: string
}

export interface TripSummary {
  tripId: string
  tripName: string
  destination: string
  startDate: string
  endDate: string
  days: number
  status: TripStatus
  budgetLevel: BudgetLevel
  updatedAt: string
}

export interface Budget {
  currency: string
  estimatedTotal: number
  breakdown: {
    accommodation: number
    food: number
    transport: number
    tickets: number
    shopping: number
  }
}

export interface Spot {
  name: string
  type: string
  description: string
  estimatedDuration: string
  tips: string
}

export interface Restaurant {
  name: string
  type: string
  priceRange: string
  recommendation: string
}

export interface Transport {
  from: string
  to: string
  method: string
  cost: string
  duration: string
}

export interface DayPlan {
  dayIndex: number
  date: string
  theme: string
  spots: Spot[]
  restaurants: Restaurant[]
  transport: Transport[]
  dailyBudget: number
  notes: string
}

export interface PackingItem {
  name: string
  checked: boolean
}

export interface PackingCategory {
  category: string
  items: PackingItem[]
}

export type ExpenseCategory = '餐饮' | '交通' | '门票' | '住宿' | '购物' | '其他'

export interface Expense {
  expenseId: string
  category: ExpenseCategory
  amount: number
  description?: string
  createdAt: string
}

export interface Trip extends Omit<TripInput, 'days'>, Omit<TripSummary, 'days'> {
  totalBudget: Budget
  packingList: PackingCategory[]
  days: DayPlan[]
  createdAt: string
}
