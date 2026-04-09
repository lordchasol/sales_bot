import { initializeDatabase, hasSeenSale, markSaleAsSeen } from './db/sqlite';
import { SnsSale, fetchLatestSales, fetchLastTradedUsd } from './services/snsApi';
import { sendDiscordMessage } from './services/discordWebhook';
import { resolvePrimaryDomain } from './services/primaryDomain';
import { findPreviousSaleForDomain } from './services/domainHistory';
import { sendAdminAlert } from './services/adminNotifier';
import { shouldProcessSale } from './domain/filters';
import { formatSaleEmbed, getFormattedPrice } from './domain/formatters';
import { buildPnlCardSvg } from './domain/pnlCard';
import { env } from './config/env';
import { Resvg } from '@resvg/resvg-js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processSale(sale: SnsSale): Promise<void> {
  const currentUsd = sale.usd_price ?? 0;

  try {
    // 1. Resolve buyer display name (primary .sol domain)
    const buyerDisplayName = await resolvePrimaryDomain(sale.bidder_key);

    // 2. PnL: try API lup first, fall back to domain history
    let previousUsd: number | null = await fetchLastTradedUsd(sale.domain_name);
    let previousPriceLabel: string | null = null;
    console.log(`[PnL] domain=${sale.domain_name} lastUsd=${previousUsd}`);

    if (previousUsd == null) {
      const prevSale = await findPreviousSaleForDomain(sale.domain_name, sale.tx_signature);
      console.log(`[PnL] previous sale=`, JSON.stringify(prevSale));
      if (prevSale?.usd_price != null) {
        previousUsd = prevSale.usd_price;
      }
    }

    // 3. Build PnL card (PNG required for Discord)
    let pnlImageBuffer: Buffer | undefined;
    let pnlText = 'NC';

    if (previousUsd != null) {
      const change = currentUsd - previousUsd;
      const changePct = previousUsd > 0 ? (change / previousUsd) * 100 : 0;
      const sign = change >= 0 ? '+' : '';
      pnlText = `${sign}$${Math.abs(change).toFixed(2)} (${sign}${changePct.toFixed(1)}%)`;

      const domainFull = sale.domain_name.replace(/\.sol$/i, '') + '.sol';
      const svg = buildPnlCardSvg({
        domain: domainFull,
        previousUsd,
        currentUsd,
        previousPriceLabel: previousPriceLabel ?? `$${previousUsd.toFixed(2)}`,
        currentPriceLabel: getFormattedPrice(sale),
      });

      // CRITICAL: convert SVG → PNG (Discord requires PNG, not SVG)
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 },
        font: {
          loadSystemFonts: false,
          fontDirs: ['/home/alfred/sns-sales-bot/assets/fonts'],
        },
      });
      pnlImageBuffer = Buffer.from(resvg.render().asPng());
      console.log(`[PnL] PNG buffer size=${pnlImageBuffer?.length ?? 0} bytes`);
    }

    // 4. Build and send embed
    const embed = formatSaleEmbed(sale, buyerDisplayName, pnlText);
    await sendDiscordMessage(embed, pnlImageBuffer);

    // 5. Wait between Discord posts to avoid rate-limit
    await sleep(1200);

    // 6. Mark as successfully posted
    markSaleAsSeen(sale.tx_signature, sale.domain_name, sale.bidder_key, currentUsd, 'posted');
    console.log(`[OK] ${sale.domain_name}.sol — $${currentUsd} | PnL: ${pnlText}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ERR] ${sale.domain_name}: ${msg}`);
    await sendAdminAlert({
      title: `Error processing sale: ${sale.domain_name}.sol`,
      message: `TX: ${sale.tx_signature}\n\n${msg}`,
    });
    markSaleAsSeen(sale.tx_signature, sale.domain_name, sale.bidder_key, currentUsd, 'error');
  }
}

async function main(): Promise<void> {
  initializeDatabase();
  console.log('[SNS Bot] Started — polling every', env.POLL_INTERVAL_MS / 1000, 'seconds');

  while (true) {
    try {
      console.log(`[${new Date().toISOString()}] Polling SNS API...`);
      const sales = await fetchLatestSales();
      console.log(`[${new Date().toISOString()}] Fetched ${sales.length} sales`);

      let newCount = 0;
      for (const sale of sales) {
        // Skip already processed transactions
        if (hasSeenSale(sale.tx_signature)) continue;

        // Skip filtered-out sales and mark them to avoid re-checking
        if (!shouldProcessSale(sale)) {
          markSaleAsSeen(
            sale.tx_signature,
            sale.domain_name,
            sale.bidder_key,
            sale.usd_price ?? 0,
            'skipped'
          );
          continue;
        }

        newCount++;
        await processSale(sale);
      }

      if (newCount === 0) {
        console.log(`[${new Date().toISOString()}] No new qualifying sales`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[POLL ERR]: ${msg}`);
      await sendAdminAlert({ title: 'Poll cycle error', message: msg });
    }

    await sleep(env.POLL_INTERVAL_MS);
  }
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
