// Shared types for the YouTube keyword research app

export interface KeywordDTO {
  id: string
  term: string
  volume: number
  competition: number
  difficulty: number
  growth: number
  cpc: number
  isRising: boolean
  trend: number[]
  categorySlug?: string
  categoryName?: string
  categoryColor?: string
}

export interface CategoryStatsDTO {
  slug: string
  name: string
  icon: string
  color: string
  description: string
  keywordCount: number
  totalVolume: number
  avgGrowth: number
  risingCount: number
  topKeyword: { term: string; volume: number } | null
}

export interface OverviewDTO {
  categories: CategoryStatsDTO[]
  globalStats: {
    totalKeywords: number
    totalCategories: number
    totalVolume: number
    risingKeywords: number
    avgDifficulty: number
  }
  trending: KeywordDTO[]
}

export interface AnalyzeDTO {
  query: string
  source: 'exact' | 'pattern' | 'estimated'
  matchedCategory: { slug: string; name: string } | null
  metrics: {
    volume: number
    competition: number
    difficulty: number
    growth: number
    cpc: number
  }
  trend: number[]
  verdict: { label: string; tone: 'great' | 'good' | 'fair' | 'hard' }
  related: KeywordDTO[]
}
