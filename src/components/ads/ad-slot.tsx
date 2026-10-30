'use client'

import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { ADS, type AdPlacement } from '@/config/ads'

type LiveSlot = { size?: string; imageUrl?: string; customHtml?: string }

let liveCache: Record<string, LiveSlot> | null = null
let livePromise: Promise<void> | null = null

function loadLive() {
  if (liveCache || livePromise) return
  livePromise = fetch('/api/ads')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      liveCache = (data?.slots ?? {}) as Record<string, LiveSlot>
    })
    .catch(() => {
      liveCache = {}
    })
}

export function AdSlot({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  const [live, setLive] = useState<LiveSlot | null>(liveCache ? liveCache[placement] ?? null : null)

  useEffect(() => {
    loadLive()
    let on = true
    livePromise?.then(() => {
      if (on) setLive(liveCache ? liveCache[placement] ?? null : null)
    })
    return () => {
      on = false
    }
  }, [placement])

  if (!ADS.enabled) return null
  const staticSlot = ADS.slots[placement]
  if (staticSlot && !staticSlot.enabled) return null

  const imageUrl = live?.imageUrl ?? ''
  const customHtml = live?.customHtml ?? ''
  const size = live?.size ?? staticSlot?.size ?? ''

  // 1) AdSense / sponsor HTML code (admin panel ton)
  if (customHtml) {
    return <div className={`overflow-hidden ${className}`} dangerouslySetInnerHTML={{ __html: customHtml }} />
  }

  // 2) Image banner (admin panel ton)
  if (imageUrl) {
    return <img src={imageUrl} alt="Advertisement" className={`object-contain ${className}`} />
  }

  // 3) Placeholder — exact image size vade akharan naal
  if (placement === 'left' || placement === 'right') {
    return (
      <div className={`flex flex-col ${className}`}>
        <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-center">
          <Megaphone className="mb-1.5 h-5 w-5 opacity-50" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ad Space</p>
          <p className="text-2xl font-extrabold tabular-nums tracking-tight">{size}</p>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground/60">
            Admin panel ton <br /> ad add karo
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-center ${className}`}
    >
      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Megaphone className="h-3.5 w-3.5 opacity-50" /> Ad Space
        </p>
        <p className="text-2xl font-extrabold tabular-nums tracking-tight">{size}</p>
        <p className="mt-1 text-[10px] text-muted-foreground/60">Admin panel ton ad add karo</p>
      </div>
    </div>
  )
}
