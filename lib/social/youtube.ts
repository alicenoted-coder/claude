import type {
  SocialProfile,
  SocialPost,
  SocialComment,
  FetchOptions,
  FetchResult,
} from "./types";

const BASE_URL = "https://www.googleapis.com/youtube/v3";

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("Missing YOUTUBE_API_KEY");
  return key;
}

async function ytFetch<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("key", apiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`YouTube API error ${res.status}: ${JSON.stringify(err)}`);
  }
  return res.json();
}

// channelId 或 username（@handle）
async function resolveChannelId(channelIdOrHandle: string): Promise<string> {
  if (channelIdOrHandle.startsWith("UC")) return channelIdOrHandle;

  const handle = channelIdOrHandle.replace(/^@/, "");
  const data = await ytFetch<{ items?: { id: string }[] }>("channels", {
    part: "id",
    forHandle: handle,
  });
  const id = data.items?.[0]?.id;
  if (!id) throw new Error(`找不到頻道: ${channelIdOrHandle}`);
  return id;
}

export async function getChannelProfile(channelIdOrHandle: string): Promise<SocialProfile> {
  const channelId = await resolveChannelId(channelIdOrHandle);
  const data = await ytFetch<{
    items?: {
      id: string;
      snippet: { title: string; description: string; thumbnails: { default: { url: string } }; customUrl: string };
      statistics: { subscriberCount: string; videoCount: string };
    }[];
  }>("channels", {
    part: "snippet,statistics",
    id: channelId,
  });

  const ch = data.items?.[0];
  if (!ch) throw new Error(`頻道不存在: ${channelId}`);

  return {
    id: ch.id,
    platform: "youtube",
    username: ch.snippet.customUrl ?? channelId,
    displayName: ch.snippet.title,
    bio: ch.snippet.description,
    followerCount: Number(ch.statistics.subscriberCount),
    postCount: Number(ch.statistics.videoCount),
    profileImageUrl: ch.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/${ch.snippet.customUrl ?? `channel/${ch.id}`}`,
  };
}

export async function getChannelVideos(
  channelIdOrHandle: string,
  options: FetchOptions = {}
): Promise<FetchResult<SocialPost>> {
  const channelId = await resolveChannelId(channelIdOrHandle);
  const params: Record<string, string> = {
    part: "snippet,statistics",
    channelId,
    maxResults: String(options.maxResults ?? 20),
    order: "date",
    type: "video",
  };
  if (options.pageToken) params.pageToken = options.pageToken;
  if (options.since) params.publishedAfter = options.since;

  const data = await ytFetch<{
    items?: {
      id: { videoId: string };
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        channelTitle: string;
        thumbnails: { high: { url: string } };
      };
    }[];
    nextPageToken?: string;
    pageInfo: { totalResults: number };
  }>("search", params);

  const posts: SocialPost[] = (data.items ?? []).map((item) => ({
    id: item.id.videoId,
    platform: "youtube",
    authorId: item.snippet.channelId,
    authorUsername: item.snippet.channelTitle,
    content: item.snippet.title + (item.snippet.description ? `\n\n${item.snippet.description}` : ""),
    mediaUrls: item.snippet.thumbnails?.high?.url ? [item.snippet.thumbnails.high.url] : [],
    publishedAt: item.snippet.publishedAt,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    stats: {},
  }));

  // 批次取得影片統計
  if (posts.length > 0) {
    const ids = posts.map((p) => p.id).join(",");
    const statsData = await ytFetch<{
      items?: { id: string; statistics: { viewCount: string; likeCount: string; commentCount: string } }[];
    }>("videos", { part: "statistics", id: ids });

    const statsMap = new Map(statsData.items?.map((v) => [v.id, v.statistics]) ?? []);
    for (const post of posts) {
      const s = statsMap.get(post.id);
      if (s) {
        post.stats = {
          viewCount: Number(s.viewCount),
          likeCount: Number(s.likeCount),
          commentCount: Number(s.commentCount),
        };
      }
    }
  }

  return {
    data: posts,
    nextPageToken: data.nextPageToken,
    total: data.pageInfo?.totalResults,
  };
}

export async function getVideoComments(
  videoId: string,
  options: FetchOptions = {}
): Promise<FetchResult<SocialComment>> {
  const params: Record<string, string> = {
    part: "snippet,replies",
    videoId,
    maxResults: String(options.maxResults ?? 50),
    order: "relevance",
  };
  if (options.pageToken) params.pageToken = options.pageToken;

  const data = await ytFetch<{
    items?: {
      id: string;
      snippet: {
        topLevelComment: {
          id: string;
          snippet: {
            authorDisplayName: string;
            authorChannelId: { value: string };
            textDisplay: string;
            publishedAt: string;
            likeCount: number;
          };
        };
        totalReplyCount: number;
      };
      replies?: {
        comments: {
          id: string;
          snippet: {
            authorDisplayName: string;
            authorChannelId: { value: string };
            textDisplay: string;
            publishedAt: string;
            likeCount: number;
          };
        }[];
      };
    }[];
    nextPageToken?: string;
    pageInfo: { totalResults: number };
  }>("commentThreads", params);

  const comments: SocialComment[] = (data.items ?? []).map((thread) => {
    const top = thread.snippet.topLevelComment.snippet;
    return {
      id: thread.snippet.topLevelComment.id,
      platform: "youtube",
      postId: videoId,
      authorId: top.authorChannelId?.value ?? "",
      authorUsername: top.authorDisplayName,
      content: top.textDisplay,
      publishedAt: top.publishedAt,
      likeCount: top.likeCount,
      replies: thread.replies?.comments.map((r) => ({
        id: r.id,
        platform: "youtube" as const,
        postId: videoId,
        authorId: r.snippet.authorChannelId?.value ?? "",
        authorUsername: r.snippet.authorDisplayName,
        content: r.snippet.textDisplay,
        publishedAt: r.snippet.publishedAt,
        likeCount: r.snippet.likeCount,
      })),
    };
  });

  return {
    data: comments,
    nextPageToken: data.nextPageToken,
    total: data.pageInfo?.totalResults,
  };
}
