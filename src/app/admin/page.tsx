'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
type AdSlotForm = { imageUrl: string; customHtml: string }

const AD_FORM: { key: string; label: string; size: string }[] = [
  { key: 'top', label: 'Top banner', size: '728 × 90 px' },
  { key: 'left', label: 'Left sidebar', size: '160 × 600 px' },
  { key: 'right', label: 'Right sidebar', size: '160 × 600 px' },
  { key: 'inFeed', label: 'In-feed (content de thalle)', size: '970 × 110 px' },
]

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loginNotice, setLoginNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [stats, setStats] = useState<OverviewStats>({})
  const [trending, setTrending] = useState<TrendItem[]>([])

  // Ad manager
  const [ads, setAds] = useState<Record<string, AdSlotForm>>({})
  const [adsBusy, setAdsBusy] = useState(false)
  const [adsMsg, setAdsMsg] = useState('')

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [ov, tr, ad] = await Promise.all([
        fetch('/api/overview').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/live/trending?gl=IN').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/ads').then((r) => (r.ok ? r.json() : null)),
      ])
      if (ov) setStats(ov)
      if (tr?.items) setTrending(tr.items.slice(0, 10))
      if (ad?.slots) {
        const form: Record<string, AdSlotForm> = {}
        for (const s of AD_FORM) {
          form[s.key] = {
            imageUrl: ad.slots[s.key]?.imageUrl ?? '',
            customHtml: ad.slots[s.key]?.customHtml ?? '',
          }
        }
        setAds(form)
      }
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
        setLoginNotice('')
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
    setAds({})
  }

  async function saveAds(e: FormEvent) {
    e.preventDefault()
    setAdsBusy(true)
    setAdsMsg('')
    try {
      const r = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: ads }),
      })
      const d = await r.json().catch(() => ({}))
      setAdsMsg(r.ok ? 'Saved! Live site te refresh karke navi ads dekho.' : d.error ?? 'Save failed')
    } catch {
      setAdsMsg('Network error')
    } finally {
      setAdsBusy(false)
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwMsg('')
    if (newPassword.length < 6) {
      setPwMsg('New password at least 6 characters da hona chahida')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwMsg('Dono passwords same nahi ne')
      return
    }
    setPwBusy(true)
    try {
      const r = await fetch('/api/admin/login', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok) {
        setLoginNotice('Password changed! Hun nava password naal login karo.')
        setNewPassword('')
        setConfirmPassword('')
        setAuthed(false)
        setStats({})
        setTrending([])
        setAds({})
      } else {
        setPwMsg(d.error ?? 'Change failed')
      }
    } catch {
      setPwMsg('Network error')
    } finally {
      setPwBusy(false)
    }
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
            <CardTitle className="text-xl font-extrabold">TrendNazar Admin</CardTitle>
          </CardHeader>
          <CardContent>
            {loginNotice ? (
              <p className="mb-3 rounded-lg bg-teal-500/10 px-3 py-2 text-center text-xs font-medium text-teal-600 dark:text-teal-400">
                {loginNotice}
              </p>
            ) : null}
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
            TrendNazar <span className="text-muted-foreground font-medium">Admin</span>
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
              Ad Manager <Badge variant="outline">live control</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(ads).length === 0 ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <form onSubmit={saveAds} className="space-y-4">
                {AD_FORM.map((s) => (
                  <div key={s.key} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{s.label}</p>
                      <Badge variant="outline" className="whitespace-nowrap">{s.size}</Badge>
                    </div>
                    <Input
                      placeholder="Image URL (jive https://i.ibb.co/xxxx/banner.png)"
                      value={ads[s.key]?.imageUrl ?? ''}
                      onChange={(e) =>
                        setAds((a) => ({ ...a, [s.key]: { customHtml: a[s.key]?.customHtml ?? '', imageUrl: e.target.value } }))
                      }
                    />
                    <Textarea
                      rows={2}
                      placeholder="Ya AdSense / sponsor HTML code (optional)"
                      value={ads[s.key]?.customHtml ?? ''}
                      onChange={(e) =>
                        setAds((a) => ({ ...a, [s.key]: { imageUrl: a[s.key]?.imageUrl ?? '', customHtml: e.target.value } }))
                      }
                    />
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={adsBusy}>{adsBusy ? 'Saving…' : 'Save ads'}</Button>
                  {adsMsg ? <p className="text-xs text-muted-foreground">{adsMsg}</p> : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Image usi size di banao jo badge vich likhya — fer URL paste karo. Save hunde hi live site te dikhna shuru.
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-3 max-w-sm">
              <Input
                type="password"
                placeholder="New password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={pwBusy || !newPassword}>
                  {pwBusy ? 'Saving…' : 'Change password'}
                </Button>
                {pwMsg ? <p className="text-xs text-red-500">{pwMsg}</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>

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
