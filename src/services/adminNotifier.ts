import axios from 'axios';
import { env } from '../config/env';

export async function sendAdminAlert({
  title,
  message,
}: {
  title: string;
  message: string;
}): Promise<void> {
  try {
    await axios.post(
      env.ADMIN_WEBHOOK_URL,
      {
        embeds: [
          {
            title,
            description: message.slice(0, 4000),
            color: 0xff0000,
            timestamp: new Date().toISOString(),
          },
        ],
      },
      { timeout: 10000 }
    );
  } catch (e) {
    console.error('[AdminNotifier] Failed to send alert:', e);
  }
}
