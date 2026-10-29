import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { KeywordDTO } from '@/lib/yt/types'

export const dynamic = 'force-dynamic'

type SortField = 'volume' | 'growth' | 'competition' | 'difficulty' | 'cpc' | 'term'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const category = sp.get('category') ?? ''
    const q = (sp.get('q') ?? '').trim().toLowerCase()
    const sort = (sp.get('sort') ?? 'volume') as SortField
    const order = sp.get('order') === 'asc' ? 'asc' : 'desc'

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    const cat = await db.category.findUnique({ where: { slug: category } })
    if (!cat) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const kws = await db.keyword.findMany({
      where: {
        categoryId: cat.id,
        ...(q ? { term: { contains: q } } : {}),
      },
    })

    const items: KeywordDTO[] = kws.map((k) => ({
      id: k.id,
      term: k.term,
      volume: k.volume,
      competition: k.competition,
      difficulty: k.difficulty,
      growth: k.growth,
      cpc: k.cpc,
      isRising: k.isRising,
      trend: JSON.parse(k.trend) as number[],
      categorySlug: cat.slug,
      categoryName: cat.name,
      categoryColor: cat.color,
    }))

    // sorting (SQLite contains is case-insensitive for ASCII; filter again for safety)
    const filtered = q ? items.filter((k) => k.term.toLowerCase().includes(q)) : items
    filtered.sort((a, b) => {
      if (sort === 'term') return order === 'asc' ? a.term.localeCompare(b.term) : b.term.localeCompare(a.term)
      return order === 'asc' ? a[sort] - b[sort] : b[sort] - a[sort]
    })

    const catStats = {
      slug: cat.slug,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      keywordCount: items.length,
      totalVolume: items.reduce((s, k) => s + k.volume, 0),
      avgGrowth: items.length ? Math.round((items.reduce((s, k) => s + k.growth, 0) / items.length) * 10) / 10 : 0,
      avgDifficulty: items.length ? Math.round(items.reduce((s, k) => s + k.difficulty, 0) / items.length) : 0,
      avgCompetition: items.length ? Math.round(items.reduce((s, k) => s + k.competition, 0) / items.length) : 0,
    }

    return NextResponse.json({ category: catStats, keywords: filtered })
  } catch (err) {
    console.error('keywords error', err)
    return NextResponse.json({ error: 'Failed to load keywords' }, { status: 500 })
  }
}
