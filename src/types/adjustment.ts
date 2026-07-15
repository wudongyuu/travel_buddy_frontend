import type { Spot, Priority } from './trip'

export interface AdjustmentContext {
  tripId: string
  dayIndex: number
  currentSpotName: string
  userContext: string
  priority?: Priority
}

export interface AdjustmentResult {
  originalPlan: {
    currentSpot: string
    nextSpots: string[]
  }
  suggestion: {
    reason: string
    newSpot: Spot & { estimatedCost: string }
    savedTimeOrCost: string
  }
  alternatives: { name: string; reason: string }[]
}

export interface Adjustment extends AdjustmentResult {
  adjustmentId: string
  createdAt: string
}
