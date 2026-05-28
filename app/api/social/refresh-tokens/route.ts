import { NextRequest, NextResponse } from "next/server";
import { refreshAllTokens } from "@/lib/social/token-refresh";
import { getTokenStatus } from "@/lib/social/token-store";
import type { TokenPlatform } from "@/lib/social/token-store";

const PLATFORMS: TokenPlatform[] = ["facebook", "instagram", "threads"];

// GET /api/social/refresh-tokens → 查看各平台 token 狀態
export async function GET() {
  const status = PLATFORMS.map((platform) => ({
    platform,
    ...getTokenStatus(platform),
  }));
  return NextResponse.json({ status });
}

// POST /api/social/refresh-tokens → 執行刷新（Vercel cron 或手動呼叫）
export async function POST(req: NextRequest) {
  // 保護端點：Vercel cron 會帶上 Authorization header
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await refreshAllTokens();
  const hasFailure = results.some((r) => !r.success);

  return NextResponse.json(
    { results, refreshedAt: new Date().toISOString() },
    { status: hasFailure ? 207 : 200 }
  );
}
