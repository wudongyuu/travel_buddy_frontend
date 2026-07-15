import type { Trip, AdjustmentResult, Review } from '@/types'

function createMockTrip(tripId: string, tripName: string, destination: string, daysOffset: number): Trip {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() + daysOffset)
  
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 4)
  
  const dayPlans = []
  for (let i = 1; i <= 5; i++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(dayDate.getDate() + i - 1)
    
    const themes = ['古都与寺庙', '金阁与哲学之道', '东山区漫步', '伏见稻荷与宇治', '告别京都']
    const spotsList = [
      [{ name: '清水寺', type: '景点', description: '世界文化遗产', estimatedDuration: '2小时', tips: '建议早8点前到达' },
       { name: '二三年坂', type: '景点', description: '传统石板路', estimatedDuration: '1.5小时', tips: '购买伴手礼' },
       { name: '祇园', type: '景点', description: '艺伎区', estimatedDuration: '1小时', tips: '傍晚可能遇到艺伎' }],
      [{ name: '金阁寺', type: '景点', description: '金箔舍利殿', estimatedDuration: '1.5小时', tips: '清晨人少' },
       { name: '龙安寺', type: '景点', description: '枯山水庭院', estimatedDuration: '1小时', tips: '感受禅意' },
       { name: '哲学之道', type: '景点', description: '樱花散步道', estimatedDuration: '2小时', tips: '从南向北走' }],
      [{ name: '八坂神社', type: '景点', description: '古老神社', estimatedDuration: '1小时', tips: '参观后进入祇园' },
       { name: '平安神宫', type: '景点', description: '神苑广阔', estimatedDuration: '2小时', tips: '美丽的池塘' },
       { name: '鸭川', type: '景点', description: '美丽河流', estimatedDuration: '1小时', tips: '夏天川床纳凉' }],
      [{ name: '伏见稻荷大社', type: '景点', description: '千本鸟居', estimatedDuration: '3小时', tips: '建议早上去' },
       { name: '宇治上神社', type: '景点', description: '世界文化遗产', estimatedDuration: '1小时', tips: '与平等院相邻' },
       { name: '平等院凤凰堂', type: '景点', description: '平安时代建筑', estimatedDuration: '1.5小时', tips: '内部禁止拍照' }],
      [{ name: '京都站', type: '景点', description: '交通枢纽', estimatedDuration: '1小时', tips: '拉面小路' },
       { name: '东寺', type: '景点', description: '五重塔', estimatedDuration: '1.5小时', tips: '距离京都站很近' }]
    ]
    
    dayPlans.push({
      dayIndex: i,
      date: dayDate.toISOString().split('T')[0],
      theme: themes[i - 1],
      spots: spotsList[i - 1],
      restaurants: i === 1 ? [{ name: '奥丹豆腐', type: '日式料理', priceRange: '¥2,000~¥4,000', recommendation: '创业于1636年' }] :
                   i === 2 ? [{ name: '弘法', type: '京料理', priceRange: '¥3,000~¥5,000', recommendation: '金阁寺附近' }] :
                   i === 3 ? [{ name: '木屋町通り居酒屋', type: '居酒屋', priceRange: '¥1,500~¥3,000', recommendation: '鸭川旁' }] :
                   i === 4 ? [{ name: '中村藤吉', type: '抹茶料理', priceRange: '¥2,000~¥4,000', recommendation: '宇治抹茶' }] :
                   [{ name: '一兰拉面', type: '拉面', priceRange: '¥1,000~¥1,500', recommendation: '京都站分店' }],
      transport: [{ from: '京都站', to: '景点', method: '公交', cost: '¥230', duration: '20分钟' }],
      dailyBudget: 1700,
      notes: i === 1 ? '今日步行较多，建议穿舒适鞋子' : ''
    })
  }
  
  return {
    tripId,
    tripName,
    destination,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    days: dayPlans,
    budgetLevel: '舒适型',
    interests: ['美食', '人文', '自然'],
    pace: '标准',
    totalBudget: {
      currency: 'CNY',
      estimatedTotal: 8500,
      breakdown: {
        accommodation: 2500,
        food: 2000,
        transport: 1500,
        tickets: 1500,
        shopping: 1000
      }
    },
    packingList: [
      {
        category: '证件',
        items: [
          { name: '护照', checked: false },
          { name: '签证', checked: false },
          { name: '身份证', checked: false },
          { name: '机票行程单', checked: false },
          { name: '酒店确认函', checked: false }
        ]
      },
      {
        category: '衣物',
        items: [
          { name: 'T恤 x3', checked: false },
          { name: '轻薄外套 x1', checked: false },
          { name: '长裤 x2', checked: false },
          { name: '舒适步行鞋 x1', checked: false },
          { name: '袜子 x4', checked: false }
        ]
      },
      {
        category: '电子产品',
        items: [
          { name: '充电宝', checked: false },
          { name: '转换插头', checked: false },
          { name: '相机及存储卡', checked: false }
        ]
      },
      {
        category: '其他',
        items: [
          { name: '防晒霜', checked: false },
          { name: '便携雨伞', checked: false },
          { name: '常用药品', checked: false }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'not_started'
  }
}

export const mockTrips: Trip[] = [
  createMockTrip('mock-trip-past', '东京4日游', '日本东京', -10),
  createMockTrip('mock-trip-ongoing', '巴厘岛5日游', '印度尼西亚巴厘岛', -1),
  createMockTrip('mock-trip-future', '京都5日深度游', '日本京都', 10)
]

export const mockAdjustmentResult: AdjustmentResult = {
  originalPlan: {
    currentSpot: '金阁寺',
    nextSpots: ['龙安寺', '仁和寺']
  },
  suggestion: {
    reason: '雨天建议改为室内文化体验',
    newSpot: {
      name: '京都铁道博物馆',
      type: '室内景点',
      description: '日本最大铁道博物馆，展示了从蒸汽机车到新干线的发展历程',
      estimatedDuration: '2.5小时',
      tips: '有模拟驾驶体验，非常有趣',
      estimatedCost: '¥1200'
    },
    savedTimeOrCost: '节省步行时间40分钟，交通费降低¥300'
  },
  alternatives: [
    { name: '京都水族馆', reason: '室内场馆，适合雨天' },
    { name: '国立博物馆', reason: '丰富的文物展览，增长知识' }
  ]
}

export const mockReview: Review = {
  dailyCards: [
    {
      dayIndex: 1,
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: '古都与寺庙',
      summary: '清晨的清水寺避开人潮，奥丹豆腐令人难忘。',
      highlights: ['清水寺日落', '百年豆腐店']
    },
    {
      dayIndex: 2,
      date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: '金阁与哲学之道',
      summary: '金阁寺的金色倒映在镜湖中，哲学之道的樱花美不胜收。',
      highlights: ['金阁寺晨景', '哲学之道漫步']
    },
    {
      dayIndex: 3,
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: '东山区漫步',
      summary: '八坂神社的朱红色鸟居，鸭川边的悠闲时光。',
      highlights: ['八坂神社', '鸭川纳凉']
    },
    {
      dayIndex: 4,
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: '伏见稻荷与宇治',
      summary: '千本鸟居的壮观令人震撼，宇治抹茶回味无穷。',
      highlights: ['千本鸟居', '中村藤吉抹茶']
    },
    {
      dayIndex: 5,
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      theme: '告别京都',
      summary: '在京都站吃了最后一碗拉面，带着满满的回忆离开。',
      highlights: ['京都站拉面', '五重塔']
    }
  ],
  momentsCopy: [
    '京都5日 | 从清水寺的晨光到伏见稻荷的千本鸟居，这座千年古都用每一处细节打动着我。',
    '在京都的日子：古寺钟声、抹茶香气、石板路上的脚步声，这就是我向往的旅行。',
    '京都游记：五天时间，我走过了金阁寺的金光、哲学之道的樱花、千本鸟居的红色长廊。'
  ],
  budgetSummary: {
    estimatedTotal: 8500,
    actualTotal: 8200,
    variance: -300,
    comment: '整体控制在预算内，交通比预期节省。'
  }
}
