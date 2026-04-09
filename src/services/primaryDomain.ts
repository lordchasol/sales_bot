import axios from 'axios';
import { env } from '../config/env';

export async function resolvePrimaryDomain(wallet: string): Promise<string | null> {
  try {
    const resp = await axios.get<Record<string, string>>(
      `${env.SNS_API_BASE_URL}/v2/user/fav-domains/${wallet}`,
      { timeout: 30000 }
    );
    // Response shape: { "wallet_address": "domain.sol" }
    const primary = resp.data?.[wallet] ?? null;
    console.log(`[PrimaryDomain] wallet=${wallet} resolved=${primary}`);
    if (!primary) return null;
    return primary.endsWith('.sol') ? primary : `${primary}.sol`;
  } catch {
    console.log(`[PrimaryDomain] wallet=${wallet} resolved=null (error)`);
    return null;
  }
}
