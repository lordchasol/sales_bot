type PnlCardParams = {
  domain: string;
  previousUsd: number;
  currentUsd: number;
  previousPriceLabel: string;
  currentPriceLabel: string;
};

type PnlTheme = {
  label: string;
  emoji: string;
  accent: string;
  bg: string;
};

function getPnlTheme(pct: number): PnlTheme {
  if (pct < -50)  return { label: 'NGMI',               emoji: '😭', accent: '#FF3B30', bg: '#160000' };
  if (pct < -10)  return { label: 'Weak Hands',         emoji: '📉', accent: '#FF9500', bg: '#160900' };
  if (pct < +10)  return { label: 'Crab Market',        emoji: '🦀', accent: '#8E8E93', bg: '#0E0E0E' };
  if (pct < +50)  return { label: 'WAGMI',              emoji: '💪', accent: '#34C759', bg: '#001608' };
  if (pct < +200) return { label: 'Probably Nothing...', emoji: '🌙', accent: '#5E5CE6', bg: '#050018' };
  return                 { label: 'LFG',                emoji: '🚀', accent: '#FFD60A', bg: '#141000' };
}

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&apos;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(v: number): string {
  return Math.abs(v).toFixed(2);
}

export function buildPnlCardSvg(params: PnlCardParams): string {
  const { domain, previousUsd, currentUsd, previousPriceLabel, currentPriceLabel } = params;

  const delta = currentUsd - previousUsd;
  const pct = previousUsd > 0 ? (delta / previousUsd) * 100 : 0;
  const theme = getPnlTheme(pct);

  const sign = delta >= 0 ? '+' : '-';
  const pctSign = pct >= 0 ? '+' : '';

  const safeDomain = esc(domain);
  const safePrev = esc(previousPriceLabel);
  const safeCurr = esc(currentPriceLabel);

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="1200" height="630" fill="${theme.bg}" opacity="1"/>
  <rect x="0" y="0" width="1200" height="8" fill="${theme.accent}" opacity="1"/>

  <text x="60" y="110" font-family="Liberation Sans,sans-serif" font-size="58" font-weight="800" fill="${theme.accent}">${esc(theme.label)}</text>
  <text x="62" y="155" font-family="Liberation Sans,sans-serif" font-size="28" fill="#FFFFFF" opacity="0.55">${safeDomain}</text>

  <rect x="60" y="185" width="1080" height="1" fill="${theme.accent}" opacity="0.2"/>

  <rect x="60" y="215" width="320" height="190" rx="14" fill="#FFFFFF" fill-opacity="0.05"/>
  <text x="84" y="252" font-family="Liberation Sans,sans-serif" font-size="18" fill="#FFFFFF" opacity="0.4" letter-spacing="1">LAST SALE</text>
  <text x="84" y="320" font-family="Liberation Sans,sans-serif" font-size="52" font-weight="700" fill="#FFFFFF">$${fmt(previousUsd)}</text>
  <text x="84" y="362" font-family="Liberation Sans,sans-serif" font-size="22" fill="#FFFFFF" opacity="0.35">${safePrev}</text>

  <rect x="420" y="215" width="320" height="190" rx="14" fill="#FFFFFF" fill-opacity="0.05"/>
  <text x="444" y="252" font-family="Liberation Sans,sans-serif" font-size="18" fill="#FFFFFF" opacity="0.4" letter-spacing="1">THIS SALE</text>
  <text x="444" y="320" font-family="Liberation Sans,sans-serif" font-size="52" font-weight="700" fill="#FFFFFF">$${fmt(currentUsd)}</text>
  <text x="444" y="362" font-family="Liberation Sans,sans-serif" font-size="22" fill="#FFFFFF" opacity="0.35">${safeCurr}</text>

  <rect x="780" y="215" width="360" height="190" rx="14" fill="#FFFFFF" fill-opacity="0.04" stroke="${theme.accent}" stroke-width="1.5"/>
  <text x="804" y="252" font-family="Liberation Sans,sans-serif" font-size="18" fill="#FFFFFF" opacity="0.4" letter-spacing="1">CHANGE</text>
  <text x="804" y="320" font-family="Liberation Sans,sans-serif" font-size="52" font-weight="800" fill="${theme.accent}">${sign}$${fmt(delta)}</text>
  <text x="804" y="368" font-family="Liberation Sans,sans-serif" font-size="30" font-weight="700" fill="${theme.accent}">${pctSign}${pct.toFixed(2)}%</text>

  <text x="60" y="590" font-family="Liberation Sans,sans-serif" font-size="20" fill="#FFFFFF" opacity="0.2">SNS Resale Snapshot  •  sns.id</text>
</svg>`.trim();
}
