import { NextRequest, NextResponse } from 'next/server'
import { getEffectivePassword, saveAds, tokenFor, AD_PLACEMENTS } from '@/lib/settings'

export const dynamic = 'force-dynamic'

// Save ads — sirf login hoey admin layi
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('tn_admin')?.value
    const expected = tokenFor(await getEffectivePassword())
    if (token !== expected) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => null)
    if (!body?.slots) {
      return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    }
    const slots: Record<string, { imageUrl: string; customHtml: string }> = {}
    for (const key of AD_PLACEMENTS) {
      slots[key] = {
        imageUrl: String(body.slots?.[key]?.imageUrl ?? '').slice(0, 2000),
        customHtml: String(body.slots?.[key]?.customHtml ?? '').slice(0, 5000),
      }
    }
    await saveAds({ slots })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not save — storage unavailable' }, { status: 500 })
  }
}
