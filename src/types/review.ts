import type { Expense } from './trip'

export interface DailyFeedback {
  dayIndex: number
  highlights?: string[]
  expenses?: Expense[]
  actualCost?: number
  feeling?: string
}

export interface ReviewInput {
  tripId: string
  dailyFeedback: DailyFeedback[]
}

export interface DailyCard {
  dayIndex: number
  date: string
  theme: string
  summary: string
  highlights: string[]
}

export interface Review {
  dailyCards: DailyCard[]
  momentsCopy: string[]
  budgetSummary: {
    estimatedTotal: number
    actualTotal: number
    variance: number
    comment: string
  }
}
