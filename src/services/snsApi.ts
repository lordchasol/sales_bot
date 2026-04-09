import axios from 'axios';
import { env } from '../config/env';

export interface SnsSale {
  unix_timestamp?: number;
  domain_name: string;
  domain_key: string;
  price: number;
  quote_mint: string;
  usd_price?: number;
  tx_signature: string;
  bidder_key: string;
  successful: boolean;
}

export async function fetchLatestSales(): Promise<SnsSale[]> {
  let lastError: Error = new Error('fetchLatestSales failed');
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const resp = await axios.get<{ success: boolean; result: SnsSale[] }>(
        `${env.SNS_API_BASE_URL}/sales/last?limit=${env.SALES_FETCH_LIMIT}`,
        { timeout: 30000 }
      );
      if (!resp.data?.success || !Array.isArray(resp.data.result)) return [];
      return resp.data.result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < 2) {
        console.warn(`[SNS] fetchLatestSales attempt ${attempt} failed: ${lastError.message} — retry in 5s`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }
  throw lastError;
}

export async function fetchLastTradedUsd(domain: string): Promise<number | null> {
  try {
    const resp = await axios.post<Array<{ lup?: number }>>(
      `${env.SNS_API_BASE_URL}/v2/listings/listings-v4`,
      { domain_names: [domain] },
      { timeout: 30000 }
    );
    const data = resp.data;
    if (Array.isArray(data) && data.length > 0 && data[0].lup != null) {
      return data[0].lup;
    }
    return null;
  } catch {
    return null;
  }
}
