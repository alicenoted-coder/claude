export type Platform = "youtube" | "facebook" | "instagram" | "threads";

export interface SocialProfile {
  id: string;
  platform: Platform;
  username: string;
  displayName: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  profileImageUrl?: string;
  verified?: boolean;
  url: string;
}

export interface SocialPost {
  id: string;
  platform: Platform;
  authorId: string;
  authorUsername: string;
  content: string;
  mediaUrls?: string[];
  publishedAt: string;
  url: string;
  stats: PostStats;
}

export interface PostStats {
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  viewCount?: number;
  repostCount?: number;
}

export interface SocialComment {
  id: string;
  platform: Platform;
  postId: string;
  authorId: string;
  authorUsername: string;
  content: string;
  publishedAt: string;
  likeCount?: number;
  replies?: SocialComment[];
}

export interface FetchOptions {
  maxResults?: number;
  pageToken?: string;
  since?: string;
}

export interface FetchResult<T> {
  data: T[];
  nextPageToken?: string;
  total?: number;
}
