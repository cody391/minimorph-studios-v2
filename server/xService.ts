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

  // Decode the URL-encoded bearer token
  const bearerToken = decodeURIComponent(ENV.xBearerToken);
  _readClient = new TwitterApi(bearerToken);
  return _readClient;
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

    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    // Determine mime type
    const contentType = response.headers.get("content-type") || "image/png";

    // Upload media to X
    const mediaId = await client.v1.uploadMedia(imageBuffer, {
      mimeType: contentType as any,
    });

    // Post tweet with media
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
