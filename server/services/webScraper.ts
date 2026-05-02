export async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MiniMorph/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);
  } catch {
    return "";
  }
}

export function extractUrls(messages: Array<{ role: string; content: string }>): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>)]+/g;
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const msg of messages.slice(-6)) {
    const found = msg.content.match(urlRegex) || [];
    for (const u of found) {
      const clean = u.replace(/[.,;:!?]+$/, "");
      if (!seen.has(clean)) {
        seen.add(clean);
        urls.push(clean);
        if (urls.length >= 4) return urls;
      }
    }
  }
  return urls;
}
