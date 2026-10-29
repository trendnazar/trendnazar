import { Megaphone } from 'lucide-react'
import { ADS, type AdPlacement } from '@/config/ads'

/**
 * Ad slot renderer.
 *  - customHtml set  → sponsor/AdSense code rendered as-is
 *  - nahi            → "Ad Space" placeholder (size label naal)
 */
export function AdSlot({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  if (!ADS.enabled) return null
  const slot = ADS.slots[placement]

  if (slot?.enabled && slot.customHtml) {
    return <div className={`overflow-hidden ${className}`} dangerouslySetInnerHTML={{ __html: slot.customHtml }} />
  }

  if (placement === 'left' || placement === 'right') {
    return (
      <div className={`flex flex-col ${className}`}>
        {slot?.enabled && (
          <div className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-center">
            <Megaphone className="mb-1.5 h-5 w-5 opacity-50" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ad Space</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground/70">{slot.size}</p>
            <p className="mt-2 text-[10px] leading-snug text-muted-foreground/60">
              Paste ad code in <br /> src/config/ads.ts
            </p>
          </div>
        )}
      </div>
    )
  }

  if (!slot?.enabled) return null
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-3 text-center ${className}`}
    >
      <div>
        <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Megaphone className="h-3.5 w-3.5 opacity-50" /> Ad Space — {slot.size}
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/60">Paste ad code in src/config/ads.ts</p>
      </div>
    </div>
  )
}
