import { NextResponse } from 'next/server'
import { getAds, AD_PLACEMENTS, AD_SIZES } from '@/lib/settings'

export const dynamic = 'force-dynamic'

// Public — site nu pata hunda kahe da ad kithhe laggana
export async function GET() {
  const ads = await getAds()
  const slots: Record<string, { size: string; imageUrl: string; customHtml: string }> = {}
  for (const key of AD_PLACEMENTS) {
    slots[key] = {
      size: AD_SIZES[key],
      imageUrl: ads.slots[key]?.imageUrl ?? '',
      customHtml: ads.slots[key]?.customHtml ?? '',
    }
  }
  return NextResponse.json({ enabled: true, slots })
}
