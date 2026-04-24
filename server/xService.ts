import { TwitterApi, type TweetV2PostTweetResult } from "twitter-api-v2";
import { ENV } from "./_core/env";

// ─── X (Twitter) Client Singleton ──────────────────────────────────
let _client: TwitterApi | null = null;

function getClient(): TwitterApi {
  if (_client) return _client;

  if (!ENV.xApiKey || !ENV.xApiSecret || !ENV.xAccessToken || !ENV.xAccessTokenSecret) {
    throw new Error("X API credentials not configured. Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET.");
  }

  _client = new TwitterApi({
    appKey: ENV.xApiKey,
    appSecret: ENV.xApiSecret,
    accessToken: ENV.xAccessToken,
    accessSecret: ENV.xAccessTokenSecret,
  });

  return _client;
}

// Read-only client using Bearer Token (for fetching data)
let _readClient: TwitterApi | null = null;

function getReadClient(): TwitterApi {
  if (_readClient) return _readClient;

  if (!ENV.xBearerToken) {
    throw new Error("X Bearer Token not configured. Set X_BEARER_TOKEN.");
  }

  const bearerToken = decodeURIComponent(ENV.xBearerToken);
  _readClient = new TwitterApi(bearerToken);
  return _readClient;
}

// ─── Rate Limit Tracking ──────────────────────────────────────────
const DAILY_LIMITS = {
  follows: 40,
  likes: 80,
  replies: 20,
  unfollows: 30,
};

interface DailyCounters {
  date: string; // YYYY-MM-DD
  follows: number;
  likes: number;
  replies: number;
  unfollows: number;
}

let _counters: DailyCounters = {
  date: new Date().toISOString().split("T")[0],
  follows: 0,
  likes: 0,
  replies: 0,
  unfollows: 0,
};

function getCounters(): DailyCounters {
  const today = new Date().toISOString().split("T")[0];
  if (_counters.date !== today) {
    _counters = { date: today, follows: 0, likes: 0, replies: 0, unfollows: 0 };
  }
  return _counters;
}

function canPerformAction(action: keyof typeof DAILY_LIMITS): boolean {
  const counters = getCounters();
  return counters[action] < DAILY_LIMITS[action];
}

function incrementCounter(action: keyof typeof DAILY_LIMITS): void {
  const counters = getCounters();
  counters[action]++;
}

export function getRateLimitStatus() {
  const counters = getCounters();
  return {
    date: counters.date,
    follows: { used: counters.follows, limit: DAILY_LIMITS.follows, remaining: DAILY_LIMITS.follows - counters.follows },
    likes: { used: counters.likes, limit: DAILY_LIMITS.likes, remaining: DAILY_LIMITS.likes - counters.likes },
    replies: { used: counters.replies, limit: DAILY_LIMITS.replies, remaining: DAILY_LIMITS.replies - counters.replies },
    unfollows: { used: counters.unfollows, limit: DAILY_LIMITS.unfollows, remaining: DAILY_LIMITS.unfollows - counters.unfollows },
  };
}

// ─── Post a Tweet ──────────────────────────────────────────────────
export async function postTweet(text: string): Promise<{
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}> {
  try {
    const client = getClient();
    const result: TweetV2PostTweetResult = await client.v2.tweet(text);

    return {
      success: true,
      tweetId: result.data.id,
      tweetUrl: `https://x.com/i/status/${result.data.id}`,
    };
  } catch (err: any) {
    console.error("[X Service] Failed to post tweet:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error posting to X",
    };
  }
}

// ─── Post a Tweet with Media (image URL) ───────────────────────────
export async function postTweetWithMedia(
  text: string,
  imageUrl: string
): Promise<{
  success: boolean;
  tweetId?: string;
  tweetUrl?: string;
  error?: string;
}> {
  try {
    const client = getClient();

    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    const contentType = response.headers.get("content-type") || "image/png";

    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: contentType as any,
    });

    const result = await client.v2.tweet({
      text,
      media: { media_ids: [mediaId] },
    });

    return {
      success: true,
      tweetId: result.data.id,
      tweetUrl: `https://x.com/i/status/${result.data.id}`,
    };
  } catch (err: any) {
    console.error("[X Service] Failed to post tweet with media:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error posting to X with media",
    };
  }
}

// ─── Reply to a Tweet ─────────────────────────────────────────────
export async function replyToTweet(
  tweetId: string,
  text: string
): Promise<{
  success: boolean;
  replyId?: string;
  replyUrl?: string;
  error?: string;
}> {
  try {
    if (!canPerformAction("replies")) {
      return { success: false, error: `Daily reply limit reached (${DAILY_LIMITS.replies}/day)` };
    }

    const client = getClient();
    const result = await client.v2.tweet({
      text,
      reply: { in_reply_to_tweet_id: tweetId },
    });

    incrementCounter("replies");

    return {
      success: true,
      replyId: result.data.id,
      replyUrl: `https://x.com/i/status/${result.data.id}`,
    };
  } catch (err: any) {
    console.error("[X Service] Failed to reply to tweet:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error replying to tweet",
    };
  }
}

// ─── Like a Tweet ─────────────────────────────────────────────────
export async function likeTweet(tweetId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!canPerformAction("likes")) {
      return { success: false, error: `Daily like limit reached (${DAILY_LIMITS.likes}/day)` };
    }

    const client = getClient();
    const me = await client.v2.me();
    await client.v2.like(me.data.id, tweetId);

    incrementCounter("likes");
    return { success: true };
  } catch (err: any) {
    console.error("[X Service] Failed to like tweet:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error liking tweet",
    };
  }
}

// ─── Follow a User ────────────────────────────────────────────────
export async function followUser(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!canPerformAction("follows")) {
      return { success: false, error: `Daily follow limit reached (${DAILY_LIMITS.follows}/day)` };
    }

    const client = getClient();
    const me = await client.v2.me();
    await client.v2.follow(me.data.id, targetUserId);

    incrementCounter("follows");
    return { success: true };
  } catch (err: any) {
    console.error("[X Service] Failed to follow user:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error following user",
    };
  }
}

// ─── Unfollow a User ──────────────────────────────────────────────
export async function unfollowUser(targetUserId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!canPerformAction("unfollows")) {
      return { success: false, error: `Daily unfollow limit reached (${DAILY_LIMITS.unfollows}/day)` };
    }

    const client = getClient();
    const me = await client.v2.me();
    await client.v2.unfollow(me.data.id, targetUserId);

    incrementCounter("unfollows");
    return { success: true };
  } catch (err: any) {
    console.error("[X Service] Failed to unfollow user:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error unfollowing user",
    };
  }
}

// ─── Search Tweets ────────────────────────────────────────────────
export async function searchTweets(
  query: string,
  maxResults: number = 20
): Promise<{
  success: boolean;
  tweets?: Array<{
    id: string;
    text: string;
    authorId: string;
    authorUsername?: string;
    authorName?: string;
    createdAt?: string;
    likes?: number;
    retweets?: number;
    replies?: number;
  }>;
  error?: string;
}> {
  try {
    const client = getReadClient();
    const result = await client.v2.search(query, {
      max_results: Math.min(maxResults, 100),
      "tweet.fields": ["created_at", "public_metrics", "author_id"],
      expansions: ["author_id"],
      "user.fields": ["username", "name"],
    });

    const users = new Map<string, { username: string; name: string }>();
    if (result.includes?.users) {
      for (const u of result.includes.users) {
        users.set(u.id, { username: u.username, name: u.name });
      }
    }

    const tweets = (result.data.data || []).map((t) => {
      const author = users.get(t.author_id || "");
      return {
        id: t.id,
        text: t.text,
        authorId: t.author_id || "",
        authorUsername: author?.username,
        authorName: author?.name,
        createdAt: t.created_at,
        likes: t.public_metrics?.like_count,
        retweets: t.public_metrics?.retweet_count,
        replies: t.public_metrics?.reply_count,
      };
    });

    return { success: true, tweets };
  } catch (err: any) {
    console.error("[X Service] Failed to search tweets:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error searching tweets",
    };
  }
}

// ─── Search Users ─────────────────────────────────────────────────
export async function searchUsers(
  query: string,
  maxResults: number = 20
): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    username: string;
    name: string;
    description?: string;
    followersCount?: number;
    followingCount?: number;
    verified?: boolean;
  }>;
  error?: string;
}> {
  try {
    // Use user search via v1 API
    const v1Client = getClient();
    const searchResult = await v1Client.v1.searchUsers(query, { count: Math.min(maxResults, 20) });

    const users: Array<{
      id: string;
      username: string;
      name: string;
      description?: string;
      followersCount?: number;
      followingCount?: number;
      verified?: boolean;
    }> = [];
    for await (const u of searchResult) {
      users.push({
        id: u.id_str,
        username: u.screen_name,
        name: u.name,
        description: u.description || undefined,
        followersCount: u.followers_count,
        followingCount: u.friends_count,
        verified: u.verified,
      });
      if (users.length >= maxResults) break;
    }

    return { success: true, users };
  } catch (err: any) {
    console.error("[X Service] Failed to search users:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error searching users",
    };
  }
}

// ─── Get Our Followers ────────────────────────────────────────────
export async function getFollowers(maxResults: number = 100): Promise<{
  success: boolean;
  followers?: Array<{ id: string; username: string; name: string }>;
  error?: string;
}> {
  try {
    const client = getClient();
    const me = await client.v2.me();
    const result = await client.v2.followers(me.data.id, {
      max_results: Math.min(maxResults, 1000),
      "user.fields": ["username", "name"],
    });

    const followers: Array<{ id: string; username: string; name: string }> = [];
    for (const u of result.data) {
      followers.push({ id: u.id, username: u.username, name: u.name });
    }

    return { success: true, followers };
  } catch (err: any) {
    console.error("[X Service] Failed to get followers:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error getting followers",
    };
  }
}

// ─── Get Who We Follow ────────────────────────────────────────────
export async function getFollowing(maxResults: number = 100): Promise<{
  success: boolean;
  following?: Array<{ id: string; username: string; name: string }>;
  error?: string;
}> {
  try {
    const client = getClient();
    const me = await client.v2.me();
    const result = await client.v2.following(me.data.id, {
      max_results: Math.min(maxResults, 1000),
      "user.fields": ["username", "name"],
    });

    const following: Array<{ id: string; username: string; name: string }> = [];
    for (const u of result.data) {
      following.push({ id: u.id, username: u.username, name: u.name });
    }

    return { success: true, following };
  } catch (err: any) {
    console.error("[X Service] Failed to get following:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error getting following list",
    };
  }
}

// ─── Get Account Metrics ──────────────────────────────────────────
export async function getAccountMetrics(): Promise<{
  success: boolean;
  metrics?: {
    username: string;
    name: string;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
  };
  error?: string;
}> {
  try {
    const client = getClient();
    const me = await client.v2.me({ "user.fields": ["public_metrics", "username", "name"] });

    return {
      success: true,
      metrics: {
        username: me.data.username,
        name: me.data.name,
        followersCount: me.data.public_metrics?.followers_count || 0,
        followingCount: me.data.public_metrics?.following_count || 0,
        tweetCount: me.data.public_metrics?.tweet_count || 0,
      },
    };
  } catch (err: any) {
    console.error("[X Service] Failed to get account metrics:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error getting account metrics",
    };
  }
}

// ─── Delete a Tweet ────────────────────────────────────────────────
export async function deleteTweet(tweetId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getClient();
    await client.v2.deleteTweet(tweetId);
    return { success: true };
  } catch (err: any) {
    console.error("[X Service] Failed to delete tweet:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error deleting tweet",
    };
  }
}

// ─── Verify Credentials ───────────────────────────────────────────
export async function verifyCredentials(): Promise<{
  success: boolean;
  username?: string;
  userId?: string;
  error?: string;
}> {
  try {
    const client = getClient();
    const me = await client.v2.me();
    return {
      success: true,
      username: me.data.username,
      userId: me.data.id,
    };
  } catch (err: any) {
    console.error("[X Service] Failed to verify credentials:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error verifying X credentials",
    };
  }
}

// ─── Get User Timeline (recent tweets) ────────────────────────────
export async function getUserTimeline(maxResults: number = 10): Promise<{
  success: boolean;
  tweets?: Array<{ id: string; text: string; createdAt?: string }>;
  error?: string;
}> {
  try {
    const client = getClient();
    const me = await client.v2.me();
    const timeline = await client.v2.userTimeline(me.data.id, {
      max_results: Math.min(maxResults, 100),
      "tweet.fields": ["created_at", "public_metrics"],
    });

    const tweets = timeline.data.data?.map((t) => ({
      id: t.id,
      text: t.text,
      createdAt: t.created_at,
    })) || [];

    return { success: true, tweets };
  } catch (err: any) {
    console.error("[X Service] Failed to get timeline:", err?.message || err);
    return {
      success: false,
      error: err?.message || "Unknown error fetching timeline",
    };
  }
}

// ─── Check if X is configured ─────────────────────────────────────
export function isXConfigured(): boolean {
  return !!(ENV.xApiKey && ENV.xApiSecret && ENV.xAccessToken && ENV.xAccessTokenSecret);
}
