'use client'

import { motion } from 'framer-motion'
import {
  Gamepad2,
  Music,
  Cpu,
  GraduationCap,
  Dumbbell,
  ChefHat,
  Sparkles,
  TrendingUp,
  Clapperboard,
  Plane,
  Trophy,
  Rocket,
  Hammer,
  Baby,
  Car,
  PawPrint,
  Search,
  Flame,
  type LucideIcon,
} from 'lucide-react'
import { formatVolume, formatGrowth } from '@/lib/yt/format'
import type { CategoryStatsDTO } from '@/lib/yt/types'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Gamepad2,
  Music,
  Cpu,
  GraduationCap,
  Dumbbell,
  ChefHat,
  Sparkles,
  TrendingUp,
  Clapperboard,
  Plane,
  Trophy,
  Rocket,
  Hammer,
  Baby,
  Car,
  PawPrint,
}

interface Props {
  categories: CategoryStatsDTO[]
  selected: string | null
  onSelect: (slug: string) => void
}

export function CategoryGrid({ categories, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {categories.map((c, idx) => {
        const Icon = CATEGORY_ICONS[c.icon] ?? Search
        const active = selected === c.slug
        return (
          <motion.button
            key={c.slug}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
            onClick={() => onSelect(c.slug)}
            className={`group text-left rounded-2xl border p-4 bg-card transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${
              active ? 'ring-2 ring-red-600 border-red-600' : ''
            }`}
            aria-pressed={active}
          >
            <div className="flex items-start justify-between">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${c.color}1a`, color: c.color }}
              >
                <Icon className="h-5 w-5" />
              </span>
              {c.risingCount > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                  <Flame className="h-3 w-3" />
                  {c.risingCount}
                </span>
              )}
            </div>
            <h3 className="mt-3 text-sm font-bold leading-tight">{c.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
            <div className="mt-3 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {c.keywordCount} keywords · {formatVolume(c.totalVolume)} searches
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  c.avgGrowth >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {formatGrowth(c.avgGrowth)}
              </span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
