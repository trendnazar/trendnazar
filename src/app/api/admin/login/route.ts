import { NextRequest, NextResponse } from 'next/server'
import { getEffectivePassword, savePassword, tokenFor } from '@/lib/settings'

export const dynamic = 'force-dynamic'

const COOKIE = 'tn_admin'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const password = (body?.password ?? '').toString()
    const effective = await getEffectivePassword()
    if (!password || password !== effective) {
      return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE, tokenFor(effective), {
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
  const expected = tokenFor(await getEffectivePassword())
  return NextResponse.json({ authed: token === expected })
}

// Password change — sirf login hoey banda hi kar sakda
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE)?.value
    const expected = tokenFor(await getEffectivePassword())
    if (token !== expected) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const newPassword = (body?.newPassword ?? '').toString()
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password at least 6 characters' }, { status: 400 })
    }
    await savePassword(newPassword)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not save — storage unavailable' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
