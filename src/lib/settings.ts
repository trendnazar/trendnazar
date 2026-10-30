// TrendNazar — admin settings (password + ads) via Netlify Blobs
import { getStore } from '@netlify/blobs'
import { createHash } from 'crypto'

const DEFAULT_PASSWORD = 'trendnazar2026'

export type AdPlacementKey = 'top' | 'left' | 'right' | 'inFeed'

export interface AdSlotSettings {
  imageUrl: string
  customHtml: string
}

export interface AdsSettings {
  slots: Record<string, AdSlotSettings>
}

export const AD_PLACEMENTS: AdPlacementKey[] = ['top', 'left', 'right', 'inFeed']

export const AD_SIZES: Record<AdPlacementKey, string> = {
  top: '728 × 90 px',
  left: '160 × 600 px',
  right: '160 × 600 px',
  inFeed: '970 × 110 px',
}

export const DEFAULT_ADS: AdsSettings = {
  slots: {
    top: { imageUrl: '', customHtml: '' },
    left: { imageUrl: '', customHtml: '' },
    right: { imageUrl: '', customHtml: '' },
    inFeed: { imageUrl: '', customHtml: '' },
  },
}

export function tokenFor(password: string) {
  return createHash('sha256').update(`tn::${password}::v1`).digest('hex')
}

async function store() {
  try {
    return getStore({ name: 'trendnazar-admin', consistency: 'strong' })
  } catch {
    return null
  }
}

export async function getEffectivePassword(): Promise<string> {
  try {
    const s = await store()
    const saved = await s?.get('password')
    if (saved) return saved
  } catch {}
  return process.env.ADMIN_PASSWORD ?? DEFAULT_PASSWORD
}

export async function savePassword(newPassword: string) {
  const s = await store()
  if (!s) throw new Error('storage unavailable')
  await s.set('password', newPassword)
}

export async function getAds(): Promise<AdsSettings> {
  try {
    const s = await store()
    const raw = await s?.get('ads')
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AdsSettings>
      const merged: AdsSettings = { slots: { ...DEFAULT_ADS.slots } }
      for (const key of AD_PLACEMENTS) {
        const one = parsed?.slots?.[key]
        if (one) {
          merged.slots[key] = {
            imageUrl: String(one.imageUrl ?? ''),
            customHtml: String(one.customHtml ?? ''),
          }
        }
      }
      return merged
    }
  } catch {}
  return DEFAULT_ADS
}

export async function saveAds(ads: AdsSettings) {
  const s = await store()
  if (!s) throw new Error('storage unavailable')
  await s.set('ads', JSON.stringify(ads))
}
