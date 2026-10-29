'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type TrendItem = { term: string; heat: number; type: string }
type OverviewStats = {
  globalStats?: {
    totalKeywords?: number
    totalCategories?: number
    totalVolume?: number
    risingKeywords?: number
  }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState<OverviewStats>({})
  const [trending, setTrending] = useState<TrendItem[]>([])

  const loadData = useCallback(async () => {
    try {
      const [ov, tr] = await Promise.all([
        fetch('/api/overview').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/live/trending?gl=IN').then((r) => (r.ok ? r.json() : null)),
      ])
      if (ov) setStats(ov)
      if (tr?.items) setTrending(tr.items.slice(0, 10))
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/admin/login')
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.authed)
        if (d.authed) loadData()
      })
      .catch(() => setAuthed(false))
  }, [loadData])

  async function login(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (r.ok) {
        setAuthed(true)
        setPassword('')
        loadData()
      } else {
        const d = await r.json().catch(() => ({}))
        setError(d.error ?? 'Login failed')
      }
    } catch {
      setError('Network error')
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' })
    setAuthed(false)
    setStats({})
    setTrending([])
  }

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-extrabold">
              Trend<span className="text-teal-600 dark:text-teal-400">Nazar</span> Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={login} className="space-y-3">
              <Input
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {error ? <p className="text-xs text-red-500">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={busy || !password}>
                {busy ? 'Checking…' : 'Login'}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              <Link href="/" className="underline">← Back to site</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const gs = stats?.globalStats ?? {}

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-extrabold">
            Trend<span className="text-teal-600 dark:text-teal-400">Nazar</span>{' '}
            <span className="text-muted-foreground font-medium">Admin</span>
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/"><Button variant="outline" size="sm">View site</Button></Link>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Keywords', value: gs.totalKeywords ?? '—' },
            { label: 'Categories', value: gs.totalCategories ?? '—' },
            { label: 'Total volume', value: gs.totalVolume ?? '—' },
            { label: 'Rising', value: gs.risingKeywords ?? '—' },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              Live trending (IN) <Badge variant="outline">top 10</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trending.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data</p>
            ) : (
              <ol className="space-y-1.5">
                {trending.map((t, i) => (
                  <li key={t.term} className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0">
                    <span className="truncate">{i + 1}. {t.term}</span>
                    <span className="text-muted-foreground text-xs">{t.type} · heat {t.heat}</span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
