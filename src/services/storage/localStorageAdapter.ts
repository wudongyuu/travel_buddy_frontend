import type { IStorageAdapter } from './index'
import type { Trip, TripSummary, Adjustment, Expense, Review, AppSettings } from '@/types'
import { mockTrips } from './mockData'

const KEYS = {
  TRIP_LIST: 'luban_trip_list',
  TRIP_DETAIL: (tripId: string) => `luban_trip_detail_${tripId}`,
  ADJUSTMENTS: (tripId: string) => `luban_adjustments_${tripId}`,
  EXPENSES: (tripId: string, dayIndex: number) => `luban_expenses_${tripId}_${dayIndex}`,
  REVIEW: (tripId: string) => `luban_review_${tripId}`,
  SETTINGS: 'luban_settings'
}

export class LocalStorageAdapter implements IStorageAdapter {
  private getItem<T>(key: string): T | null {
    try {
      const value = localStorage.getItem(key)
      return value ? JSON.parse(value) : null
    } catch {
      return null
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {}
  }

  async getTripList(): Promise<TripSummary[]> {
    let tripList = this.getItem<TripSummary[]>(KEYS.TRIP_LIST) || []
    
    if (tripList.length === 0) {
      for (const trip of mockTrips) {
        await this.saveTrip(trip)
      }
      tripList = this.getItem<TripSummary[]>(KEYS.TRIP_LIST) || []
    }
    
    tripList.forEach(trip => {
      trip.status = this.calculateStatus(trip.startDate, trip.endDate)
    })
    
    return tripList
  }

  async getTripDetail(tripId: string): Promise<Trip | null> {
    const trip = this.getItem<Trip>(KEYS.TRIP_DETAIL(tripId))
    if (!trip) return null
    trip.status = this.calculateStatus(trip.startDate, trip.endDate)
    return trip
  }

  async saveTrip(trip: Trip): Promise<void> {
    const now = new Date().toISOString()
    trip.updatedAt = now
    
    const tripList = this.getItem<TripSummary[]>(KEYS.TRIP_LIST) || []
    const existingIndex = tripList.findIndex(t => t.tripId === trip.tripId)
    
    const summary: TripSummary = {
      tripId: trip.tripId,
      tripName: trip.tripName,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      days: trip.days.length,
      status: this.calculateStatus(trip.startDate, trip.endDate),
      budgetLevel: trip.budgetLevel,
      updatedAt: now
    }
    
    if (existingIndex >= 0) {
      tripList[existingIndex] = summary
    } else {
      tripList.push(summary)
    }
    
    this.setItem(KEYS.TRIP_LIST, tripList)
    this.setItem(KEYS.TRIP_DETAIL(trip.tripId), trip)
  }

  async deleteTrip(tripId: string): Promise<void> {
    const tripList = this.getItem<TripSummary[]>(KEYS.TRIP_LIST) || []
    const filteredList = tripList.filter(t => t.tripId !== tripId)
    this.setItem(KEYS.TRIP_LIST, filteredList)
    this.removeItem(KEYS.TRIP_DETAIL(tripId))
    this.removeItem(KEYS.ADJUSTMENTS(tripId))
    
    for (let i = 1; i <= 14; i++) {
      this.removeItem(KEYS.EXPENSES(tripId, i))
    }
    
    this.removeItem(KEYS.REVIEW(tripId))
  }

  async getAdjustments(tripId: string): Promise<Adjustment[]> {
    return this.getItem<Adjustment[]>(KEYS.ADJUSTMENTS(tripId)) || []
  }

  async saveAdjustment(tripId: string, adj: Adjustment): Promise<void> {
    const adjustments = this.getItem<Adjustment[]>(KEYS.ADJUSTMENTS(tripId)) || []
    adjustments.push(adj)
    this.setItem(KEYS.ADJUSTMENTS(tripId), adjustments)
  }

  async getExpenses(tripId: string, dayIndex: number): Promise<Expense[]> {
    return this.getItem<Expense[]>(KEYS.EXPENSES(tripId, dayIndex)) || []
  }

  async saveExpense(tripId: string, dayIndex: number, expense: Expense): Promise<void> {
    const expenses = this.getItem<Expense[]>(KEYS.EXPENSES(tripId, dayIndex)) || []
    const existingIndex = expenses.findIndex(e => e.expenseId === expense.expenseId)
    
    if (existingIndex >= 0) {
      expenses[existingIndex] = expense
    } else {
      expenses.push(expense)
    }
    
    this.setItem(KEYS.EXPENSES(tripId, dayIndex), expenses)
  }

  async deleteExpense(tripId: string, dayIndex: number, expenseId: string): Promise<void> {
    const expenses = this.getItem<Expense[]>(KEYS.EXPENSES(tripId, dayIndex)) || []
    const filtered = expenses.filter(e => e.expenseId !== expenseId)
    this.setItem(KEYS.EXPENSES(tripId, dayIndex), filtered)
  }

  async saveDailyFeedback(tripId: string, feedback: any): Promise<void> {
    if (feedback.expenses) {
      for (const expense of feedback.expenses) {
        await this.saveExpense(tripId, feedback.dayIndex, expense)
      }
    }
  }

  async getReview(tripId: string): Promise<Review | null> {
    return this.getItem<Review>(KEYS.REVIEW(tripId))
  }

  async saveReview(tripId: string, review: Review): Promise<void> {
    this.setItem(KEYS.REVIEW(tripId), review)
  }

  async getSettings(): Promise<AppSettings> {
    const settings = this.getItem<AppSettings>(KEYS.SETTINGS)
    return settings || { useMock: true }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.setItem(KEYS.SETTINGS, settings)
  }

  private calculateStatus(startDate: string, endDate: string): Trip['status'] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (today < start) return 'not_started'
    if (today > end) return 'completed'
    return 'ongoing'
  }
}

export const storage: IStorageAdapter = new LocalStorageAdapter()
