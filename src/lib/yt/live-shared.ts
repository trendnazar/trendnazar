// Client-safe shared constants + types for the live data layer (no server-only imports)

export interface LiveTrendItem {
  term: string
  score: number
  breadth: number
  heat: number
  type: string
  lang: string
}

export interface WebBuzzItem {
  name: string
  url: string
  host: string
  date: string
}

export interface LiveTrendingResult {
  geo: string
  updatedAt: number
  stale: boolean
  items: LiveTrendItem[]
  webBuzz: WebBuzzItem[]
  sources: { seedsUsed: number; suggestOk: number }
}

export interface LiveSuggestItem {
  term: string
  score: number
  heat: number
  from: string[]
}

export interface LiveSuggestResult {
  seed: string
  gl: string
  expanded: boolean
  updatedAt: number
  suggestions: LiveSuggestItem[]
}

export const GEO_OPTIONS: { value: string; label: string }[] = [
  { value: 'IN', label: 'India' },
  { value: 'WW', label: 'Worldwide' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'PK', label: 'Pakistan' },
  { value: 'BD', label: 'Bangladesh' },
  { value: 'NP', label: 'Nepal' },
  { value: 'LK', label: 'Sri Lanka' },
  { value: 'AE', label: 'UAE' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'PH', label: 'Philippines' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'KE', label: 'Kenya' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
]

export function geoLabel(gl: string): string {
  return GEO_OPTIONS.find((g) => g.value === gl)?.label ?? 'Worldwide'
}

export function detectType(term: string): string {
  const t = term.toLowerCase().replace(/\s+/g, ' ').trim()
  if (/[\u0900-\u097F]/.test(term)) return 'General'
  if (/gameplay|gaming|roblox|minecraft|gta\b|bgmi|pubg|free fire|valorant|fortnit|esport|\bgame\b/.test(t)) return 'Gaming'
  if (/song|music|remix|\bdj\b|album|audio|lyric|playlist|cover|beat|soundtrack|status video/.test(t)) return 'Music'
  if (/movie|film|trailer|teaser|netflix|cinema|web series|episode/.test(t)) return 'Movies'
  if (/news|headline|breaking|election|weather|update/.test(t)) return 'News'
  if (/live|score|\bmatch\b|highlight|stream|\bipl\b|world cup|schedule|\bvs\b/.test(t)) return 'Sports & Live'
  if (/tutorial|how to|tips|course|class|learn|guide|explain|steps|hack/.test(t)) return 'Learning'
  if (/recipe|food|cook|biryani|cake|snack|dinner|breakfast|street food/.test(t)) return 'Food'
  if (/iphone|android|tech|unbox|ai\b|chatgpt|laptop|phone|gadget|pc build/.test(t)) return 'Tech'
  if (/funny|comedy|prank|meme|reaction|roast/.test(t)) return 'Entertainment'
  return 'General'
}

export function detectLang(term: string): string {
  if (/[\u0900-\u097F]/.test(term)) return 'hi'
  if (/[\u0A00-\u0A7F]/.test(term)) return 'pa'
  if (/[\u0A80-\u0AFF]/.test(term)) return 'gu'
  if (/[\u0B80-\u0BFF]/.test(term)) return 'ta'
  if (/[\u0C00-\u0C7F]/.test(term)) return 'te'
  if (/[\u0980-\u09FF]/.test(term)) return 'bn'
  if (/[\u0600-\u06FF]/.test(term)) return 'ar'
  return 'en'
}

export const LANG_LABELS: Record<string, string> = {
  hi: 'Hindi',
  pa: 'Punjabi',
  gu: 'Gujarati',
  ta: 'Tamil',
  te: 'Telugu',
  bn: 'Bengali',
  ar: 'Arabic',
}
