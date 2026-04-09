import axios from 'axios';
import FormData from 'form-data';
import { env } from '../config/env';

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
  footer?: { text: string };
  image?: { url: string };
  thumbnail?: { url: string };
  timestamp?: string;
}

export async function sendDiscordMessage(
  embed: DiscordEmbed,
  imageBuffer?: Buffer,
  imageFilename = 'pnl-card.png'
): Promise<void> {
  if (imageBuffer) {
    const form = new FormData();
    const payload = JSON.stringify({
      embeds: [{ ...embed, image: { url: `attachment://${imageFilename}` } }],
    });
    form.append('payload_json', payload, { contentType: 'application/json' });
    form.append('files[0]', imageBuffer, {
      filename: imageFilename,
      contentType: 'image/png',
    });
    await axios.post(env.DISCORD_WEBHOOK_URL, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });
  } else {
    await axios.post(
      env.DISCORD_WEBHOOK_URL,
      { embeds: [embed] },
      { timeout: 15000 }
    );
  }
}
