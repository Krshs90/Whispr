/**
 * Native Web Scraper — lightweight, timeout-protected, no hidden BrowserWindows.
 * Uses native fetch() exclusively to avoid RAM leaks and freezes.
 */

/**
 * Search the web using DuckDuckGo via a native HTTP fetch.
 * Has hard timeouts to prevent the backend from freezing.
 */
export async function searchWeb(query) {
  console.log(`[WebScraper] Native Fetch Searching: "${query}"`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s hard timeout

    const encodedQuery = encodeURIComponent(query);
    const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`DDG returned ${response.status}`);
    }

    const html = await response.text();
    const results = [];

    // Regex parsing for DDG HTML
    const resultBlockRegex = /<div class="[^"]*result__body[^"]*">([\s\S]*?)<div class="clear"><\/div>/g;
    let match;

    while ((match = resultBlockRegex.exec(html)) !== null) {
      if (results.length >= 5) break;

      const block = match[1];

      // Extract title and raw URL from the title block
      const titleMatch = block.match(/<h2 class="result__title">\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      // Extract snippet
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch && snippetMatch) {
        let rawLink = titleMatch[1];
        // Clean up the URL if it's routed through DDG's tracker
        if (rawLink.includes('uddg=')) {
          try {
            rawLink = decodeURIComponent(rawLink.split('uddg=')[1].split('&')[0]);
          } catch (e) {}
        }
        if (rawLink.startsWith('//')) {
          rawLink = 'https:' + rawLink;
        }

        // Clean up HTML entities and tags from title and snippet
        const cleanHtml = (str) => str.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/<b>/g, '').replace(/<\/b>/g, '').trim();

        results.push({
          title: cleanHtml(titleMatch[2]),
          snippet: cleanHtml(snippetMatch[1]),
          link: rawLink
        });
      }
    }

    if (results.length === 0) {
      return await searchWikipediaAPI(query); // Lightweight API fallback
    }

    return {
      results,
      source: 'DuckDuckGo (Native)'
    };
    
  } catch (e) {
    if (e.name === 'AbortError') {
      console.warn('[WebScraper] DuckDuckGo search timed out after 8s');
    } else {
      console.error('[WebScraper] Native Search failed:', e.message);
    }
    return await searchWikipediaAPI(query);
  }
}

/**
 * Fallback: Search Wikipedia via their lightweight REST API (no BrowserWindow needed).
 * This is dramatically faster and more reliable than spawning a hidden Chromium window.
 */
async function searchWikipediaAPI(query) {
  console.log(`[WebScraper] Wikipedia API fallback for: "${query}"`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout
    
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=3&utf8=1`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Whispr/1.0 Desktop AI Assistant' },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Wikipedia API returned ${res.status}`);
    const data = await res.json();
    
    const results = (data.query?.search || []).map(item => ({
      title: item.title,
      snippet: item.snippet.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim(),
      link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`
    }));

    return { results, source: 'Wikipedia (API)' };
  } catch (e) {
    if (e.name === 'AbortError') {
      console.warn('[WebScraper] Wikipedia API timed out after 6s');
    } else {
      console.error('[WebScraper] Wikipedia API fallback failed:', e.message);
    }
    return { results: [], source: 'none' };
  }
}

/**
 * Scrape the text content from a specific URL using native fetch.
 * No hidden BrowserWindow — just raw HTML fetch + text extraction.
 */
export async function scrapeUrl(url) {
  console.log(`[WebScraper] Fetching URL: "${url}"`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s hard timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    // Strip HTML tags, scripts, styles, and extract readable text
    let text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[\s\S]*?<\/header>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    
    // Return first 3000 chars of meaningful content
    return text.slice(0, 3000);
  } catch (e) {
    if (e.name === 'AbortError') {
      return `Failed to scrape: Request timed out after 10 seconds`;
    }
    return `Failed to scrape: ${e.message}`;
  }
}
