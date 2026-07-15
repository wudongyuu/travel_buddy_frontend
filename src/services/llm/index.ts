import type { TripInput, Trip, AdjustmentContext, AdjustmentResult, ReviewInput, Review } from '@/types'

export interface ILLMClient {
  generateTrip(input: TripInput): Promise<Trip>
  generateAdjustment(ctx: AdjustmentContext): Promise<AdjustmentResult>
  generateReview(input: ReviewInput): Promise<Review>
}

export { llm } from './mockLLMClient'
