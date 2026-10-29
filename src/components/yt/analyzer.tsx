'use client'

import { useState } from 'react'
import { Search, Loader2, Sparkles, Info, Target } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { KeywordDialog } from './keyword-dialog'
import { formatVolume, formatGrowth, levelOf, LEVEL_STYLES } from '@/lib/yt/format'
import type { AnalyzeDTO, KeywordDTO } from '@/lib/yt/types'

const VERDICT_STYLES: Record<AnalyzeDTO['verdict']['tone'], string> = {
  great: 'bg-emerald-600 text-white hover:bg-emerald-600',
  good: 'bg-teal-600 text-white hover:bg-teal-600',
  fair: 'bg-amber-500 text-white hover:bg-amber-500',
  hard: 'bg-red-600 text-white hover:bg-red-600',
}

export function KeywordAnalyzer() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeDTO | null>(null)
  const [dialogKw, setDialogKw] = useState<KeywordDTO | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function analyze(kw?: string) {
    const q = (kw ?? query).trim()
    if (!q) {
      toast({ title: 'Type a keyword first', description: 'Enter any topic to estimate its YouTube search potential.' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Analysis failed')
      }
      setResult((await res.json()) as AnalyzeDTO)
    } catch (e) {
      toast({ title: 'Could not analyze', description: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-red-600" />
          Analyze any keyword
        </CardTitle>
        <CardDescription>
          Check search volume, competition, difficulty and trend for any topic — not just the ones we track.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            analyze()
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try &quot;how to start a podcast&quot; or &quot;minecraft house build&quot;…"
              className="pl-9"
              aria-label="Keyword to analyze"
            />
          </div>
          <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze
          </Button>
        </form>

        {result && (
          <div className="mt-5 rounded-xl border bg-muted/30 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold capitalize">{result.query}</h4>
              <Badge className={VERDICT_STYLES[result.verdict.tone]}>{result.verdict.label}</Badge>
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Info className="h-3 w-3" />
                {result.source === 'exact'
                  ? `Exact match — ${result.matchedCategory?.name ?? ''}`
                  : result.source === 'pattern'
                    ? `Estimated from ${result.related.length} similar keywords`
                    : 'Model estimate'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <Metric label="Monthly searches" value={formatVolume(result.metrics.volume)} />
              <Metric
                label="YoY growth"
                value={formatGrowth(result.metrics.growth)}
                className={result.metrics.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}
              />
              <Metric label="Competition" value={`${result.metrics.competition}/100`} />
              <Metric label="Difficulty" value={`${result.metrics.difficulty}/100`} />
              <Metric label="Est. CPC" value={`$${result.metrics.cpc.toFixed(2)}`} />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Competition — {levelOf(result.metrics.competition).replace('-', ' ')}</span>
                  <span>Difficulty — {levelOf(result.metrics.difficulty).replace('-', ' ')}</span>
                </div>
                <Progress value={result.metrics.competition} className="h-2" />
                <Progress value={result.metrics.difficulty} className="h-2 mt-1.5" />
              </div>
              <MiniTrend trend={result.trend} />
            </div>

            {result.related.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Related tracked keywords
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.related.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setDialogKw(r)
                        setDialogOpen(true)
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs hover:border-red-600 transition-colors"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: r.categoryColor ?? '#dc2626' }}
                      />
                      <span className="capitalize">{r.term}</span>
                      <span className="text-muted-foreground tabular-nums">{formatVolume(r.volume)}</span>
                      <span className={`tabular-nums ${r.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatGrowth(r.growth)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <KeywordDialog keyword={dialogKw} open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  )
}

function Metric({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border bg-background p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-base font-bold tabular-nums ${className ?? ''}`}>{value}</div>
    </div>
  )
}

function MiniTrend({ trend }: { trend: number[] }) {
  const min = Math.min(...trend)
  const max = Math.max(...trend)
  const range = Math.max(max - min, 1)
  const points = trend
    .map((v, i) => `${(i / (trend.length - 1)) * 100},${34 - ((v - min) / range) * 30}`)
    .join(' ')
  return (
    <div className="rounded-lg border bg-background p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">12-month trend</div>
      <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-10 w-full mt-1">
        <polyline points={points} fill="none" stroke="#dc2626" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
