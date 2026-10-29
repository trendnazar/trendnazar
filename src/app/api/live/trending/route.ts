import { NextRequest, NextResponse } from 'next/server'
import { fetchLiveTrending } from '@/lib/yt/live'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const gl = (req.nextUrl.searchParams.get('gl') ?? 'IN').trim().toUpperCase().slice(0, 2)
    const data = await fetchLiveTrending(gl === 'WW' ? '' : gl)
    return NextResponse.json(data)
  } catch (err) {
    console.error('live trending error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Live trending unavailable' },
      { status: 502 }
    )
  }
}
