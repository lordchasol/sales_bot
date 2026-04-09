import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, defaultValue = ''): string {
  return process.env[key] ?? defaultValue;
}

function numberValue(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (!val) return defaultValue;
  const num = Number(val);
  if (isNaN(num)) throw new Error(`Env var ${key} must be a number, got: ${val}`);
  return num;
}

export const env = {
  SNS_API_BASE_URL: required('SNS_API_BASE_URL'),
  TX_EXPLORER_BASE_URL: required('TX_EXPLORER_BASE_URL'),
  SNS_DOMAIN_BASE_URL: required('SNS_DOMAIN_BASE_URL'),
  SQLITE_PATH: optional('SQLITE_PATH', './data/sales.db'),
  DISCORD_WEBHOOK_URL: required('DISCORD_WEBHOOK_URL'),
  ADMIN_WEBHOOK_URL: required('ADMIN_WEBHOOK_URL'),
  MIN_USD_THRESHOLD: numberValue('MIN_USD_THRESHOLD', 50),
  POLL_INTERVAL_MS: numberValue('POLL_INTERVAL_MS', 120000),
  SALES_FETCH_LIMIT: numberValue('SALES_FETCH_LIMIT', 500),
  BRAND_CTA_TEXT: optional('BRAND_CTA_TEXT', 'Get your #SNS #domain now 👇 sns.id'),
  ALLOWLIST_DOMAINS: optional('ALLOWLIST_DOMAINS'),
  BLOCKLIST_DOMAINS: optional('BLOCKLIST_DOMAINS'),
  ALLOWLIST_BUYERS: optional('ALLOWLIST_BUYERS'),
  BLOCKLIST_BUYERS: optional('BLOCKLIST_BUYERS'),
};
