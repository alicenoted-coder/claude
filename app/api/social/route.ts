import { NextRequest, NextResponse } from "next/server";
import {
  getChannelProfile,
  getChannelVideos,
  getVideoComments,
  getFacebookPageProfile,
  getFacebookPagePosts,
  getFacebookPostComments,
  getInstagramProfile,
  getInstagramPosts,
  getInstagramComments,
  getThreadsProfile,
  getThreadsPosts,
  getThreadsReplies,
} from "@/lib/social";
import type { FetchOptions, Platform } from "@/lib/social";

/**
 * GET /api/social?platform=youtube&action=profile&id=@MrBeast
 * GET /api/social?platform=youtube&action=posts&id=UCX6OQ3DkcsbYNE6H8uQQuVA&maxResults=10
 * GET /api/social?platform=youtube&action=comments&id=<videoId>
 * GET /api/social?platform=facebook&action=profile&id=<pageId>
 * GET /api/social?platform=facebook&action=posts&id=<pageId>
 * GET /api/social?platform=facebook&action=comments&id=<postId>
 * GET /api/social?platform=instagram&action=profile&id=<igUserId>
 * GET /api/social?platform=instagram&action=posts&id=<igUserId>
 * GET /api/social?platform=instagram&action=comments&id=<mediaId>
 * GET /api/social?platform=threads&action=profile&id=<userId>
 * GET /api/social?platform=threads&action=posts&id=<userId>
 * GET /api/social?platform=threads&action=comments&id=<postId>
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform") as Platform | null;
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  if (!platform || !action || !id) {
    return NextResponse.json(
      { error: "platform, action, id 為必填參數" },
      { status: 400 }
    );
  }

  const options: FetchOptions = {
    maxResults: Number(searchParams.get("maxResults") ?? 20),
    pageToken: searchParams.get("pageToken") ?? undefined,
    since: searchParams.get("since") ?? undefined,
  };

  try {
    let result: unknown;

    if (platform === "youtube") {
      if (action === "profile") result = await getChannelProfile(id);
      else if (action === "posts") result = await getChannelVideos(id, options);
      else if (action === "comments") result = await getVideoComments(id, options);
      else return NextResponse.json({ error: `不支援的 action: ${action}` }, { status: 400 });
    } else if (platform === "facebook") {
      if (action === "profile") result = await getFacebookPageProfile(id);
      else if (action === "posts") result = await getFacebookPagePosts(id, options);
      else if (action === "comments") result = await getFacebookPostComments(id, options);
      else return NextResponse.json({ error: `不支援的 action: ${action}` }, { status: 400 });
    } else if (platform === "instagram") {
      if (action === "profile") result = await getInstagramProfile(id);
      else if (action === "posts") result = await getInstagramPosts(id, options);
      else if (action === "comments") result = await getInstagramComments(id, options);
      else return NextResponse.json({ error: `不支援的 action: ${action}` }, { status: 400 });
    } else if (platform === "threads") {
      if (action === "profile") result = await getThreadsProfile(id);
      else if (action === "posts") result = await getThreadsPosts(id, options);
      else if (action === "comments") result = await getThreadsReplies(id, options);
      else return NextResponse.json({ error: `不支援的 action: ${action}` }, { status: 400 });
    } else {
      return NextResponse.json({ error: `不支援的平台: ${platform}` }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
