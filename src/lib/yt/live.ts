// Live data layer (server-only): YouTube search autocomplete + web buzz via SDK
// No API keys needed. In-memory cache with TTL + stale-on-error fallback.

import {
  detectLang,
  detectType,
  geoLabel,
  type LiveSuggestItem,
  type LiveSuggestResult,
  type LiveTrendItem,
  type LiveTrendingResult,
  type WebBuzzItem,
} from './live-shared'

// ---------- cache ----------
interface CacheEntry {
  data: unknown
  expires: number
}
const cache = new Map<string, CacheEntry>()

function getCache<T>(key: string): { data: T; fresh: boolean } | null {
  const e = cache.get(key)
  if (!e) return null
  return { data: e.data as T, fresh: Date.now() < e.expires }
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

// ---------- fetch helpers ----------
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

async function fetchSuggest(q: string, gl: string): Promise<string[]> {
  const params = new URLSearchParams({ client: 'firefox', ds: 'yt', hl: 'en' })
  if (gl) params.set('gl', gl)
  params.set('q', q)
  const res = await fetch(`https://suggestqueries.google.com/complete/search?${params}`, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`suggest ${res.status}`)
  const data = await res.json()
  if (!Array.isArray(data?.[1])) return []
  return (data[1] as unknown[]).filter((x): x is string => typeof x === 'string')
}

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

// ---------- live trending ----------
const TREND_SEEDS = [
  'trending',
  'latest',
  'today',
  'new',
  'new song',
  'new movie',
  'trailer',
  'live',
  'news',
  'viral video',
  'how to',
  'what is',
  'top 10',
  'best',
  'vlog',
  'shorts',
  'football',
  'cricket',
  'recipe',
  'workout',
  'gameplay',
  'review',
  // topical live seeds
  'ipl',
  'world cup',
  'election',
  'stock market',
  'web series',
  'podcast',
  'asmr',
  'interview',
]

// letter expansions surface topic-specific live queries (e.g. "latest t" -> latest tamil songs)
const TREND_EXPANSION_PREFIXES = ['trending', 'latest']

async function fetchWebBuzz(gl: string): Promise<WebBuzzItem[]> {
  try {
    const mod = await import('z-ai-web-dev-sdk')
    const ZAI = mod.default
    const zai = await ZAI.create()
    const country = geoLabel(gl)
    const res = (await zai.functions.invoke('web_search', {
      query: `YouTube trending videos ${country} this week`,
      num: 8,
      recency_days: 3,
    })) as unknown
    const arr = Array.isArray(res)
      ? res
      : Array.isArray((res as { results?: unknown[] })?.results)
        ? ((res as { results: unknown[] }).results as unknown[])
        : []
    return arr
      .map((r) => {
        const it = r as { name?: string; url?: string; host_name?: string; date?: string }
        return {
          name: String(it.name ?? ''),
          url: String(it.url ?? ''),
          host: String(it.host_name ?? ''),
          date: String(it.date ?? ''),
        }
      })
      .filter((r) => r.name && r.url)
      .slice(0, 6)
  } catch {
    return []
  }
}

export async function fetchLiveTrending(gl: string): Promise<LiveTrendingResult> {
  const key = `trend:${gl || 'WW'}`
  const cached = getCache<LiveTrendingResult>(key)
  if (cached?.fresh) return cached.data

  const expansions = TREND_EXPANSION_PREFIXES.flatMap((p) =>
    'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `${p} ${c}`)
  )
  const allSeeds = [...TREND_SEEDS, ...expansions]
  const results = await Promise.allSettled(allSeeds.map((s) => fetchSuggest(s, gl)))
  const okCount = results.filter((r) => r.status === 'fulfilled').length

  if (okCount === 0) {
    if (cached) return { ...cached.data, stale: true }
    throw new Error('Live suggestion service is unreachable right now')
  }

  const map = new Map<string, { term: string; score: number; seeds: Set<string> }>()
  results.forEach((r, idx) => {
    if (r.status !== 'fulfilled') return
    const seedRaw = allSeeds[idx]
    const seed = normalizeKey(seedRaw)
    r.value.forEach((s, i) => {
      const k = normalizeKey(s)
      if (!k || k.length < 3 || k.length > 70 || k === seed) return
      if (/^[\d\s:+\-.,]+$/.test(k)) return
      const prev = map.get(k)
      const add = Math.max(1, 10 - i)
      if (prev) {
        prev.score += add
        prev.seeds.add(seedRaw)
      } else {
        map.set(k, { term: s.trim(), score: add, seeds: new Set([seedRaw]) })
      }
    })
  })

  const maxScore = Math.max(...[...map.values()].map((v) => v.score), 1)
  const items: LiveTrendItem[] = [...map.values()]
    .sort((a, b) => b.seeds.size - a.seeds.size || b.score - a.score)
    .slice(0, 40)
    .map((v) => ({
      term: v.term,
      score: v.score,
      breadth: v.seeds.size,
      heat: Math.round((v.score / maxScore) * 100),
      type: detectType(v.term),
      lang: detectLang(v.term),
    }))

  const webBuzz = await fetchWebBuzz(gl)
  const out: LiveTrendingResult = {
    geo: gl,
    updatedAt: Date.now(),
    stale: false,
    items,
    webBuzz,
    sources: { seedsUsed: allSeeds.length, suggestOk: okCount },
  }
  setCache(key, out, 10 * 60 * 1000)
  return out
}

// ---------- live suggest explorer ----------
const SUGGEST_MODIFIERS = ['how to', 'best', 'top 10', 'vs', 'song', 'movie', 'tips', 'live']

export async function fetchLiveSuggest(seedRaw: string, gl: string, expanded: boolean): Promise<LiveSuggestResult> {
  const seed = seedRaw.trim().slice(0, 60)
  if (!seed) throw new Error('Empty seed')
  const key = `sg:${gl || 'WW'}:${normalizeKey(seed)}:${expanded ? 1 : 0}`
  const cached = getCache<LiveSuggestResult>(key)
  if (cached?.fresh) return cached.data

  const baseList = await fetchSuggest(seed, gl)

  const map = new Map<string, { term: string; score: number; from: Set<string> }>()
  const addAll = (fromSeed: string, list: string[]) => {
    list.forEach((s, i) => {
      const k = normalizeKey(s)
      if (!k || k.length < 2 || k.length > 70) return
      const prev = map.get(k)
      const add = Math.max(1, 10 - i)
      if (prev) {
        prev.score += add
        prev.from.add(fromSeed)
      } else {
        map.set(k, { term: s.trim(), score: add, from: new Set([fromSeed]) })
      }
    })
  }
  addAll(seed, baseList)

  if (expanded) {
    const expansions = [
      ...'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => `${seed} ${c}`),
      ...SUGGEST_MODIFIERS.map((m) => `${seed} ${m}`),
    ]
    const extra = await Promise.allSettled(expansions.map((e) => fetchSuggest(e, gl)))
    extra.forEach((r, idx) => {
      if (r.status === 'fulfilled') addAll(expansions[idx], r.value)
    })
  }

  const maxScore = Math.max(...[...map.values()].map((v) => v.score), 1)
  const suggestions: LiveSuggestItem[] = [...map.values()]
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term))
    .slice(0, 60)
    .map((v) => ({
      term: v.term,
      score: v.score,
      heat: Math.round((v.score / maxScore) * 100),
      from: [...v.from],
    }))

  const out: LiveSuggestResult = {
    seed,
    gl,
    expanded,
    updatedAt: Date.now(),
    suggestions,
  }
  setCache(key, out, 10 * 60 * 1000)
  return out
}
