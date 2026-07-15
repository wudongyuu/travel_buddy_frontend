import type { ILLMClient } from './index'
import type { TripInput, Trip, AdjustmentContext, AdjustmentResult, ReviewInput, Review } from '@/types'
import { storage } from '@/services/storage'

export class DirectLLMClient implements ILLMClient {
  async generateTrip(input: TripInput): Promise<Trip> {
    const settings = await storage.getSettings()
    const apiKey = settings.apiKey
    
    if (!apiKey) {
      throw new Error('API Key 未设置，请在设置中配置')
    }
    
    const prompt = this.buildTripPrompt(input)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || '生成行程失败')
    }
    
    const tripData = JSON.parse(data.choices[0].message.content)
    return this.transformTripData(tripData, input)
  }

  async generateAdjustment(ctx: AdjustmentContext): Promise<AdjustmentResult> {
    const settings = await storage.getSettings()
    const apiKey = settings.apiKey
    
    if (!apiKey) {
      throw new Error('API Key 未设置，请在设置中配置')
    }
    
    const prompt = this.buildAdjustmentPrompt(ctx)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || '生成调整建议失败')
    }
    
    return JSON.parse(data.choices[0].message.content)
  }

  async generateReview(input: ReviewInput): Promise<Review> {
    const settings = await storage.getSettings()
    const apiKey = settings.apiKey
    
    if (!apiKey) {
      throw new Error('API Key 未设置，请在设置中配置')
    }
    
    const prompt = this.buildReviewPrompt(input)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      })
    })
    
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error?.message || '生成回顾失败')
    }
    
    return JSON.parse(data.choices[0].message.content)
  }

  private buildTripPrompt(input: TripInput): string {
    return `
你是一个专业的旅行规划师。请根据以下输入生成详细的旅行行程方案，返回严格的JSON格式。

输入信息：
- 目的地：${input.destination}
- 出发日期：${input.startDate}
- 行程天数：${input.days}天
- 预算等级：${input.budgetLevel}
- 兴趣爱好：${input.interests.join('、')}
- 旅行节奏：${input.pace}
- 备注：${input.notes || '无'}

请返回以下JSON结构：
{
  "tripName": "行程名称",
  "destination": "目的地",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "days": [
    {
      "dayIndex": 天数序号(从1开始),
      "date": "YYYY-MM-DD",
      "theme": "当日主题",
      "spots": [
        {
          "name": "景点名称",
          "type": "景点类型",
          "description": "景点描述",
          "estimatedDuration": "建议时长",
          "tips": "游玩小贴士"
        }
      ],
      "restaurants": [
        {
          "name": "餐厅名称",
          "type": "菜系类型",
          "priceRange": "价格范围",
          "recommendation": "推荐理由"
        }
      ],
      "transport": [
        {
          "from": "出发地",
          "to": "目的地",
          "method": "交通方式",
          "cost": "费用",
          "duration": "耗时"
        }
      ],
      "dailyBudget": 当日预算(数字),
      "notes": "备注"
    }
  ],
  "totalBudget": {
    "currency": "CNY",
    "estimatedTotal": 总预算(数字),
    "breakdown": {
      "accommodation": 住宿预算(数字),
      "food": 餐饮预算(数字),
      "transport": 交通预算(数字),
      "tickets": 门票预算(数字),
      "shopping": 购物预算(数字)
    }
  },
  "packingList": [
    {
      "category": "分类名称",
      "items": [
        {"name": "物品名称", "checked": false}
      ]
    }
  ],
  "budgetLevel": "预算等级",
  "interests": ["兴趣标签"],
  "pace": "旅行节奏"
}

请确保生成的行程符合预算等级和旅行节奏，兴趣标签要在行程中有所体现。
`
  }

  private buildAdjustmentPrompt(ctx: AdjustmentContext): string {
    return `
你是一个旅行应变专家。用户在旅行中遇到了突发状况，请根据当前信息提供替代方案建议。

当前信息：
- 当前景点：${ctx.currentSpotName}
- 遇到的问题：${ctx.userContext}
- 优先级：${ctx.priority || '体验优先'}

请返回以下JSON结构：
{
  "originalPlan": {
    "currentSpot": "当前景点名称",
    "nextSpots": ["接下来的景点名称"]
  },
  "suggestion": {
    "reason": "建议理由",
    "newSpot": {
      "name": "推荐景点名称",
      "type": "景点类型",
      "description": "景点描述",
      "estimatedDuration": "建议时长",
      "tips": "游玩小贴士",
      "estimatedCost": "预估费用"
    },
    "savedTimeOrCost": "节省的时间或费用"
  },
  "alternatives": [
    {"name": "备选景点名称", "reason": "推荐理由"}
  ]
}
`
  }

  private buildReviewPrompt(input: ReviewInput): string {
    return `
你是一个旅行记录专家。请根据用户的每日反馈生成精美的旅行回顾。

行程信息：${JSON.stringify(input)}

请返回以下JSON结构：
{
  "dailyCards": [
    {
      "dayIndex": 天数序号,
      "date": "YYYY-MM-DD",
      "theme": "当日主题",
      "summary": "当日总结",
      "highlights": ["高光时刻"]
    }
  ],
  "momentsCopy": ["朋友圈文案1", "朋友圈文案2", "朋友圈文案3"],
  "budgetSummary": {
    "estimatedTotal": 预估总预算,
    "actualTotal": 实际总花费,
    "variance": 差额,
    "comment": "预算分析评论"
  }
}
`
  }

  private transformTripData(data: unknown, input: TripInput): Trip {
    const tripData = data as Omit<Trip, 'tripId' | 'createdAt' | 'updatedAt' | 'status'>
    
    const endDate = new Date(input.startDate)
    endDate.setDate(endDate.getDate() + input.days - 1)
    
    return {
      ...tripData,
      tripId: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'not_started',
      endDate: endDate.toISOString().split('T')[0]
    } as Trip
  }
}
