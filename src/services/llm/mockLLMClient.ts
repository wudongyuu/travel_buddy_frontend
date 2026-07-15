import type { ILLMClient } from './index'
import type { TripInput, Trip, AdjustmentContext, AdjustmentResult, ReviewInput, Review, DayPlan } from '@/types'
import { mockTrips, mockAdjustmentResult, mockReview } from '@/services/storage/mockData'

export class MockLLMClient implements ILLMClient {
  async generateTrip(input: TripInput): Promise<Trip> {
    await this.delay(1500)
    
    const endDate = new Date(input.startDate)
    endDate.setDate(endDate.getDate() + input.days - 1)
    
    const baseTrip = mockTrips[0]
    
    const adjustedDays = baseTrip.days.slice(0, input.days).map((day: DayPlan, index: number) => ({
      ...day,
      dayIndex: index + 1,
      date: this.calculateDate(input.startDate, index)
    }))
    
    return {
      ...baseTrip,
      tripId: crypto.randomUUID(),
      tripName: `${input.destination}${input.days}日游`,
      destination: input.destination,
      startDate: input.startDate,
      endDate: endDate.toISOString().split('T')[0],
      days: adjustedDays,
      budgetLevel: input.budgetLevel,
      interests: input.interests,
      pace: input.pace,
      notes: input.notes,
      totalBudget: {
        ...baseTrip.totalBudget,
        estimatedTotal: Math.round(baseTrip.totalBudget.estimatedTotal * (input.days / baseTrip.days.length))
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'not_started'
    }
  }

  async generateAdjustment(_ctx: AdjustmentContext): Promise<AdjustmentResult> {
    await this.delay(1500)
    return { ...mockAdjustmentResult }
  }

  async generateReview(input: ReviewInput): Promise<Review> {
    await this.delay(1500)
    
    const actualTotal = input.dailyFeedback.reduce((sum, fb) => {
      return sum + (fb.actualCost || fb.expenses?.reduce((s, e) => s + e.amount, 0) || 0)
    }, 0)
    
    return {
      ...mockReview,
      budgetSummary: {
        ...mockReview.budgetSummary,
        actualTotal,
        variance: mockReview.budgetSummary.estimatedTotal - actualTotal,
        comment: actualTotal <= mockReview.budgetSummary.estimatedTotal 
          ? '整体控制在预算内，表现不错！' 
          : '超出预算，下次可以更好地控制花费。'
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateDate(startDate: string, offset: number): string {
    const date = new Date(startDate)
    date.setDate(date.getDate() + offset)
    return date.toISOString().split('T')[0]
  }
}

export const llm: ILLMClient = new MockLLMClient()
