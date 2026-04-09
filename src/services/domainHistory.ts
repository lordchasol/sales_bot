import axios from 'axios';
import { env } from '../config/env';

type DomainEvent = {
  tx: string;
  e?: number;
  pu?: number;
  p?: number;
};

type DomainEventsResponse = {
  data: DomainEvent[];
};

export async function findPreviousSaleForDomain(
  domainName: string,
  currentTxSignature: string
): Promise<{ usd_price: number } | null> {
  try {
    const resp = await axios.get<DomainEventsResponse>(
      `${env.SNS_API_BASE_URL}/v2/events/domain/${encodeURIComponent(domainName)}?page_size=50&page=1`,
      { timeout: 30000 }
    );

    if (!Array.isArray(resp.data?.data)) return null;

    // e=7 = vente, pu = prix USD au moment de la vente (universel, toutes monnaies)
    const previousSales = resp.data.data.filter(
      (ev) =>
        ev.e === 7 &&
        typeof ev.pu === 'number' &&
        ev.pu > 0 &&
        ev.tx !== currentTxSignature
    );

    console.log(`[DomainHistory] domain=${domainName} found=${previousSales.length} previous sales, firstPu=${previousSales[0]?.pu}`);

    if (previousSales.length === 0) return null;

    return { usd_price: previousSales[0].pu! };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[DomainHistory] error for ${domainName}:`, msg);
    return null;
  }
}
