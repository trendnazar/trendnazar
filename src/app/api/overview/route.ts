import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { CategoryStatsDTO, KeywordDTO, OverviewDTO } from '@/lib/yt/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      include: {
        keywords: {
          orderBy: { volume: 'desc' },
        },
      },
    })

    const catStats: CategoryStatsDTO[] = categories
      .map((c) => {
        const kws = c.keywords
        const totalVolume = kws.reduce((s, k) => s + k.volume, 0)
        const avgGrowth = kws.length ? kws.reduce((s, k) => s + k.growth, 0) / kws.length : 0
        const risingCount = kws.filter((k) => k.isRising).length
        const top = kws[0]
        return {
          slug: c.slug,
          name: c.name,
          icon: c.icon,
          color: c.color,
          description: c.description,
          keywordCount: kws.length,
          totalVolume,
          avgGrowth: Math.round(avgGrowth * 10) / 10,
          risingCount,
          topKeyword: top ? { term: top.term, volume: top.volume } : null,
        }
      })
      .sort((a, b) => b.totalVolume - a.totalVolume)

    const allKeywords = categories.flatMap((c) => c.keywords)
    const globalStats = {
      totalKeywords: allKeywords.length,
      totalCategories: categories.length,
      totalVolume: allKeywords.reduce((s, k) => s + k.volume, 0),
      risingKeywords: allKeywords.filter((k) => k.isRising).length,
      avgDifficulty: allKeywords.length
        ? Math.round(allKeywords.reduce((s, k) => s + k.difficulty, 0) / allKeywords.length)
        : 0,
    }

    // Trending across YouTube: top rising keywords by momentum (growth weighted by volume)
    const slugMap = new Map(categories.map((c) => [c.id, c]))
    const trending: KeywordDTO[] = allKeywords
      .filter((k) => k.isRising)
      .sort((a, b) => b.growth * Math.log10(b.volume) - a.growth * Math.log10(a.volume))
      .slice(0, 12)
      .map((k) => {
        const c = slugMap.get(k.categoryId)
        return {
          id: k.id,
          term: k.term,
          volume: k.volume,
          competition: k.competition,
          difficulty: k.difficulty,
          growth: k.growth,
          cpc: k.cpc,
          isRising: k.isRising,
          trend: JSON.parse(k.trend) as number[],
          categorySlug: c?.slug,
          categoryName: c?.name,
          categoryColor: c?.color,
        }
      })

    const payload: OverviewDTO = { categories: catStats, globalStats, trending }
    return NextResponse.json(payload)
  } catch (err) {
    console.error('overview error', err)
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 })
  }
}
