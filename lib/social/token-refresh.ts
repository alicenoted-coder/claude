import {
  getStoredToken,
  saveToken,
  isExpiringSoon,
  isExpired,
  getEnvToken,
  type TokenPlatform,
  type TokenRecord,
} from "./token-store";

const META_BASE = "https://graph.facebook.com/v21.0";
const THREADS_BASE = "https://graph.threads.net/v1.0";

function appCredentials() {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Missing META_APP_ID or META_APP_SECRET");
  return { appId, appSecret };
}

/**
 * Meta Long-lived Token 刷新：
 * 在有效期內呼叫 fb_exchange_token 換取新的 60 天 token
 */
async function refreshMetaToken(
  currentToken: string,
  platform: "facebook" | "instagram"
): Promise<TokenRecord> {
  const { appId, appSecret } = appCredentials();
  const url = new URL(`${META_BASE}/oauth/access_token`);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", appId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("fb_exchange_token", currentToken);

  const res = await fetch(url.toString());
  const body = await res.json();

  if (!res.ok || body.error) {
    throw new Error(`Token refresh failed: ${JSON.stringify(body.error ?? body)}`);
  }

  // expires_in 單位為秒，Meta 回傳約 5183944（60 天）
  const expiresIn: number = body.expires_in ?? 60 * 24 * 60 * 60;
  return saveToken(platform, body.access_token, expiresIn);
}

async function refreshThreadsToken(currentToken: string): Promise<TokenRecord> {
  const url = new URL(`${THREADS_BASE}/refresh_access_token`);
  url.searchParams.set("grant_type", "th_refresh_token");
  url.searchParams.set("access_token", currentToken);

  const res = await fetch(url.toString());
  const body = await res.json();

  if (!res.ok || body.error) {
    throw new Error(`Threads token refresh failed: ${JSON.stringify(body.error ?? body)}`);
  }

  const expiresIn: number = body.expires_in ?? 60 * 24 * 60 * 60;
  return saveToken("threads", body.access_token, expiresIn);
}

/**
 * 取得有效的 token：優先用已儲存的，即將過期時自動刷新
 * 沒有儲存記錄時回退到環境變數
 */
export async function getValidToken(platform: TokenPlatform): Promise<string> {
  const stored = getStoredToken(platform);

  // 有儲存的 token 且尚未過期
  if (stored && !isExpired(stored)) {
    // 即將過期（7 天內）就主動刷新
    if (isExpiringSoon(stored)) {
      try {
        const refreshed = await refreshToken(platform, stored.token);
        return refreshed.token;
      } catch {
        // 刷新失敗時繼續用目前的 token
      }
    }
    return stored.token;
  }

  // 沒有儲存記錄，用環境變數（並寫入 store 方便後續追蹤）
  const envToken = getEnvToken(platform);
  if (envToken) {
    // 環境變數的 token 我們不知道到期時間，預設假設還有 60 天
    saveToken(platform, envToken, 60 * 24 * 60 * 60);
    return envToken;
  }

  throw new Error(`No valid token for ${platform}. Set ${platform.toUpperCase()}_ACCESS_TOKEN in .env.local`);
}

export async function refreshToken(platform: TokenPlatform, currentToken: string): Promise<TokenRecord> {
  if (platform === "threads") {
    return refreshThreadsToken(currentToken);
  }
  return refreshMetaToken(currentToken, platform);
}

export interface RefreshAllResult {
  platform: TokenPlatform;
  success: boolean;
  error?: string;
  expiresAt?: string;
}

export async function refreshAllTokens(): Promise<RefreshAllResult[]> {
  const platforms: TokenPlatform[] = ["facebook", "instagram", "threads"];
  const results: RefreshAllResult[] = [];

  for (const platform of platforms) {
    const stored = getStoredToken(platform);
    const envToken = getEnvToken(platform);
    const currentToken = stored?.token ?? envToken;

    if (!currentToken) {
      results.push({ platform, success: false, error: "No token configured" });
      continue;
    }

    try {
      const record = await refreshToken(platform, currentToken);
      results.push({
        platform,
        success: true,
        expiresAt: new Date(record.expiresAt).toISOString(),
      });
    } catch (err) {
      results.push({
        platform,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
