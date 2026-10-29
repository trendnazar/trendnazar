// ============================================================
//  TRENDNAZAR — AD SETTINGS (sari ad settings ikko file ch)
// ============================================================
// Ad code paste karan di jagah EH HI FILE hai:
//  1. Google AdSense approve hone te apna ad unit da code us slot
//     de `customHtml` ch paste karo. Script tags vi chal sakde ne.
//     Example:
//       customHtml: '<ins class="adsbygoogle" style="display:block"
//         data-ad-client="ca-pub-XXXX" data-ad-slot="YYYY"></ins>'
//  2. Koi direct sponsor banner aave, ohda HTML/code vi eh thaan hi lagga.
//  3. Jado tak customHtml khali hai, ek "Ad Space" placeholder dikhega
//     (size label naal) — eh dikhaunda hai ki ithhe ad aavegi.
//  4. Koi slot off karna hove ta usda `enabled: false` kar deo.
//  5. `promo` card = apna promotion (left/right sidebar ch dikhda hai).
//     Hun OFF hai — on karna hove ta enabled: true karo te details bharo.

export interface AdSlotConfig {
  enabled: boolean
  size: string
  customHtml: string
}

export type AdPlacement = 'top' | 'left' | 'right' | 'inFeed'

export const ADS = {
  // Master switch — site ton sare ads band karde layi false karo
  enabled: true,

  slots: {
    top: { enabled: true, size: '728 × 90 — Leaderboard', customHtml: '' },
    left: { enabled: true, size: '160 × 600 — Wide Skyscraper', customHtml: '' },
    right: { enabled: true, size: '160 × 600 — Wide Skyscraper', customHtml: '' },
    inFeed: { enabled: true, size: 'Responsive — In-feed banner', customHtml: '' },
  } as Record<AdPlacement, AdSlotConfig>,

  // Apna promo card (left/right sidebars ch dikhega).
  // `url` ch apna link pao — khali rehnda ta card clickable nahi hovega.
  promo: {
    enabled: false,
    title: 'TrendNazar',
    subtitle: 'Live YouTube keyword & trend intel — keep your nazar on every trend',
    url: '',
    cta: 'Try it free',
  },
}
