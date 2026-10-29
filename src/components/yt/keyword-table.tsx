'use client'

import { ArrowDown, ArrowUp, ChevronRight, Flame } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatVolume, formatGrowth, levelOf, LEVEL_STYLES, LEVEL_BAR } from '@/lib/yt/format'
import type { KeywordDTO } from '@/lib/yt/types'

export type SortField = 'volume' | 'growth' | 'competition' | 'difficulty' | 'cpc' | 'term'
export type SortOrder = 'asc' | 'desc'

interface Props {
  keywords: KeywordDTO[]
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
  onSelect: (k: KeywordDTO) => void
}

const RANK_STYLES = [
  'bg-red-600 text-white',
  'bg-orange-500 text-white',
  'bg-amber-500 text-white',
]

export function KeywordTable({ keywords, sortField, sortOrder, onSort, onSelect }: Props) {
  return (
    <div className="rounded-xl border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 pl-4">#</TableHead>
              <SortHead label="Keyword" field="term" sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
              <SortHead label="Monthly searches" field="volume" sortField={sortField} sortOrder={sortOrder} onSort={onSort} align="right" />
              <SortHead label="YoY growth" field="growth" sortField={sortField} sortOrder={sortOrder} onSort={onSort} align="right" />
              <SortHead label="Competition" field="competition" sortField={sortField} sortOrder={sortOrder} onSort={onSort} className="hidden md:table-cell" />
              <SortHead label="Difficulty" field="difficulty" sortField={sortField} sortOrder={sortOrder} onSort={onSort} className="hidden lg:table-cell" />
              <SortHead label="CPC" field="cpc" sortField={sortField} sortOrder={sortOrder} onSort={onSort} align="right" className="hidden md:table-cell" />
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  No keywords match your filter in this category.
                </TableCell>
              </TableRow>
            )}
            {keywords.map((k, i) => {
              const up = k.growth >= 0
              return (
                <TableRow
                  key={k.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(k)}
                >
                  <TableCell className="pl-4">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                        i < 3 ? RANK_STYLES[i] : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium max-w-[220px]">
                    <span className="block truncate capitalize" title={k.term}>
                      {k.term}
                      {k.isRising && <Flame className="ml-1.5 inline h-3.5 w-3.5 text-red-600 -mt-0.5" />}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatVolume(k.volume)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`tabular-nums ${
                        up
                          ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300'
                          : 'border-red-300 text-red-600 dark:border-red-900 dark:text-red-300'
                      }`}
                    >
                      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {formatGrowth(k.growth)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${LEVEL_BAR[levelOf(k.competition)]}`} style={{ width: `${k.competition}%` }} />
                      </div>
                      <Badge variant="outline" className={`text-[10px] px-1.5 ${LEVEL_STYLES[levelOf(k.competition)]}`}>
                        {levelOf(k.competition).replace('-', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full ${LEVEL_BAR[levelOf(k.difficulty)]}`} style={{ width: `${k.difficulty}%` }} />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{k.difficulty}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-right tabular-nums text-muted-foreground">
                    ${k.cpc.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SortHead({
  label,
  field,
  sortField,
  sortOrder,
  onSort,
  align = 'left',
  className,
}: {
  label: string
  field: SortField
  sortField: SortField
  sortOrder: SortOrder
  onSort: (f: SortField) => void
  align?: 'left' | 'right'
  className?: string
}) {
  const active = sortField === field
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-foreground ${
          active ? 'text-foreground' : 'text-muted-foreground'
        } ${align === 'right' ? 'float-right' : ''}`}
        aria-label={`Sort by ${label}`}
      >
        {label}
        {active &&
          (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </TableHead>
  )
}
