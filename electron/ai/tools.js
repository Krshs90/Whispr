/**
 * This file contains the registry of tools the Local AI can invoke.
 * It provides both the JSON Schemas for the LLM prompt, and the execution logic.
 */

// ═══ ARCHITECTURAL UPGRADE: Dynamic Plugin System (Inspired by GenericAgent & superpowers) ═══
// Tools are now mutable so that external plugins, skills, or MCP servers can register dynamically.
export let availableTools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get the current weather forecast for a specific location.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g., Austin, TX"
          }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description: "Search the internet for real-time information, facts, or answers.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query."
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "play_music",
      description: "Play a specific song, artist, or playlist on Spotify. If the user just asks what is playing or wants to see the music widget, call with an empty song or 'Now Playing'. Do NOT pass 'null' as the song value.",
      parameters: {
        type: "object",
        properties: {
          song: {
            type: "string",
            description: "Name of the song, artist, or playlist to play. Leave empty or use 'Now Playing' to just check what is currently playing."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_sports",
      description: "Get live sports scores, standings, or team info. Supports ALL sports events (e.g., world_cup, champions_league, premier_league, la_liga, atp_tennis, f1, nfl, nba, college_football). Call this when the user asks about sports games, scores, teams, or matchups.",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "MUST extract the specific team name if mentioned by the user (e.g. 'mavericks', 'lakers', 'cowboys'). Do NOT leave empty unless the user asks for general games across the whole league."
          },
          league: {
            type: "string",
            description: "CRITICAL: Must accurately match the real-world sport for the team (e.g., 'mavericks' is ALWAYS 'nba', NOT 'nfl'). Supported: nba, nfl, mlb, nhl, epl, world_cup, champions_league, la_liga, serie_a, bundesliga, ligue_1, atp, wta, pga, f1, ncaa_football, ncaa_basketball. Defaults to nba."
          },
          status: {
            type: "string",
            description: "Filter by match status: 'live', 'past' (for latest/last games), 'upcoming' (for future scheduled games), or 'all'. Defaults to 'all'.",
            enum: ["live", "past", "upcoming", "all"]
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_stocks",
      description: "Get real-time stock price, change, and chart data for a given ticker symbol. Call this when the user asks about stocks, stock prices, market data, or tickers.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The company name (e.g. 'Apple', 'Tesla') or exact ticker symbol (e.g. 'AAPL'). The tool will automatically resolve the name to the correct public ticker."
          }
        },
        required: ["query"]
      }
    }
  },

  {
    type: "function",
    function: {
      name: "get_news",
      description: "Get the latest breaking news headlines. Call this when the user asks for news, breaking news, or news about a specific topic/location.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Specific topic to search for (e.g., 'Dallas Cowboys', 'Technology', 'Texas'). Leave empty for general breaking news."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "check_system_health",
      description: "Run a system diagnosis, check backend connections, API health, model status, or connectivity.",
      parameters: {
        type: "object",
        properties: {},
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_currency",
      description: "Convert a currency or get latest exchange rates. Example: 'convert 50 USD to EUR' or 'what is the euro trading at'.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount to convert. Default 1" },
          from: { type: "string", description: "Base currency code (e.g. USD, EUR, GBP)" },
          to: { type: "string", description: "Target currency code (e.g. EUR, JPY)" }
        },
        required: ["from", "to"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_translation",
      description: "Trigger the specialized translation widget for language conversion.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "open_calculator",
      description: "Open the scientific calculator widget.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_calendar",
      description: "Open the calendar widget.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_system_stats",
      description: "Get real-time CPU, Memory, and System Resource utilization.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_location",
      description: "Get the user's current geographic location (city, region, country, lat/lon) based on their IP address.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  }
];

import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

/**
 * Sanitizes tool arguments from LLM output.
 * LLMs sometimes pass schema objects like { location: { description: '...', type: 'string', value: 'Tokyo' } }
 * instead of simple values like { location: 'Tokyo' }. This extracts the actual value.
 */
export function sanitizeToolArgs(args) {
  if (!args || typeof args !== 'object') return args || {};
  const cleaned = {};
  for (const [key, val] of Object.entries(args)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // LLM hallucinated a schema object — extract the 'value' field if present
      if ('value' in val) {
        cleaned[key] = val.value;
      } else if ('default' in val) {
        cleaned[key] = val.default;
      } else {
        // Last resort: stringify it so it doesn't crash as [object Object]
        cleaned[key] = JSON.stringify(val);
      }
    } else if (typeof val === 'string') {
      // CRITICAL FIX: Detect when the LLM passes the parameter SCHEMA DEFINITION
      // as the value (e.g. location = '{"type":"string","description":"The city and state"}'
      // or location = "{'type': 'string', 'description': 'The city and state, e.g., Austin, TX'}")
      const looksLikeSchema = val.includes('"type"') && val.includes('"description"') ||
                              val.includes("'type'") && val.includes("'description'") ||
                              /^\{.*type.*string.*description.*\}$/s.test(val.trim());
      if (looksLikeSchema) {
        console.warn(`[sanitizeToolArgs] Detected schema hallucination for '${key}', discarding value: ${val.substring(0, 80)}...`);
        cleaned[key] = ''; // Will be caught downstream and trigger fallback behavior
      } else {
        cleaned[key] = val;
      }
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// In Phase 3, these will actually call real APIs.
export async function executeTool(name, rawArgs, apiKeys = {}) {
  // Always sanitize args to handle LLM schema hallucinations
  const args = sanitizeToolArgs(rawArgs);
  console.log(`[Tool] Executing ${name} with sanitized args:`, args);
  
  if (name === 'get_weather') {
    try {
      const location = (args.location || '').trim();
      if (!location) {
        return JSON.stringify({ 
          error: 'No location was provided. You MUST extract the city name from the user message and call get_weather again with the correct location (e.g. "Flower Mound, TX").',
          message: 'RETRY: Call get_weather again with the actual city name the user mentioned.'
        });
      }
      if (apiKeys.weather) {
        // 1. Get coordinates for city
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKeys.weather}`);
        const geoData = await geoRes.json();
        if (!geoData || geoData.length === 0) throw new Error("Location not found via OWM.");
        
        const { lat, lon, name: cityName } = geoData[0];
        
        // 2. Get Weather
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKeys.weather}`);
        const weatherData = await weatherRes.json();
        
        return JSON.stringify({
          location: cityName,
          temperature: Math.round(weatherData.main.temp) + '°F',
          condition: weatherData.weather[0]?.main || 'Clear',
          high: Math.round(weatherData.main.temp_max) + '°F',
          low: Math.round(weatherData.main.temp_min) + '°F',
          humidity: weatherData.main.humidity + '%',
          wind_speed: Math.round(weatherData.wind.speed) + ' mph'
        });
      } else {
        // Fallback to wttr.in (no API key required)
        const wttrRes = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
        if (!wttrRes.ok) throw new Error("wttr.in returned an error.");
        const wttrData = await wttrRes.json();
        
        const current = wttrData.current_condition[0];
        const today = wttrData.weather[0];
        const area = wttrData.nearest_area[0];
        const cityName = area.areaName[0].value;
        
        return JSON.stringify({
          location: cityName,
          temperature: current.temp_F + '°F',
          condition: current.weatherDesc[0]?.value || 'Clear',
          high: today.maxtempF + '°F',
          low: today.mintempF + '°F',
          humidity: current.humidity + '%',
          wind_speed: current.windspeedMiles + ' mph'
        });
      }
    } catch (e) {
      return JSON.stringify({ error: "Failed to fetch weather: " + e.message });
    }
  }
  
  if (name === 'search_web') {
    try {
      const { searchWeb } = await import('./webScraper.js');
      // Hard 15-second safety timeout to prevent backend freeze
      const data = await Promise.race([
        searchWeb(args.query),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Web search timed out after 15 seconds')), 15000))
      ]);
      return JSON.stringify({
        results: data.results || [],
        source: data.source || 'DuckDuckGo'
      });
    } catch (e) {
      console.error("[Tool] Search error:", e.message);
      return JSON.stringify({ error: "Search failed: " + e.message, message: "The web search timed out or failed. Briefly tell the user you couldn't search the web right now and answer with your own knowledge instead." });
    }
  }

  if (name === 'get_location') {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('IP API failed');
      const data = await res.json();
      return JSON.stringify({
        city: data.city,
        region: data.regionName,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        isp: data.isp
      });
    } catch (e) {
      console.error("[Tool] Location fetch error:", e);
      return JSON.stringify({ error: "Failed to determine location. Please ask the user to provide it manually." });
    }
  }

  if (name === 'play_music') {
    try {
      const rawSong = (args.song || '').trim();
      const songLower = rawSong.toLowerCase();

      let nowPlaying = null;
      const { detectNowPlaying, controlMedia } = await import('./mediaDetector.js');
      
      // Check for commands
      if (['play', 'pause', 'next', 'skip', 'prev', 'previous'].includes(songLower)) {
        let action = songLower;
        if (action === 'skip') action = 'next';
        if (action === 'previous') action = 'prev';
        nowPlaying = await controlMedia(action);
      } else {
        nowPlaying = await detectNowPlaying();
      }

      const isActive = nowPlaying && (nowPlaying.status === 'playing' || nowPlaying.status === 'paused') && nowPlaying.title;

      if (isActive) {
        return JSON.stringify({
          status: "success",
          action: "Fetched current playing track.",
          platform: nowPlaying.source?.name || 'System',
          now_playing: {
            title: nowPlaying.title,
            artist: nowPlaying.artist || '',
            source: nowPlaying.source?.name || 'System',
            isPlaying: nowPlaying.status === 'playing',
            cover: nowPlaying.albumArt || "https://misc.scdn.co/liked-songs/liked-songs-64.png",
            position: nowPlaying.position || 0,
            duration: nowPlaying.duration || 0
          }
        });
      }

      // Nothing playing — return idle with playlists
      return JSON.stringify({
        status: "idle",
        action: "Nothing is currently playing. Here are some playlists the user can choose from.",
        platform: "System",
        now_playing: { title: 'Nothing Playing', artist: '', source: 'System', isPlaying: false },
        playlists: [
          { name: "Daily Mix 1", creator: "Spotify", cover: "https://i.scdn.co/image/ab67706f00000002b1f807df590dcdbac65201ce" },
          { name: "Discover Weekly", creator: "Spotify", cover: "https://i.scdn.co/image/ab67706f000000021616ffb5bcbfbed71bfeb5e0" },
          { name: "Release Radar", creator: "Spotify", cover: "https://i.scdn.co/image/ab67706f0000000222a76f28cf6cd8c5ed05bde5" },
          { name: "Liked Songs", creator: "You", cover: "https://misc.scdn.co/liked-songs/liked-songs-64.png" },
          { name: "On Repeat", creator: "Spotify", cover: "https://daily-mix.scdn.co/covers/on_repeat/PZN_On_Repeat2_LARGE-en.jpg" },
          { name: "Chill Vibes", creator: "Spotify", cover: "https://i.scdn.co/image/ab67706f00000002c019ff225ad75cacc51fc892" }
        ]
      });
    } catch(e) {
      return JSON.stringify({ error: "Failed to control media: " + e.message });
    }
  }

  if (name === 'get_sports') {
    try {
      const team = (args.team || '').trim();
      const league = (args.league || 'nba').toLowerCase();
      const statusArg = (args.status || 'all').toLowerCase();
      
      // Map league to ESPN sport path
      const LEAGUE_MAP = {
        'nba': 'basketball/nba',
        'wnba': 'basketball/wnba',
        'ncaa_basketball': 'basketball/mens-college-basketball',
        'nfl': 'football/nfl',
        'ncaa_football': 'football/college-football',
        'mlb': 'baseball/mlb',
        'ncaa_baseball': 'baseball/college-baseball',
        'nhl': 'hockey/nhl',
        'mls': 'soccer/usa.1',
        'epl': 'soccer/eng.1',
        'premier_league': 'soccer/eng.1',
        'la_liga': 'soccer/esp.1',
        'serie_a': 'soccer/ita.1',
        'bundesliga': 'soccer/ger.1',
        'ligue_1': 'soccer/fra.1',
        'world_cup': 'soccer/fifa.world',
        'champions_league': 'soccer/uefa.champions',
        'europa_league': 'soccer/uefa.europa',
        'soccer': 'soccer/eng.1',
        'atp': 'tennis/atp',
        'wta': 'tennis/wta',
        'pga': 'golf/pga',
        'f1': 'racing/f1'
      };

      // Allow the LLM to pass exact ESPN path like 'tennis/atp' if it knows it, else use map, else fallback to NBA
      let sportPath = LEAGUE_MAP[league] || (league.includes('/') ? league : null);
      
      // Attempt fuzzy matching if not found
      if (!sportPath) {
        for (const [key, path] of Object.entries(LEAGUE_MAP)) {
          if (league.includes(key)) {
            sportPath = path;
            break;
          }
        }
      }
      sportPath = sportPath || 'basketball/nba';

      // Build date window (30 days back, 30 days forward)
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const pastStr = d.toISOString().split('T')[0].replace(/-/g, '');
      const d2 = new Date();
      d2.setDate(d2.getDate() + 30);
      const futureStr = d2.toISOString().split('T')[0].replace(/-/g, '');

      // Fetch live scoreboard from ESPN with extended dates
      const scoreRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard?dates=${pastStr}-${futureStr}&limit=300`);
      const scoreData = await scoreRes.json();

      let events = scoreData.events || [];
      const teamLower = team.toLowerCase();
      
      // Filter by team
      if (teamLower) {
        events = events.filter(e => {
          const comps = e.competitions?.[0]?.competitors || [];
          return comps.some(c => 
            c.team?.displayName?.toLowerCase().includes(teamLower) ||
            c.team?.abbreviation?.toLowerCase() === teamLower ||
            c.team?.shortDisplayName?.toLowerCase().includes(teamLower)
          );
        });
      }

      // Filter by status and sort
      if (statusArg === 'past') {
        events = events.filter(e => e.status?.type?.completed);
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (statusArg === 'upcoming') {
        events = events.filter(e => !e.status?.type?.completed && e.status?.type?.state !== 'in');
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (statusArg === 'live') {
        events = events.filter(e => e.status?.type?.state === 'in');
      } else {
        // all or default: try to find live first, then upcoming, then recent past
        events.sort((a, b) => {
          const aLive = a.status?.type?.state === 'in' ? 1 : 0;
          const bLive = b.status?.type?.state === 'in' ? 1 : 0;
          if (aLive !== bLive) return bLive - aLive;
          // Sort remaining by proximity to current date
          const now = Date.now();
          return Math.abs(new Date(a.date).getTime() - now) - Math.abs(new Date(b.date).getTime() - now);
        });
      }

      const formatGame = (event) => {
        const comp = event.competitions?.[0];
        const competitors = comp?.competitors || [];
        const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
        const away = competitors.find(c => c.homeAway === 'away') || competitors[1];
        const status = event.status?.type;
        const link = event.links?.[0]?.href || `https://www.espn.com/${sportPath}/game/_/gameId/${event.id}`;
        
        return {
          id: event.id,
          name: event.shortName || event.name,
          status: status?.description || 'Unknown',
          statusDetail: status?.detail || '',
          isLive: status?.state === 'in',
          isCompleted: status?.completed || false,
          link: link,
          home: {
            name: home?.team?.displayName || '?',
            abbreviation: home?.team?.abbreviation || '?',
            score: home?.score || '0',
            logo: home?.team?.logo || '',
            color: home?.team?.color ? `#${home.team.color}` : '#555',
            record: home?.records?.[0]?.summary || '',
          },
          away: {
            name: away?.team?.displayName || '?',
            abbreviation: away?.team?.abbreviation || '?',
            score: away?.score || '0',
            logo: away?.team?.logo || '',
            color: away?.team?.color ? `#${away.team.color}` : '#555',
            record: away?.records?.[0]?.summary || '',
          },
          venue: comp?.venue?.fullName || '',
          broadcast: comp?.broadcasts?.[0]?.names?.[0] || '',
          league: league.toUpperCase(),
        };
      };

      // Return the top 4 matching games
      const games = events.slice(0, 4).map(formatGame);
      
      if (games.length === 0) {
        return JSON.stringify({
          error: `No games found in the live scoreboard for ${team || league}.`,
          message: "The live scoreboard has no recent data. The team might be in off-season or you selected the wrong league. PLEASE USE THE 'search_web' tool IMMEDIATELY to find their schedule or recent matches."
        });
      }

      return JSON.stringify({
        status: 'success',
        action: `Found ${games.length} ${league.toUpperCase()} games matching query.`,
        games: games,
        league: league.toUpperCase(),
      });
    } catch(e) {
      return JSON.stringify({ error: "Failed to fetch sports data: " + e.message });
    }
  }

  if (name === 'get_stocks') {
    try {
      const query = (args.query || args.symbol || 'AAPL').trim();
      let symbol = query.toUpperCase();
      
      // Auto-resolve company name to ticker if it contains spaces or lowercase letters, or is longer than 5 chars
      if (query.includes(' ') || query !== query.toUpperCase() || query.length > 5) {
        const searchRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`);
        const searchData = await searchRes.json();
        const bestEquity = searchData.quotes?.find(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF');
        if (bestEquity) {
          symbol = bestEquity.symbol;
        } else {
          return JSON.stringify({ 
            error: `No publicly traded stock found for '${query}'.`,
            message: `This company may be private, or recently went public and its name isn't fully indexed yet. PLEASE USE 'search_web' IMMEDIATELY to find their exact public ticker symbol (e.g. searching 'SpaceX IPO ticker'). If you find a new ticker (like SPCX), call get_stocks again with just the exact 1-5 letter ticker symbol in ALL CAPS.`
          });
        }
      }
      
      // Yahoo Finance chart API (no key needed)
      const chartRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
      );
      const chartData = await chartRes.json();
      const meta = chartData.chart?.result?.[0]?.meta;
      
      if (!meta) {
        return JSON.stringify({ error: `Could not find stock data for ${symbol}. Check the ticker symbol.` });
      }

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const change = prevClose ? ((price - prevClose) / prevClose * 100).toFixed(2) : '0.00';
      const changeAbs = prevClose ? (price - prevClose).toFixed(2) : '0.00';
      
      // Get historical prices for sparkline
      const timestamps = chartData.chart?.result?.[0]?.timestamp || [];
      const closes = chartData.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
      const sparkline = closes.filter(v => v !== null).map(v => parseFloat(v.toFixed(2)));

      // Try to get company name via a quick search
      let companyName = meta.longName || meta.shortName || symbol;
      const currency = meta.currency || 'USD';
      const exchange = meta.exchangeName || '';
      const marketState = meta.marketState || 'CLOSED';
      
      // Enhance with Company Logo and deeper info
      let logoUrl = null;
      let sector = null;
      let industry = null;
      let marketCap = null;
      try {
        const profileRes = await fetch(`https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile,summaryDetail`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const profileData = await profileRes.json();
        const profile = profileData.quoteSummary?.result?.[0]?.assetProfile;
        const summary = profileData.quoteSummary?.result?.[0]?.summaryDetail;
        
        if (profile?.website) {
          const domain = new URL(profile.website).hostname.replace('www.', '');
          logoUrl = `https://logo.clearbit.com/${domain}`;
        }
        sector = profile?.sector || null;
        industry = profile?.industry || null;
        marketCap = summary?.marketCap?.fmt || null;
      } catch (e) {
        console.log('[Stocks] Failed to fetch enhanced profile:', e.message);
      }
      
      return JSON.stringify({
        status: 'success',
        action: `Fetched stock data for ${symbol}.`,
        stock: {
          symbol: symbol,
          name: companyName,
          price: price,
          currency: currency,
          change: parseFloat(change),
          changeAbs: parseFloat(changeAbs),
          isUp: parseFloat(change) >= 0,
          exchange: exchange,
          marketState: marketState,
          sparkline: sparkline,
          high: meta.regularMarketDayHigh || null,
          low: meta.regularMarketDayLow || null,
          volume: meta.regularMarketVolume || null,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
          logoUrl: logoUrl,
          sector: sector,
          industry: industry,
          marketCap: marketCap
        }
      });
    } catch(e) {
      return JSON.stringify({ error: "Failed to fetch stock data: " + e.message });
    }
  }

  if (name === 'get_news') {
    try {
      const topic = (args.topic || '').trim();
      const url = topic
        ? `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=en-US&gl=US&ceid=US:en`
        : `https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`;

      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const xml = await res.text();
      
      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xml)) !== null && items.length < 6) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
        const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);
        const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

        if (titleMatch && linkMatch) {
          // Clean up titles (sometimes they have " - Publisher" at the end)
          let title = titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'News';
          const link = linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          
          if (title.endsWith(` - ${source}`)) {
             title = title.substring(0, title.length - source.length - 3).trim();
          }

          items.push({
            title: title,
            link: link,
            source: source,
            date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
          });
        }
      }

      return JSON.stringify({
        status: 'success',
        action: `Found ${items.length} news articles${topic ? ` for ${topic}` : ''}.`,
        articles: items,
        topic: topic || 'Top Stories',
      });
    } catch(e) {
      return JSON.stringify({ error: "Failed to fetch news: " + e.message });
    }
  }

  if (name === 'check_system_health') {
    return JSON.stringify({
      status: "success",
      action: "Triggered diagnostic health check routine in the backend UI."
    });
  }

  if (name === 'get_system_stats') {
    const os = await import('os');
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuCount = os.cpus().length;
    // Simple average CPU approximation
    const sysUptime = os.uptime();
    
    return JSON.stringify({
      status: "success",
      action: "System health diagnostic complete.",
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: cpuCount,
        cpuModel: os.cpus()[0].model,
        totalMemGB: (totalMem / 1024 ** 3).toFixed(2),
        usedMemGB: (usedMem / 1024 ** 3).toFixed(2),
        freeMemGB: (freeMem / 1024 ** 3).toFixed(2),
        memPercent: Math.round((usedMem / totalMem) * 100),
        uptimeHours: (sysUptime / 3600).toFixed(1)
      }
    });
  }

  if (name === 'get_translation') {
    return JSON.stringify({
      status: "success",
      action: "Opened Translation widget."
    });
  }

  if (name === 'open_calculator') {
    return JSON.stringify({
      status: "success",
      action: "Opened Calculator widget."
    });
  }

  if (name === 'get_calendar') {
    return JSON.stringify({ status: "success", action: "Opened calendar widget." });
  }

  if (name === 'get_tasks') {
    return JSON.stringify({ status: "success", action: "Opened tasks widget." });
  }

  if (name === 'get_currency') {
    try {
      const from = (args.from || 'USD').toLowerCase();
      const to = (args.to || 'EUR').toLowerCase();
      const amount = parseFloat(args.amount) || 1;

      // Primary: fawazahmed0/exchange-api (daily updated, free, no key)
      let rate = null;
      try {
        const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`);
        const data = await res.json();
        if (data && data[from] && data[from][to]) {
          rate = data[from][to];
        }
      } catch (e1) {
        console.warn('[Currency] Primary API failed, trying fallback...');
      }

      // Fallback: open.er-api.com
      if (!rate) {
        const res = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`);
        const data = await res.json();
        if (data.result === 'success' && data.rates[to.toUpperCase()]) {
          rate = data.rates[to.toUpperCase()];
        }
      }

      if (!rate) {
        return JSON.stringify({ error: `Currency conversion failed. Could not find rate for ${from.toUpperCase()} → ${to.toUpperCase()}.` });
      }

      const converted = amount * rate;

      return JSON.stringify({
        status: "success",
        action: `Converted ${amount} ${from.toUpperCase()} to ${converted.toFixed(2)} ${to.toUpperCase()}.`,
        from: from.toUpperCase(), to: to.toUpperCase(), amount, rate, converted
      });
    } catch(e) {
      return JSON.stringify({ error: "Failed to fetch currency rates: " + e.message });
    }
  }

  if (name === "get_flights") {
    // Flight status placeholder widget
    return JSON.stringify({
      flightNumber: args.flightNumber || "Unknown",
      status: "In Air",
      origin: "JFK",
      destination: "LAX",
      altitude: "35,000 ft",
      speed: "520 mph"
    });
  }

  if (name === "transcribe_audio") {
    // Architectural placeholder for whisper.cpp / LocalAI transcription
    return JSON.stringify({
      status: "ready",
      message: "Transcription infrastructure is prepared. Waiting for native Whisper binary hook."
    });
  }

  return JSON.stringify({ error: "Tool not implemented or unknown tool." });
}

// Map for dynamic skill execution hooks
const dynamicExecutors = new Map();

/**
 * Register a new tool/skill dynamically at runtime.
 * @param {Object} schema - The JSON Schema for the tool
 * @param {Function} executor - The async function to run when the tool is invoked
 */
export function registerTool(schema, executor) {
  const toolName = schema.function?.name;
  if (!toolName) throw new Error("Invalid tool schema: Missing function name.");
  
  // Add to available tools array
  availableTools.push(schema);
  
  // Register executor hook
  dynamicExecutors.set(toolName, executor);
  console.log(`[Plugin System] Successfully registered dynamic skill: ${toolName}`);
}

// Intercept execution for dynamic tools — GLOBAL SAFETY BOUNDARY
const originalExecuteTool = executeTool;
export async function executeDynamicTool(name, args, apiKeys = {}) {
  try {
    if (dynamicExecutors.has(name)) {
      const executor = dynamicExecutors.get(name);
      return await executor(args, apiKeys);
    }
    return await originalExecuteTool(name, args, apiKeys);
  } catch (e) {
    console.error(`[Tool Safety] Unhandled crash in tool '${name}':`, e);
    return JSON.stringify({ error: `Tool '${name}' encountered an error: ${e.message}` });
  }
}
