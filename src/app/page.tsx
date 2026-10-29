'use client'

import { useState } from 'react'
import { Youtube, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KeywordAnalyzer } from '@/components/yt/analyzer'
import { LiveSection } from '@/components/yt/live-section'
import { DatabaseTab } from '@/components/yt/database-tab'

type Mode = 'live' | 'database'

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mode, setMode] = useState<Mode>('live')

  return (
    <div className="min-h-screen flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white">
              <Youtube className="h-5 w-5" />
            </span>
            <div className="leading-tight min-w-0">
              <h1 className="text-base font-extrabold tracking-tight truncate">
                Tube<span className="text-red-600">Trends</span>
              </h1>
              <p className="text-[10px] text-muted-foreground hidden sm:block">
                Live + researched YouTube keyword intel, every category
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden md:inline-flex text-muted-foreground font-normal gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-600" />
              </span>
              live data on
            </Badge>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="h-11 rounded-full p-1">
              <TabsTrigger
                value="live"
                className="rounded-full px-5 gap-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
                </span>
                Live now
              </TabsTrigger>
              <TabsTrigger
                value="database"
                className="rounded-full px-5 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Research database
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Shared analyzer — works in both modes */}
          <section aria-label="Keyword analyzer">
            <KeywordAnalyzer />
          </section>

          <TabsContent value="live" className="mt-0">
            <LiveSection />
          </TabsContent>

          <TabsContent value="database" className="mt-0">
            <DatabaseTab />
          </TabsContent>
        </Tabs>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="mt-auto border-t">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>TrendNazar — keyword research for YouTube creators. Live tab streams real user queries; database metrics are modeled estimates.</p>
          <p className="hidden sm:inline">Live source: YouTube search autocomplete</p>
        </div>
      </footer>
    </div>
  )
}
