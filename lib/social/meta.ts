import type {
  SocialProfile,
  SocialPost,
  SocialComment,
  FetchOptions,
  FetchResult,
  Platform,
} from "./types";
import { getValidToken } from "./token-refresh";
import type { TokenPlatform } from "./token-store";

const META_BASE = "https://graph.facebook.com/v21.0";
const THREADS_BASE = "https://graph.threads.net/v1.0";

function baseUrl(platform: Platform) {
  return platform === "threads" ? THREADS_BASE : META_BASE;
}

async function resolveToken(platform: Platform, userToken?: string): Promise<string> {
  if (userToken) return userToken;
  // YouTube 不走這裡，platform 必定是 Meta 的三個平台之一
  return getValidToken(platform as TokenPlatform);
}

async function metaFetch<T>(
  platform: Platform,
  path: string,
  params: Record<string, string>,
  userToken?: string
): Promise<T> {
  const url = new URL(`${baseUrl(platform)}${path}`);
  url.searchParams.set("access_token", await resolveToken(platform, userToken));
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(`Meta API error: ${JSON.stringify(body.error ?? body)}`);
  }
  return body;
}

// ─── Facebook ────────────────────────────────────────────────────────────────

export async function getFacebookPageProfile(
  pageIdOrSlug: string,
  userToken?: string
): Promise<SocialProfile> {
  const data = await metaFetch<{
    id: string;
    name: string;
    about?: string;
    fan_count?: number;
    followers_count?: number;
    posts_count?: number;
    picture?: { data: { url: string } };
    link?: string;
  }>(
    "facebook",
    `/${pageIdOrSlug}`,
    { fields: "id,name,about,fan_count,followers_count,picture,link" },
    userToken
  );

  return {
    id: data.id,
    platform: "facebook",
    username: pageIdOrSlug,
    displayName: data.name,
    bio: data.about,
    followerCount: data.followers_count ?? data.fan_count,
    profileImageUrl: data.picture?.data?.url,
    url: data.link ?? `https://www.facebook.com/${pageIdOrSlug}`,
  };
}

export async function getFacebookPagePosts(
  pageId: string,
  options: FetchOptions = {},
  userToken?: string
): Promise<FetchResult<SocialPost>> {
  const params: Record<string, string> = {
    fields: "id,message,story,created_time,full_picture,shares,reactions.summary(true),comments.summary(true)",
    limit: String(options.maxResults ?? 20),
  };
  if (options.pageToken) params.after = options.pageToken;
  if (options.since) params.since = String(Math.floor(new Date(options.since).getTime() / 1000));

  const data = await metaFetch<{
    data: {
      id: string;
      message?: string;
      story?: string;
      created_time: string;
      full_picture?: string;
      shares?: { count: number };
      reactions?: { summary: { total_count: number } };
      comments?: { summary: { total_count: number } };
    }[];
    paging?: { cursors: { after: string }; next?: string };
  }>( "facebook", `/${pageId}/posts`, params, userToken);

  const posts: SocialPost[] = data.data.map((item) => ({
    id: item.id,
    platform: "facebook",
    authorId: pageId,
    authorUsername: pageId,
    content: item.message ?? item.story ?? "",
    mediaUrls: item.full_picture ? [item.full_picture] : [],
    publishedAt: item.created_time,
    url: `https://www.facebook.com/${item.id.replace("_", "/posts/")}`,
    stats: {
      likeCount: item.reactions?.summary?.total_count,
      commentCount: item.comments?.summary?.total_count,
      shareCount: item.shares?.count,
    },
  }));

  return {
    data: posts,
    nextPageToken: data.paging?.next ? data.paging.cursors.after : undefined,
  };
}

export async function getFacebookPostComments(
  postId: string,
  options: FetchOptions = {},
  userToken?: string
): Promise<FetchResult<SocialComment>> {
  const params: Record<string, string> = {
    fields: "id,from,message,created_time,like_count,comments{id,from,message,created_time,like_count}",
    limit: String(options.maxResults ?? 50),
  };
  if (options.pageToken) params.after = options.pageToken;

  const data = await metaFetch<{
    data: {
      id: string;
      from?: { id: string; name: string };
      message: string;
      created_time: string;
      like_count?: number;
      comments?: {
        data: { id: string; from?: { id: string; name: string }; message: string; created_time: string; like_count?: number }[];
      };
    }[];
    paging?: { cursors: { after: string }; next?: string };
  }>("facebook", `/${postId}/comments`, params, userToken);

  const comments: SocialComment[] = data.data.map((c) => ({
    id: c.id,
    platform: "facebook",
    postId,
    authorId: c.from?.id ?? "",
    authorUsername: c.from?.name ?? "",
    content: c.message,
    publishedAt: c.created_time,
    likeCount: c.like_count,
    replies: c.comments?.data.map((r) => ({
      id: r.id,
      platform: "facebook" as const,
      postId,
      authorId: r.from?.id ?? "",
      authorUsername: r.from?.name ?? "",
      content: r.message,
      publishedAt: r.created_time,
      likeCount: r.like_count,
    })),
  }));

  return {
    data: comments,
    nextPageToken: data.paging?.next ? data.paging.cursors.after : undefined,
  };
}

// ─── Instagram ───────────────────────────────────────────────────────────────

export async function getInstagramProfile(
  igUserId: string,
  userToken?: string
): Promise<SocialProfile> {
  const data = await metaFetch<{
    id: string;
    username: string;
    name: string;
    biography?: string;
    followers_count?: number;
    follows_count?: number;
    media_count?: number;
    profile_picture_url?: string;
  }>(
    "instagram",
    `/${igUserId}`,
    { fields: "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url" },
    userToken
  );

  return {
    id: data.id,
    platform: "instagram",
    username: data.username,
    displayName: data.name,
    bio: data.biography,
    followerCount: data.followers_count,
    followingCount: data.follows_count,
    postCount: data.media_count,
    profileImageUrl: data.profile_picture_url,
    url: `https://www.instagram.com/${data.username}`,
  };
}

export async function getInstagramPosts(
  igUserId: string,
  options: FetchOptions = {},
  userToken?: string
): Promise<FetchResult<SocialPost>> {
  const params: Record<string, string> = {
    fields: "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count",
    limit: String(options.maxResults ?? 20),
  };
  if (options.pageToken) params.after = options.pageToken;
  if (options.since) params.since = options.since;

  const data = await metaFetch<{
    data: {
      id: string;
      caption?: string;
      media_type: string;
      media_url?: string;
      thumbnail_url?: string;
      timestamp: string;
      permalink: string;
      like_count?: number;
      comments_count?: number;
    }[];
    paging?: { cursors: { after: string }; next?: string };
  }>("instagram", `/${igUserId}/media`, params, userToken);

  const posts: SocialPost[] = data.data.map((item) => ({
    id: item.id,
    platform: "instagram",
    authorId: igUserId,
    authorUsername: igUserId,
    content: item.caption ?? "",
    mediaUrls: [item.media_url ?? item.thumbnail_url].filter(Boolean) as string[],
    publishedAt: item.timestamp,
    url: item.permalink,
    stats: {
      likeCount: item.like_count,
      commentCount: item.comments_count,
    },
  }));

  return {
    data: posts,
    nextPageToken: data.paging?.next ? data.paging.cursors.after : undefined,
  };
}

export async function getInstagramComments(
  mediaId: string,
  options: FetchOptions = {},
  userToken?: string
): Promise<FetchResult<SocialComment>> {
  const params: Record<string, string> = {
    fields: "id,username,text,timestamp,like_count,replies{id,username,text,timestamp,like_count}",
    limit: String(options.maxResults ?? 50),
  };
  if (options.pageToken) params.after = options.pageToken;

  const data = await metaFetch<{
    data: {
      id: string;
      username: string;
      text: string;
      timestamp: string;
      like_count?: number;
      replies?: {
        data: { id: string; username: string; text: string; timestamp: string; like_count?: number }[];
      };
    }[];
    paging?: { cursors: { after: string }; next?: string };
  }>("instagram", `/${mediaId}/comments`, params, userToken);

  const comments: SocialComment[] = data.data.map((c) => ({
    id: c.id,
    platform: "instagram",
    postId: mediaId,
    authorId: c.username,
    authorUsername: c.username,
    content: c.text,
    publishedAt: c.timestamp,
    likeCount: c.like_count,
    replies: c.replies?.data.map((r) => ({
      id: r.id,
      platform: "instagram" as const,
      postId: mediaId,
      authorId: r.username,
      authorUsername: r.username,
      content: r.text,
      publishedAt: r.timestamp,
      likeCount: r.like_count,
    })),
  }));

  return {
    data: comments,
    nextPageToken: data.paging?.next ? data.paging.cursors.after : undefined,
  };
}

// ─── Threads ─────────────────────────────────────────────────────────────────

export async function getThreadsProfile(
  userId: string,
  userToken?: string
): Promise<SocialProfile> {
  const data = await metaFetch<{
    id: string;
    username: string;
    name?: string;
    biography?: string;
    followers_count?: number;
    threads_count?: number;
    profile_picture_url?: string;
  }>(
    "threads",
    `/${userId}`,
    { fields: "id,username,name,biography,followers_count,threads_count,profile_picture_url" },
    userToken
  );

  return {
    id: data.id,
    platform: "threads",
    username: data.username,
    displayName: data.name ?? data.username,
    bio: data.biography,
    followerCount: data.followers_count,
    postCount: data.threads_count,
    profileImageUrl: data.profile_picture_url,
    url: `https://www.threads.net/@${data.username}`,
  };
}

export async function getThreadsPosts(
  userId: string,
  options: FetchOptions = {},
  userToken?: string
): Promise<FetchResult<SocialPost>> {
  const params: Record<string, string> = {
    fields: "id,text,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,replies_count,reposts_count,quotes_count",
    limit: String(options.maxResults ?? 20),
  };
  if (options.pageToken) params.after = options.pageToken;
  if (options.since) params.since = options.since;

  const data = await metaFetch<{
    data: {
      id: string;
      text?: string;
      media_type?: string;
      media_url?: string;
      thumbnail_url?: string;
      timestamp: string;
      permalink?: string;
      like_count?: number;
      replies_count?: number;
      reposts_count?: number;
      quotes_count?: number;
    }[];
    paging?: { cursors: { after: string }; next?: string };
  }>("threads", `/${userId}/threads`, params, userToken);

  const posts: SocialPost[] = data.data.map((item) => ({
    id: item.id,
    platform: "threads",
    authorId: userId,
    authorUsername: userId,
    content: item.text ?? "",
    mediaUrls: [item.media_url ?? item.thumbnail_url].filter(Boolean) as string[],
    publishedAt: item.timestamp,
    url: item.permalink ?? `https://www.threads.net/t/${item.id}`,
    stats: {
      likeCount: item.like_count,
      commentCount: item.replies_count,
      repostCount: item.reposts_count,
    },
  }));

  return {
    data: posts,
    nextPageToken: data.paging?.next ? data.paging.cursors.after : undefined,
  };
}

export async function getThreadsReplies(
  postId: string,
  options: FetchOptions = {},
  userToken?: string
): Promise<FetchResult<SocialComment>> {
  const params: Record<string, string> = {
    fields: "id,username,text,timestamp,like_count",
    limit: String(options.maxResults ?? 50),
  };
  if (options.pageToken) params.after = options.pageToken;

  const data = await metaFetch<{
    data: {
      id: string;
      username?: string;
      text?: string;
      timestamp: string;
      like_count?: number;
    }[];
    paging?: { cursors: { after: string }; next?: string };
  }>("threads", `/${postId}/replies`, params, userToken);

  const comments: SocialComment[] = data.data.map((r) => ({
    id: r.id,
    platform: "threads",
    postId,
    authorId: r.username ?? "",
    authorUsername: r.username ?? "",
    content: r.text ?? "",
    publishedAt: r.timestamp,
    likeCount: r.like_count,
  }));

  return {
    data: comments,
    nextPageToken: data.paging?.next ? data.paging.cursors.after : undefined,
  };
}
