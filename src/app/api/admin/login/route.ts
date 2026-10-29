import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'trendnazar2026'
const COOKIE = 'tn_admin'

function tokenFor(password: string) {
  return createHash('sha256').update(`tn::${password}::v1`).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const password = (body?.password ?? '').toString()
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE, tokenFor(ADMIN_PASSWORD), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE)?.value
  return NextResponse.json({ authed: token === tokenFor(ADMIN_PASSWORD) })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
