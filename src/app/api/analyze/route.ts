import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { AnalyzeDTO, KeywordDTO } from '@/lib/yt/types'

export const dynamic = 'force-dynamic'

const STOP_WORDS = new Set(['how', 'to', 'for', 'the', 'a', 'an', 'in', 'on', 'of', 'and', 'best', 'vs'])

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function estimateTrend(term: string, volume: number, growth: number): number[] {
  const rnd = mulberry32(hashStr(term))
  const start = volume / (1 + growth / 100)
  const trend: number[] = []
  for (let i = 0; i < 12; i++) {
    const p = i / 11
    const base = start + (volume - start) * p
    const season = 1 + 0.05 * Math.sin((i / 12) * Math.PI * 2 + (hashStr(term) % 7))
    const noise = 0.94 + rnd() * 0.12
    trend.push(Math.max(1, Math.round((base * season * noise) / 10) * 10))
  }
  trend[11] = volume
  return trend
}

function verdictFor(volume: number, difficulty: number): AnalyzeDTO['verdict'] {
  // opportunity score: demand vs competition balance
  const opp = volume / 1000 / Math.max(difficulty, 5)
  if (opp >= 40 && difficulty <= 55) return { label: 'Great opportunity', tone: 'great' }
  if (opp >= 12) return { label: 'Good potential', tone: 'good' }
  if (opp >= 4) return { label: 'Moderate — target long-tail', tone: 'fair' }
  return { label: 'Hard — high competition', tone: 'hard' }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const query = (body?.query ?? '').toString().trim().toLowerCase().slice(0, 80)

    if (!query || query.length < 2) {
      return NextResponse.json({ error: 'Please enter a keyword (min 2 characters)' }, { status: 400 })
    }

    const words = query
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))

    // 1) Exact match in database
    const exact = await db.keyword.findFirst({
      where: { term: query },
      include: { category: true },
    })

    // 2) Related keywords: share any significant word
    const orFilters = (words.length ? words : [query]).map((w) => ({ term: { contains: w } }))
    const relatedRows = exact
      ? await db.keyword.findMany({
          where: { term: { contains: exact.term.split(' ')[0] }, id: { not: exact.id } },
          include: { category: true },
          orderBy: { volume: 'desc' },
          take: 8,
        })
      : await db.keyword.findMany({
          where: { OR: orFilters },
          include: { category: true },
          orderBy: { volume: 'desc' },
          take: 8,
        })

    const related: KeywordDTO[] = relatedRows.map((k) => ({
      id: k.id,
      term: k.term,
      volume: k.volume,
      competition: k.competition,
      difficulty: k.difficulty,
      growth: k.growth,
      cpc: k.cpc,
      isRising: k.isRising,
      trend: JSON.parse(k.trend) as number[],
      categorySlug: k.category.slug,
      categoryName: k.category.name,
      categoryColor: k.category.color,
    }))

    if (exact) {
      const dto: AnalyzeDTO = {
        query,
        source: 'exact',
        matchedCategory: { slug: exact.category.slug, name: exact.category.name },
        metrics: {
          volume: exact.volume,
          competition: exact.competition,
          difficulty: exact.difficulty,
          growth: exact.growth,
          cpc: exact.cpc,
        },
        trend: JSON.parse(exact.trend) as number[],
        verdict: verdictFor(exact.volume, exact.difficulty),
        related,
      }
      return NextResponse.json(dto)
    }

    // 3) Pattern match: average metrics of related DB keywords
    if (related.length >= 3) {
      const avg = (f: (k: KeywordDTO) => number) =>
        Math.round((related.reduce((s, k) => s + f(k), 0) / related.length) * 10) / 10
      const volume = Math.round(related.reduce((s, k) => s + k.volume, 0) / related.length * 0.85)
      const difficulty = Math.round(avg((k) => k.difficulty))
      const growth = avg((k) => k.growth)
      const competition = Math.round(avg((k) => k.competition))
      const cpc = Math.round(avg((k) => k.cpc) * 100) / 100
      const dto: AnalyzeDTO = {
        query,
        source: 'pattern',
        matchedCategory: null, // mixed sources — category inferred per related keyword instead
        metrics: { volume, competition, difficulty, growth, cpc },
        trend: estimateTrend(query, volume, growth),
        verdict: verdictFor(volume, difficulty),
        related,
      }
      return NextResponse.json(dto)
    }

    // 4) Deterministic estimation for unknown keywords
    const rnd = mulberry32(hashStr(query))
    const wc = words.length || 1
    const baseByWords = wc === 1 ? 900000 : wc === 2 ? 220000 : wc === 3 ? 60000 : 18000
    const volume = Math.round(baseByWords * (0.4 + rnd() * 1.2))
    const difficulty = Math.min(96, Math.max(8, Math.round((wc === 1 ? 72 : wc === 2 ? 54 : wc === 3 ? 38 : 26) * (0.85 + rnd() * 0.3))))
    const competition = Math.min(97, Math.max(6, Math.round(difficulty * (0.9 + rnd() * 0.2))))
    const growth = Math.round((-15 + rnd() * 75) * 10) / 10
    const cpc = Math.round((0.15 + rnd() * 2.6) * 100) / 100

    const dto: AnalyzeDTO = {
      query,
      source: 'estimated',
      matchedCategory: null,
      metrics: { volume, competition, difficulty, growth, cpc },
      trend: estimateTrend(query, volume, growth),
      verdict: verdictFor(volume, difficulty),
      related,
    }
    return NextResponse.json(dto)
  } catch (err) {
    console.error('analyze error', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
