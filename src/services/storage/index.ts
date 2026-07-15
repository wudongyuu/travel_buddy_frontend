import type { Trip, TripSummary, Adjustment, Expense, Review, AppSettings } from '@/types'

export interface IStorageAdapter {
  getTripList(): Promise<TripSummary[]>
  getTripDetail(tripId: string): Promise<Trip | null>
  saveTrip(trip: Trip): Promise<void>
  deleteTrip(tripId: string): Promise<void>

  getAdjustments(tripId: string): Promise<Adjustment[]>
  saveAdjustment(tripId: string, adj: Adjustment): Promise<void>

  getExpenses(tripId: string, dayIndex: number): Promise<Expense[]>
  saveExpense(tripId: string, dayIndex: number, expense: Expense): Promise<void>
  deleteExpense(tripId: string, dayIndex: number, expenseId: string): Promise<void>

  saveDailyFeedback(tripId: string, feedback: any): Promise<void>

  getReview(tripId: string): Promise<Review | null>
  saveReview(tripId: string, review: Review): Promise<void>

  getSettings(): Promise<AppSettings>
  saveSettings(settings: AppSettings): Promise<void>
}

export { storage } from './localStorageAdapter'
