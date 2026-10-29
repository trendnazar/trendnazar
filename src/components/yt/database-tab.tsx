'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Flame,
  Search,
  Database,
  Layers,
  TrendingUp,
  Gauge,
  Loader2,
  ChevronDown,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { CategoryGrid, CATEGORY_ICONS } from '@/components/yt/category-grid'
import { KeywordTable, type SortField, type SortOrder } from '@/components/yt/keyword-table'
import { KeywordDialog } from '@/components/yt/keyword-dialog'
import { formatVolume, formatGrowth } from '@/lib/yt/format'
import type { CategoryStatsDTO, KeywordDTO, OverviewDTO } from '@/lib/yt/types'

interface CategoryDetail {
  slug: string
  name: string
  icon: string
  color: string
  description: string
  keywordCount: number
  totalVolume: number
  avgGrowth: number
  avgDifficulty: number
  avgCompetition: number
}

export function DatabaseTab() {
  const [overview, setOverview] = useState<OverviewDTO | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  const [selected, setSelected] = useState<string | null>(null)
  const [catDetail, setCatDetail] = useState<CategoryDetail | null>(null)
  const [keywords, setKeywords] = useState<KeywordDTO[]>([])
  const [kwLoading, setKwLoading] = useState(false)
  const [sortField, setSortField] = useState<SortField>('volume')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [filter, setFilter] = useState('')

  const [dialogKw, setDialogKw] = useState<KeywordDTO | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const keywordsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/overview')
      .then((r) => r.json())
      .then((d: OverviewDTO) => setOverview(d))
      .catch(() => setOverview(null))
      .finally(() => setOverviewLoading(false))
  }, [])

  const loadKeywords = useCallback(async (slug: string) => {
    setKwLoading(true)
    setFilter('')
    try {
      const res = await fetch(`/api/keywords?category=${encodeURIComponent(slug)}&sort=volume&order=desc`)
      const data = await res.json()
      if (res.ok) {
        setKeywords(data.keywords as KeywordDTO[])
        setCatDetail(data.category as CategoryDetail)
      } else {
        setKeywords([])
        setCatDetail(null)
      }
    } catch {
      setKeywords([])
      setCatDetail(null)
    } finally {
      setKwLoading(false)
    }
  }, [])

  const selectCategory = useCallback(
    (slug: string) => {
      setSelected(slug)
      loadKeywords(slug)
      requestAnimationFrame(() => {
        setTimeout(() => keywordsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
      })
    },
    [loadKeywords]
  )

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortOrder(field === 'term' ? 'asc' : 'desc')
      }
    },
    [sortField]
  )

  const visibleKeywords = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const arr = q ? keywords.filter((k) => k.term.toLowerCase().includes(q)) : [...keywords]
    arr.sort((a, b) => {
      if (sortField === 'term') return sortOrder === 'asc' ? a.term.localeCompare(b.term) : b.term.localeCompare(a.term)
      return sortOrder === 'asc' ? a[sortField] - b[sortField] : b[sortField] - a[sortField]
    })
    return arr
  }, [keywords, filter, sortField, sortOrder])

  const trending = overview?.trending ?? []
  const g = overview?.globalStats

  return (
    <div className="space-y-8">
      {/* ---------- Global stats ---------- */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Global statistics">
        {overviewLoading || !g ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={<Database className="h-4 w-4 text-red-600" />} label="Keywords tracked" value={g.totalKeywords.toLocaleString()} sub={`across ${g.totalCategories} categories`} />
            <StatCard icon={<Search className="h-4 w-4 text-red-600" />} label="Monthly searches" value={formatVolume(g.totalVolume)} sub="sum of tracked volume" />
            <StatCard icon={<Flame className="h-4 w-4 text-red-600" />} label="Rising keywords" value={String(g.risingKeywords)} sub="+15% YoY or faster" />
            <StatCard icon={<Gauge className="h-4 w-4 text-red-600" />} label="Avg. difficulty" value={`${g.avgDifficulty}/100`} sub="lower is easier to rank" />
          </>
        )}
      </section>

      {/* ---------- Trending ribbon (modeled momentum) ---------- */}
      <section aria-label="Trending keywords in database" className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-bold uppercase tracking-wide">Rising keywords — modeled momentum</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:thin]">
          {overviewLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 min-w-40 rounded-full" />)
            : trending.map((t, i) => (
                <motion.button
                  key={t.id}
                  type="button"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    setDialogKw(t)
                    setDialogOpen(true)
                  }}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs hover:border-red-600 transition-colors"
                >
                  <span className="font-bold text-red-600 tabular-nums">#{i + 1}</span>
                  <span className="capitalize font-medium max-w-40 truncate">{t.term}</span>
                  <span className="text-muted-foreground hidden sm:inline">· {t.categoryName}</span>
                  <span className={`font-semibold tabular-nums ${t.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatGrowth(t.growth)}
                  </span>
                </motion.button>
              ))}
        </div>
      </section>

      {/* ---------- Categories ---------- */}
      <section aria-label="Browse categories" className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-bold uppercase tracking-wide">Most searched keywords by category</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-1">
          Modeled research database — 384 keywords with volume, competition, difficulty and growth estimates. For
          real-time queries, switch to the Live tab.
        </p>
        {overviewLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[132px] rounded-2xl" />)}
          </div>
        ) : (
          <CategoryGrid categories={overview?.categories ?? []} selected={selected} onSelect={selectCategory} />
        )}
      </section>

      {/* ---------- Keywords for selected category ---------- */}
      <section ref={keywordsRef} aria-label="Category keywords" className="scroll-mt-20 space-y-4">
        {selected && catDetail ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${catDetail.color}1a`, color: catDetail.color }}
                >
                  {(() => {
                    const Icon = CATEGORY_ICONS[catDetail.icon] ?? Search
                    return <Icon className="h-5 w-5" />
                  })()}
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold flex items-center gap-2">
                    {catDetail.name}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </h2>
                  <p className="text-xs text-muted-foreground">{catDetail.description}</p>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span><b className="text-foreground tabular-nums">{catDetail.keywordCount}</b> keywords</span>
                    <span><b className="text-foreground tabular-nums">{formatVolume(catDetail.totalVolume)}</b> monthly searches</span>
                    <span>
                      avg growth{' '}
                      <b className={`tabular-nums ${catDetail.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatGrowth(catDetail.avgGrowth)}
                      </b>
                    </span>
                    <span>avg difficulty <b className="text-foreground tabular-nums">{catDetail.avgDifficulty}/100</b></span>
                  </div>
                </div>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={`Filter ${catDetail.name.toLowerCase()} keywords…`}
                  className="pl-9 pr-8"
                  aria-label="Filter keywords"
                />
                {filter && (
                  <button
                    type="button"
                    onClick={() => setFilter('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear filter"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {kwLoading ? (
              <div className="rounded-xl border bg-card p-6 space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : (
              <KeywordTable
                keywords={visibleKeywords}
                sortField={sortField}
                sortOrder={sortOrder}
                onSort={handleSort}
                onSelect={(k) => {
                  setDialogKw(k)
                  setDialogOpen(true)
                }}
              />
            )}
            {!kwLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 opacity-0" />
                Click any row to see its 12-month search trend. Rows with a flame are rising +15% YoY or faster.
              </p>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-semibold">Select a category above</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
              The 24 most-searched keywords for that category will appear here — sorted by monthly search volume, with competition, difficulty, CPC and 12-month trends.
            </p>
          </div>
        )}
      </section>

      <KeywordDialog keyword={dialogKw} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card p-4"
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </motion.div>
  )
}
