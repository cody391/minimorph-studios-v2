import { ENV } from "../_core/env";

export interface SiteAnalytics {
  pageviews: number;
  visitors: number;
  bounceRate: number;
}

/**
 * Fetch real pageview data from Cloudflare Analytics GraphQL API.
 * Returns zeros if the token/accountId are not configured or the query fails.
 *
 * siteTag is the Cloudflare Analytics token embedded in the site beacon
 * (same value as CLOUDFLARE_ANALYTICS_TOKEN).
 */
export async function getCloudflareAnalytics(
  startDate: string,
  endDate: string,
): Promise<SiteAnalytics> {
  const token = ENV.cloudflareAnalyticsToken;
  const accountId = ENV.cloudflareAccountId;
  if (!token || !accountId) {
    return { pageviews: 0, visitors: 0, bounceRate: 0 };
  }

  const query = `{
    viewer {
      accounts(filter: { accountTag: "${accountId}" }) {
        total: rumPageloadEventsAdaptiveGroups(
          filter: {
            AND: [
              { datetime_geq: "${startDate}T00:00:00Z" }
              { datetime_leq: "${endDate}T23:59:59Z" }
            ]
          }
          limit: 1
        ) {
          count
          sum { visits }
        }
      }
    }
  }`;

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(`[Analytics] Cloudflare API returned ${res.status}`);
      return { pageviews: 0, visitors: 0, bounceRate: 0 };
    }

    const data = (await res.json()) as {
      data?: {
        viewer?: {
          accounts?: Array<{
            total?: Array<{ count?: number; sum?: { visits?: number } }>;
          }>;
        };
      };
    };

    const total = data?.data?.viewer?.accounts?.[0]?.total?.[0];
    return {
      pageviews: total?.count ?? 0,
      visitors: total?.sum?.visits ?? 0,
      bounceRate: 0,
    };
  } catch (err) {
    console.warn("[Analytics] Cloudflare analytics fetch failed:", err);
    return { pageviews: 0, visitors: 0, bounceRate: 0 };
  }
}
