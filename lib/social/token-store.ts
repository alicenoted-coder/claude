import fs from "fs";
import path from "path";

export interface TokenRecord {
  token: string;
  expiresAt: number;
  refreshedAt: number;
}

export type TokenPlatform = "facebook" | "instagram" | "threads";

interface TokenStore {
  facebook?: TokenRecord;
  instagram?: TokenRecord;
  threads?: TokenRecord;
}

// 本機用專案根目錄，serverless 環境用 /tmp
const STORE_PATH = process.env.NODE_ENV === "production"
  ? "/tmp/token-cache.json"
  : path.join(process.cwd(), "token-cache.json");

function readStore(): TokenStore {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeStore(store: TokenStore): void {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch {
    // serverless 環境寫入失敗時靜默忽略
  }
}

export function getStoredToken(platform: TokenPlatform): TokenRecord | null {
  const store = readStore();
  return store[platform] ?? null;
}

export function saveToken(platform: TokenPlatform, token: string, expiresInSeconds: number): TokenRecord {
  const store = readStore();
  const record: TokenRecord = {
    token,
    expiresAt: Date.now() + expiresInSeconds * 1000,
    refreshedAt: Date.now(),
  };
  store[platform] = record;
  writeStore(store);
  return record;
}

// 距離到期少於 7 天就視為即將過期
export function isExpiringSoon(record: TokenRecord, thresholdDays = 7): boolean {
  return record.expiresAt - Date.now() < thresholdDays * 24 * 60 * 60 * 1000;
}

export function isExpired(record: TokenRecord): boolean {
  return Date.now() >= record.expiresAt;
}

export function getTokenStatus(platform: TokenPlatform): {
  hasToken: boolean;
  isValid: boolean;
  isExpiringSoon: boolean;
  expiresAt?: string;
  daysRemaining?: number;
} {
  const record = getStoredToken(platform);
  const envToken = getEnvToken(platform);

  if (!record && !envToken) {
    return { hasToken: false, isValid: false, isExpiringSoon: false };
  }

  if (!record) {
    return { hasToken: true, isValid: true, isExpiringSoon: false };
  }

  const daysRemaining = Math.floor((record.expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
  return {
    hasToken: true,
    isValid: !isExpired(record),
    isExpiringSoon: isExpiringSoon(record),
    expiresAt: new Date(record.expiresAt).toISOString(),
    daysRemaining,
  };
}

export function getEnvToken(platform: TokenPlatform): string | undefined {
  const keys: Record<TokenPlatform, string> = {
    facebook: "FACEBOOK_ACCESS_TOKEN",
    instagram: "INSTAGRAM_ACCESS_TOKEN",
    threads: "THREADS_ACCESS_TOKEN",
  };
  return process.env[keys[platform]];
}
