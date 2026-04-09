import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

let db: Database.Database;

export function initializeDatabase(): void {
  const dbPath = env.SQLITE_PATH;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS seen_sales (
      tx_signature TEXT PRIMARY KEY,
      domain_name  TEXT    NOT NULL,
      buyer_wallet TEXT    NOT NULL,
      usd_value    REAL    NOT NULL,
      status       TEXT    NOT NULL,
      created_at   INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS app_state (
      key        TEXT    PRIMARY KEY,
      value      TEXT    NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS admin_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      message    TEXT    NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  console.log(`[DB] Initialized at ${dbPath}`);
}

export function hasSeenSale(txSignature: string): boolean {
  const row = db.prepare('SELECT 1 FROM seen_sales WHERE tx_signature = ?').get(txSignature);
  return !!row;
}

export function markSaleAsSeen(
  txSignature: string,
  domainName: string,
  buyerWallet: string,
  usdValue: number,
  status: 'posted' | 'skipped' | 'error'
): void {
  db.prepare(`
    INSERT OR REPLACE INTO seen_sales (tx_signature, domain_name, buyer_wallet, usd_value, status, created_at)
    VALUES (?, ?, ?, ?, ?, unixepoch())
  `).run(txSignature, domainName, buyerWallet, usdValue, status);
}

export function getLastSeenUsdForDomain(domainName: string): number | null {
  const row = db
    .prepare(`
      SELECT usd_value FROM seen_sales
      WHERE domain_name = ? AND status = 'posted'
      ORDER BY created_at DESC
      LIMIT 1
    `)
    .get(domainName) as { usd_value: number } | undefined;
  return row ? row.usd_value : null;
}
