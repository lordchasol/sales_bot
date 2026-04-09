import { env } from '../config/env';
import { SnsSale } from '../services/snsApi';
import { DiscordEmbed } from '../services/discordWebhook';

const QUOTE_MINT_SYMBOLS: Record<string, string> = {
  So11111111111111111111111111111111111111112: 'SOL',
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 'BONK',
  SNS8DJbHc34nKySHVhLGMUUE72ho6igvJaxtq9T3cX3: 'SNS',
};

interface TierInfo {
  title: string;
  color: number;
  label: string;
}

function getTier(usd: number, domainDisplay: string): TierInfo {
  if (usd >= 5000)
    return { title: `🔥 LEGENDARY SALE — ${domainDisplay}`, color: 0xff3b30, label: '🔥 Legendary Sale' };
  if (usd >= 1000)
    return { title: `🐋 WHALE SALE — ${domainDisplay}`, color: 0xff9500, label: '🐋 Whale Sale' };
  if (usd >= 500)
    return { title: `🚀 BIG SALE — ${domainDisplay}`, color: 0xffcc00, label: '🚀 Big Sale' };
  return { title: `✨ SOLD! — ${domainDisplay}`, color: 0x34c759, label: '✨ Hot Sale' };
}

export function truncateWallet(wallet: string, chars = 6): string {
  if (wallet.length <= chars * 2 + 3) return wallet;
  return `${wallet.slice(0, chars)}...${wallet.slice(-chars)}`;
}

export function getFormattedPrice(sale: { price: number; quote_mint: string }): string {
  const symbol = QUOTE_MINT_SYMBOLS[sale.quote_mint] ?? sale.quote_mint.slice(0, 6);
  return `${sale.price} ${symbol}`;
}

export function formatSaleEmbed(
  sale: SnsSale,
  buyerDisplayName: string | null,
  pnlText: string
): DiscordEmbed {
  const usd = sale.usd_price ?? 0;
  const domainSlug = sale.domain_name.replace(/\.sol$/i, '');
  const domainDisplay = `${domainSlug}.sol`;
  const tier = getTier(usd, domainDisplay);
  const buyerName = buyerDisplayName ?? truncateWallet(sale.bidder_key);
  const usdFormatted = `$${usd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return {
    title: tier.title,
    color: tier.color,
    fields: [
      {
        name: 'Domain',
        value: `[${domainDisplay}](${env.SNS_DOMAIN_BASE_URL}${encodeURIComponent(domainSlug)})`,
        inline: true,
      },
      {
        name: 'Buyer',
        value: `[${buyerName}](https://sns.id/account/${sale.bidder_key})`,
        inline: true,
      },
      {
        name: 'Price',
        value: getFormattedPrice(sale),
        inline: true,
      },
      {
        name: 'USD Value',
        value: usdFormatted,
        inline: true,
      },
      {
        name: 'Transaction',
        value: `[View on Solscan](${env.TX_EXPLORER_BASE_URL}${sale.tx_signature})`,
        inline: true,
      },
      {
        name: 'Tier',
        value: tier.label,
        inline: false,
      },
      {
        name: 'PnL vs Last Sale',
        value: pnlText,
        inline: false,
      },
      {
        name: '\u200b',
        value: 'Get your #SNS #domain now 👉 [sns.id](https://sns.id)',
        inline: false,
      },
    ],
  };
}
