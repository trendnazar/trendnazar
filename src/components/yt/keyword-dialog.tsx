'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { TrendingUp, TrendingDown, Search, Gauge, Swords, DollarSign, Flame } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatVolume, formatGrowth, monthLabels, levelOf, LEVEL_STYLES } from '@/lib/yt/format'
import type { KeywordDTO } from '@/lib/yt/types'

interface Props {
  keyword: KeywordDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeywordDialog({ keyword, open, onOpenChange }: Props) {
  const data = useMemo(() => {
    if (!keyword) return []
    const labels = monthLabels(keyword.trend.length)
    return keyword.trend.map((v, i) => ({ month: labels[i], searches: v }))
  }, [keyword])

  if (!keyword) return null

  const rising = keyword.growth >= 0
  const peak = Math.max(...keyword.trend)
  const peakIdx = keyword.trend.indexOf(peak)
  const peakMonth = monthLabels(keyword.trend.length)[peakIdx]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-6">
            <DialogTitle className="text-xl capitalize">{keyword.term}</DialogTitle>
            {keyword.isRising && (
              <Badge className="bg-red-600 hover:bg-red-600 text-white gap-1">
                <Flame className="h-3 w-3" /> Rising
              </Badge>
            )}
            {keyword.categoryName && (
              <Badge
                variant="outline"
                style={{ borderColor: keyword.categoryColor, color: keyword.categoryColor }}
              >
                {keyword.categoryName}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Search interest over the last {keyword.trend.length} months
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            icon={<Search className="h-4 w-4 text-red-600" />}
            label="Monthly searches"
            value={formatVolume(keyword.volume)}
          />
          <StatCard
            icon={rising ? <TrendingUp className="h-4 w-4 text-emerald-600" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            label="YoY growth"
            value={formatGrowth(keyword.growth)}
            valueClass={rising ? 'text-emerald-600' : 'text-red-500'}
          />
          <StatCard
            icon={<Swords className="h-4 w-4 text-orange-600" />}
            label="Competition"
            value={`${keyword.competition}/100`}
          />
          <StatCard
            icon={<Gauge className="h-4 w-4 text-violet-600" />}
            label="Keyword difficulty"
            value={`${keyword.difficulty}/100`}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4 text-teal-600" />}
            label="Est. CPC"
            value={`$${keyword.cpc.toFixed(2)}`}
          />
          <StatCard
            icon={<Flame className="h-4 w-4 text-amber-600" />}
            label="Peak month"
            value={peakMonth}
          />
        </div>

        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.12} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tick={{ fill: 'currentColor', opacity: 0.55 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                fontSize={11}
                tick={{ fill: 'currentColor', opacity: 0.55 }}
                tickFormatter={(v: number) => formatVolume(v)}
              />
              <Tooltip
                formatter={(value) => [`${formatVolume(Number(value))} searches`, 'Monthly searches']}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.08)',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="searches"
                stroke="#dc2626"
                strokeWidth={2.5}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Competition level</span>
            <Badge variant="outline" className={LEVEL_STYLES[levelOf(keyword.competition)]}>
              {levelOf(keyword.competition).replace('-', ' ')}
            </Badge>
          </div>
          <Progress value={keyword.competition} className="h-2" />
          <div className="flex items-center justify-between text-sm pt-1">
            <span className="text-muted-foreground">Difficulty level</span>
            <Badge variant="outline" className={LEVEL_STYLES[levelOf(keyword.difficulty)]}>
              {levelOf(keyword.difficulty).replace('-', ' ')}
            </Badge>
          </div>
          <Progress value={keyword.difficulty} className="h-2" />
          <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
            {rising
              ? `Search interest is up ${formatGrowth(keyword.growth)} year-over-year with ${formatVolume(keyword.volume)} monthly searches. Peak interest hit ${formatVolume(peak)} in ${peakMonth}. ${
                  keyword.difficulty > 60
                    ? 'Difficulty is high — rank faster with long-tail variants and fresh angles on this topic.'
                    : 'A solid window to publish content around this keyword while difficulty is manageable.'
                }`
              : `Search interest moved ${formatGrowth(keyword.growth)} year-over-year to ${formatVolume(keyword.volume)} monthly searches. ${
                  keyword.volume > 500000
                    ? 'Volume is still massive — evergreen content here keeps paying off despite the dip.'
                    : 'Consider pairing it with a rising related keyword to catch the next wave.'
                }`}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold ${valueClass ?? ''}`}>{value}</div>
    </div>
  )
}
