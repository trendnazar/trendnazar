// Formatting + small UI helpers

export function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 0)}K`
  return `${n}`
}

export function formatGrowth(n: number): string {
  return `${n > 0 ? '+' : ''}${n.toFixed(0)}%`
}

export function monthLabels(count = 12): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push(d.toLocaleString('en-US', { month: 'short' }))
  }
  return out
}

export type Level = 'low' | 'medium' | 'high' | 'very-high'

export function levelOf(v: number): Level {
  if (v < 30) return 'low'
  if (v < 55) return 'medium'
  if (v < 75) return 'high'
  return 'very-high'
}

export const LEVEL_STYLES: Record<Level, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'very-high': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
}

export const LEVEL_BAR: Record<Level, string> = {
  low: 'bg-emerald-500',
  medium: 'bg-amber-500',
  high: 'bg-orange-500',
  'very-high': 'bg-red-500',
}
