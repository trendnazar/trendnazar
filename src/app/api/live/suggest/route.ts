import { NextRequest, NextResponse } from 'next/server'
import { fetchLiveSuggest } from '@/lib/yt/live'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const q = (sp.get('q') ?? '').trim()
    const gl = (sp.get('gl') ?? 'IN').trim().toUpperCase().slice(0, 2)
    const expanded = sp.get('expand') === '1'

    if (!q) {
      return NextResponse.json({ error: 'q is required' }, { status: 400 })
    }
    const data = await fetchLiveSuggest(q, gl === 'WW' ? '' : gl, expanded)
    return NextResponse.json(data)
  } catch (err) {
    console.error('live suggest error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Live suggestions unavailable' },
      { status: 502 }
    )
  }
}
