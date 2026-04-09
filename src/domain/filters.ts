import { env } from '../config/env';
import { SnsSale } from '../services/snsApi';

function parseList(val: string): string[] {
  return val
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function shouldProcessSale(sale: SnsSale): boolean {
  if (!sale.successful) return false;

  const usd = sale.usd_price ?? 0;
  if (usd < env.MIN_USD_THRESHOLD) return false;

  const domainLower = sale.domain_name.toLowerCase();
  const buyerLower = sale.bidder_key.toLowerCase();

  const allowlistDomains = parseList(env.ALLOWLIST_DOMAINS);
  if (allowlistDomains.length > 0 && !allowlistDomains.includes(domainLower)) return false;

  const blocklistDomains = parseList(env.BLOCKLIST_DOMAINS);
  if (blocklistDomains.includes(domainLower)) return false;

  const allowlistBuyers = parseList(env.ALLOWLIST_BUYERS);
  if (allowlistBuyers.length > 0 && !allowlistBuyers.includes(buyerLower)) return false;

  const blocklistBuyers = parseList(env.BLOCKLIST_BUYERS);
  if (blocklistBuyers.includes(buyerLower)) return false;

  return true;
}
