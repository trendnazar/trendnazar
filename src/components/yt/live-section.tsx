'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2,
  RefreshCw,
  Flame,
  Search,
  Youtube,
  Globe2,
  ExternalLink,
  Clock3,
  Signal,
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { KeywordDialog } from './keyword-dialog'
import { GEO_OPTIONS, LANG_LABELS, type LiveSuggestResult, type LiveTrendingResult } from '@/lib/yt/live-shared'
import type { AnalyzeDTO, KeywordDTO } from '@/lib/yt/types'

const TYPE_CHIP: Record<string, string> = {
  Gaming: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  Music: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  Movies: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  News: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'Sports & Live': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  Learning: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  Food: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300',
  Tech: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  Entertainment: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  General: 'bg-muted text-muted-foreground',
}

const PRESET_SEEDS = ['latest', 'trending', 'new song', 'news today', 'how to', 'trailer']

function timeAgo(ts: number, now: number): string {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.round(m / 60)}h ago`
}

export function LiveSection() {
  const [geo, setGeo] = useState('IN')
  const [trending, setTrending] = useState<LiveTrendingResult | null>(null)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [now, setNow] = useState(Date.now())

  const [seed, setSeed] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [suggest, setSuggest] = useState<LiveSuggestResult | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)

  const [pendingTerm, setPendingTerm] = useState<string | null>(null)
  const [dialogKw, setDialogKw] = useState<KeywordDTO | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadTrending = useCallback(async (g: string) => {
    setTrendingLoading(true)
    try {
      const res = await fetch(`/api/live/trending?gl=${encodeURIComponent(g)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Live source unavailable')
      setTrending(data as LiveTrendingResult)
    } catch (e) {
      toast({
        title: 'Live source not responding',
        description: e instanceof Error ? e.message : 'Please try refresh in a moment.',
      })
      setTrending(null)
    } finally {
      setTrendingLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTrending(geo)
  }, [geo, loadTrending])

  // clock for "updated Xs ago"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20000)
    return () => clearInterval(t)
  }, [])

  // auto refresh trending every 5 minutes (server cache = 10 min)
  useEffect(() => {
    const t = setInterval(() => loadTrending(geo), 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [geo, loadTrending])

  const runSuggest = useCallback(
    async (q: string, exp: boolean) => {
      const query = q.trim()
      if (!query) {
        toast({ title: 'Type a seed first', description: 'Example: minecraft, latest song, workout…' })
        return
      }
      setSuggestLoading(true)
      try {
        const res = await fetch(
          `/api/live/suggest?q=${encodeURIComponent(query)}&gl=${encodeURIComponent(geo)}&expand=${exp ? '1' : '0'}`
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Live suggestions unavailable')
        setSuggest(data as LiveSuggestResult)
      } catch (e) {
        toast({
          title: 'Could not fetch live suggestions',
          description: e instanceof Error ? e.message : 'Try again shortly.',
        })
        setSuggest(null)
      } finally {
        setSuggestLoading(false)
      }
    },
    [geo]
  )

  const analyzeTerm = useCallback(async (term: string) => {
    setPendingTerm(term)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: term }),
      })
      const data = (await res.json()) as AnalyzeDTO
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error || 'Analysis failed')
      const dto: KeywordDTO = {
        id: `live-${term}`,
        term: data.query,
        volume: data.metrics.volume,
        competition: data.metrics.competition,
        difficulty: data.metrics.difficulty,
        growth: data.metrics.growth,
        cpc: data.metrics.cpc,
        isRising: data.metrics.growth >= 15,
        trend: data.trend,
        categoryName: data.matchedCategory?.name ?? 'Live estimate',
        categoryColor: '#dc2626',
      }
      setDialogKw(dto)
      setDialogOpen(true)
    } catch (e) {
      toast({ title: 'Analysis failed', description: e instanceof Error ? e.message : 'Try again.' })
    } finally {
      setPendingTerm(null)
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* ---------- Live trending now ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
                Trending on YouTube right now
              </CardTitle>
              <CardDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Signal className="h-3 w-3" /> Live from YouTube search autocomplete
                </span>
                {trending && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" /> Updated {timeAgo(trending.updatedAt, now)}
                  </span>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
                <Select value={geo} onValueChange={(v) => setGeo(v)}>
                  <SelectTrigger className="w-[150px] h-9" aria-label="Select country">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {GEO_OPTIONS.map((g) => (
                      <SelectItem key={g.value || 'WW'} value={g.value || 'WW'}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => loadTrending(geo)}
                disabled={trendingLoading}
                aria-label="Refresh live trends"
              >
                <RefreshCw className={`h-4 w-4 ${trendingLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {trendingLoading && !trending ? (
            <div className="grid sm:grid-cols-2 gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : trending && trending.items.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 gap-2">
                {trending.items.map((it, i) => (
                  <div
                    key={it.term}
                    className="group flex items-center gap-2.5 rounded-xl border bg-background p-2.5 hover:border-red-600/60 transition-colors"
                  >
                    <span
                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                        i < 3 ? 'bg-red-600 text-white' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => analyzeTerm(it.term)}
                      title="Analyze this keyword"
                    >
                      <span className="block truncate text-sm font-medium" title={it.term}>
                        {pendingTerm === it.term ? (
                          <Loader2 className="inline h-3.5 w-3.5 animate-spin text-red-600" />
                        ) : (
                          <Flame className="inline h-3.5 w-3.5 -mt-0.5 mr-1 text-red-600/70" />
                        )}
                        {it.term}
                      </span>
                      <span className="mt-1 flex items-center gap-1.5">
                        <Badge variant="outline" className={`px-1.5 py-0 text-[10px] ${TYPE_CHIP[it.type] ?? TYPE_CHIP.General}`}>
                          {it.type}
                        </Badge>
                        {it.lang !== 'en' && LANG_LABELS[it.lang] && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] text-muted-foreground">
                            {LANG_LABELS[it.lang]}
                          </Badge>
                        )}
                        <span className="h-1 w-14 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full bg-red-600"
                            style={{ width: `${Math.max(12, it.heat)}%` }}
                          />
                        </span>
                      </span>
                    </button>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(it.term)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      aria-label={`Open ${it.term} on YouTube`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Youtube className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Heat = how strongly each query is being surfaced by YouTube autocomplete right now, ranked across{' '}
                {trending.sources.suggestOk}/{trending.sources.seedsUsed} live seed probes.
                {trending.stale && ' (cached snapshot — live refresh failed)'}
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Live trends unavailable right now. Tap the refresh button in a moment.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Live suggest explorer ---------- */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-red-600" />
            Live search explorer
          </CardTitle>
          <CardDescription>
            Type any seed — see the exact queries YouTube users are searching right now, in your selected country.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              runSuggest(seed, expanded)
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="Try &quot;minecraft&quot;, &quot;workout&quot;, &quot;panjabi song&quot;, &quot;stock market&quot;…"
                className="pl-9"
                aria-label="Live suggestion seed"
              />
            </div>
            <Button type="submit" disabled={suggestLoading} className="bg-red-600 hover:bg-red-700 text-white">
              {suggestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flame className="h-4 w-4" />}
              Fetch live
            </Button>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick seeds:</span>
            {PRESET_SEEDS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setSeed(p)
                  runSuggest(p, expanded)
                }}
                className="rounded-full border bg-background px-2.5 py-1 text-xs hover:border-red-600 transition-colors"
              >
                {p}
              </button>
            ))}
            <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <Switch checked={expanded} onCheckedChange={(v) => setExpanded(v)} aria-label="Deep expansion" />
              Deep expand (a–z + modifiers)
            </label>
          </div>

          {suggestLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
          ) : suggest ? (
            suggest.suggestions.length > 0 ? (
              <>
                <div className="max-h-96 overflow-y-auto rounded-xl border divide-y">
                  {suggest.suggestions.map((s) => (
                    <div key={s.term} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors">
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => analyzeTerm(s.term)}
                        title="Analyze this keyword"
                      >
                        <span className="block truncate text-sm">
                          {pendingTerm === s.term ? (
                            <Loader2 className="inline h-3.5 w-3.5 animate-spin text-red-600" />
                          ) : (
                            <Search className="inline h-3 w-3 -mt-0.5 mr-1.5 text-muted-foreground/70" />
                          )}
                          {s.term}
                        </span>
                      </button>
                      <span className="h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full bg-red-600" style={{ width: `${Math.max(8, s.heat)}%` }} />
                      </span>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s.term)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-red-600 transition-colors"
                        aria-label={`Open ${s.term} on YouTube`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {suggest.suggestions.length} live suggestions for &quot;{suggest.seed}&quot;
                  {suggest.expanded ? ' (deep expanded across a–z and question modifiers)' : ''}. Click any row to
                  analyze its volume &amp; competition.
                </p>
              </>
            ) : (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No live suggestions for this seed right now — try a broader seed.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Enter a seed above and hit <b>Fetch live</b> — results come straight from YouTube&apos;s search
              autocomplete, nothing pre-recorded.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------- Web buzz (last 48h) ---------- */}
      {trending && trending.webBuzz.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe2 className="h-5 w-5 text-red-600" />
              Web buzz around YouTube — {trending.geo === '' ? 'Worldwide' : GEO_OPTIONS.find((g) => g.value === trending.geo)?.label ?? trending.geo}
            </CardTitle>
            <CardDescription>Live web search results from the last 3 days</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            {trending.webBuzz.map((w) => (
              <a
                key={w.url}
                href={w.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border bg-background p-3 hover:border-red-600/60 transition-colors block"
              >
                <span className="block text-sm font-medium line-clamp-2 leading-snug">{w.name}</span>
                <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  {w.host}
                  {w.date ? ` · ${w.date}` : ''}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <KeywordDialog keyword={dialogKw} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
