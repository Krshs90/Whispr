/**
 * This file contains the registry of tools the Local AI can invoke.
 * It provides both the JSON Schemas for the LLM prompt, and the execution logic.
 */

import { exec } from 'child_process';
import util from 'util';
const execPromise = util.promisify(exec);

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
            description: "The city and state/country, e.g., Chicago, IL or Tokyo"
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
      description: "Play a specific song, artist, or playlist on a streaming platform, or check what song is currently playing. If the user asks what song is playing right now, call with an empty song.",
      parameters: {
        type: "object",
        properties: {
          song: {
            type: "string",
            description: "Name of the song, artist, or playlist to play, or empty to check currently playing song."
          },
          platform: {
            type: "string",
            description: "The streaming platform to use. Defaults to 'spotify'.",
            enum: ["spotify", "apple", "youtube", "soundcloud"]
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
      description: "Get live sports scores, recent game results, standings, or upcoming matchups across NBA, NFL, MLB, NHL, Soccer, Tennis, F1, etc.",
      parameters: {
        type: "object",
        properties: {
          team: {
            type: "string",
            description: "Specific team name if mentioned by the user (e.g. 'mavericks', 'lakers', 'cowboys'). Leave empty for league-wide scores."
          },
          league: {
            type: "string",
            description: "Sport league: nba, nfl, mlb, nhl, epl, world_cup, champions_league, la_liga, serie_a, bundesliga, ligue_1, atp, wta, pga, f1, ncaa_football, ncaa_basketball. Defaults to nba."
          },
          status: {
            type: "string",
            description: "Filter by match status: 'live', 'past' (for latest/recent scores), 'upcoming' (for future games), or 'all'.",
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
      description: "Get real-time stock or cryptocurrency price, change, and chart data (e.g. NVDA, AAPL, Bitcoin, BTC-USD, ETH-USD).",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The company name, cryptocurrency name, or ticker symbol (e.g. 'NVDA', 'Bitcoin', 'BTC-USD', 'AAPL')."
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
      description: "Get the latest breaking news or topic-specific news headlines from Google News (e.g., Technology, AI, Business, Sports, World).",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
            description: "Specific topic to fetch news for (e.g., 'Technology', 'Artificial Intelligence', 'Business', 'Sports'). Leave empty for general top stories."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "set_timer",
      description: "Set and start a countdown timer for a specified duration (e.g., 1 minute, 30 seconds, 5 minutes).",
      parameters: {
        type: "object",
        properties: {
          seconds: {
            type: "number",
            description: "Total duration in seconds (e.g., 60 for 1 minute, 300 for 5 minutes)."
          },
          label: {
            type: "string",
            description: "Optional label for the timer (e.g., '1 Minute Timer', 'Focus')."
          }
        },
        required: ["seconds"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_tasks",
      description: "Open the user's tasks/to-do list widget, or add/remove a task.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action to perform: 'list', 'add', 'remove', or 'clear_completed'.",
            enum: ["list", "add", "remove", "clear_completed"]
          },
          task: {
            type: "string",
            description: "The task text to add or remove (e.g. 'Buy groceries')."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_translation",
      description: "Translate text into one or more target languages and open the interactive Translation widget.",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "The text to translate."
          },
          target_languages: {
            type: "string",
            description: "Comma-separated target language names or codes (e.g. 'Spanish, Japanese' or 'French')."
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
      description: "Run a full system diagnostic checking CPU, RAM, Disk, and AI backend engine health.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_system_stats",
      description: "Get real-time CPU usage, RAM usage, Disk space, Uptime, and AI engine health.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "get_currency",
      description: "Convert a currency or get latest exchange rates. Example: 'convert 50 USD to EUR'.",
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
      name: "get_location",
      description: "Get the user's current geographic location (city, region, country, lat/lon) based on their IP address.",
      parameters: { type: "object", properties: {}, required: [] }
    }
  },
  {
    type: "function",
    function: {
      name: "whispr_control",
      description: "Execute desktop automation & system control actions on Windows (open apps, open websites, adjust volume, minimize windows, take screenshots, copy to clipboard).",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "The control action: 'open_app', 'open_url', 'volume_up', 'volume_down', 'volume_mute', 'minimize_all', 'copy_clipboard', 'lock_screen'.",
            enum: ["open_app", "open_url", "volume_up", "volume_down", "volume_mute", "minimize_all", "copy_clipboard", "lock_screen"]
          },
          target: {
            type: "string",
            description: "App name (e.g. 'notepad', 'calculator', 'explorer', 'chrome', 'spotify', 'vscode', 'terminal'), URL, or clipboard text."
          }
        },
        required: ["action"]
      }
    }
  }
];

/**
 * Sanitizes tool arguments from LLM output.
 */
export function sanitizeToolArgs(args) {
  if (!args || typeof args !== 'object') return args || {};
  const cleaned = {};
  for (const [key, val] of Object.entries(args)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('value' in val) {
        cleaned[key] = val.value;
      } else if ('default' in val) {
        cleaned[key] = val.default;
      } else {
        cleaned[key] = JSON.stringify(val);
      }
    } else if (typeof val === 'string') {
      const looksLikeSchema = val.includes('"type"') && val.includes('"description"') ||
                              val.includes("'type'") && val.includes("'description'") ||
                              /^\{.*type.*string.*description.*\}$/s.test(val.trim());
      if (looksLikeSchema) {
        console.warn(`[sanitizeToolArgs] Detected schema hallucination for '${key}', discarding value: ${val.substring(0, 80)}...`);
        cleaned[key] = '';
      } else {
        cleaned[key] = val;
      }
    } else {
      cleaned[key] = val;
    }
  }
  return cleaned;
}

// Helper: WMO weather code to readable condition
function wmoCodeToCondition(code) {
  if (code === 0) return 'Clear';
  if (code === 1 || code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Clear';
}

// Helper: Build full system + AI health snapshot
async function buildSystemAndHealthSnapshot() {
  const os = await import('os');
  const fs = await import('fs');
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const cpus = os.cpus();
  const cpuCount = cpus.length;
  const sysUptime = os.uptime();

  let diskFreeGB = '0.0';
  let diskTotalGB = '0.0';
  let diskPercent = 0;
  try {
    const stat = fs.statfsSync(os.homedir());
    const freeB = stat.bfree * stat.bsize;
    const totalB = stat.blocks * stat.bsize;
    diskFreeGB = (freeB / 1024 ** 3).toFixed(1);
    diskTotalGB = (totalB / 1024 ** 3).toFixed(1);
    diskPercent = totalB > 0 ? Math.round(((totalB - freeB) / totalB) * 100) : 0;
  } catch {}

  function getCpuTimes() {
    return os.cpus().map(cpu => ({
      idle: cpu.times.idle,
      total: Object.values(cpu.times).reduce((a, b) => a + b, 0)
    }));
  }
  const t1 = getCpuTimes();
  const cpuPercent = await new Promise((resolve) => {
    setTimeout(() => {
      const t2 = getCpuTimes();
      let totalIdle = 0, totalWork = 0;
      for (let i = 0; i < t1.length; i++) {
        totalIdle += (t2[i].idle - t1[i].idle);
        totalWork += (t2[i].total - t1[i].total);
      }
      resolve(totalWork === 0 ? 5 : Math.max(1, Math.round((1 - totalIdle / totalWork) * 100)));
    }, 350);
  });

  let engine = 'online';
  let installedCount = 0;
  try {
    const { getAvailableModels } = await import('./ollamaManager.js');
    const models = await getAvailableModels();
    installedCount = models.length;
    engine = models.length > 0 ? 'online' : 'degraded';
  } catch {
    engine = 'offline';
  }

  return {
    status: "success",
    action: "System health and hardware resource diagnostic complete.",
    engine,
    models: {
      tools: installedCount > 0,
      chat: installedCount > 0,
      count: installedCount
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpuCores: cpuCount,
      cpuModel: cpus[0]?.model?.trim() || 'Multi-Core Processor',
      cpuPercent,
      totalMemGB: (totalMem / 1024 ** 3).toFixed(1),
      usedMemGB: (usedMem / 1024 ** 3).toFixed(1),
      freeMemGB: (freeMem / 1024 ** 3).toFixed(1),
      memPercent: Math.round((usedMem / totalMem) * 100),
      diskFreeGB,
      diskTotalGB,
      diskPercent,
      uptimeHours: (sysUptime / 3600).toFixed(1)
    }
  };
}

export async function executeTool(name, rawArgs, apiKeys = {}) {
  const args = sanitizeToolArgs(rawArgs);
  console.log(`[Tool] Executing ${name} with sanitized args:`, args);
  
  if (name === 'get_weather') {
    try {
      const location = (args.location || '').trim();
      if (!location) {
        return JSON.stringify({ 
          error: 'No location was provided. Extract the city name from the user message and call get_weather again.',
          message: 'RETRY: Call get_weather again with the actual city name.'
        });
      }

      // 1. Primary: Open-Meteo Geocoding + Forecast (100% free, no API key needed, exact city names!)
      try {
        const cleanQuery = location.split(',')[0].trim();
        const stateHint = location.includes(',') ? location.split(',')[1].trim().toLowerCase() : '';
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanQuery)}&count=5&language=en&format=json`);
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          if (geoJson.results && geoJson.results.length > 0) {
            let match = geoJson.results[0];
            if (stateHint) {
              const stateMatch = geoJson.results.find(r =>
                r.admin1?.toLowerCase().includes(stateHint) ||
                r.country_code?.toLowerCase() === stateHint ||
                r.country?.toLowerCase().includes(stateHint)
              );
              if (stateMatch) match = stateMatch;
            }
            const { latitude, longitude, name: cityName, admin1, country_code } = match;
            const displayLoc = admin1 && country_code === 'US' ? `${cityName}, ${admin1}` : (country_code ? `${cityName}, ${country_code}` : cityName);

            const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`;
            const wxRes = await fetch(wxUrl);
            if (wxRes.ok) {
              const wx = await wxRes.json();
              const cur = wx.current;
              const daily = wx.daily;
              const condition = wmoCodeToCondition(cur.weather_code);
              const highF = Math.round(daily?.temperature_2m_max?.[0] ?? cur.temperature_2m);
              const lowF = Math.round(daily?.temperature_2m_min?.[0] ?? cur.temperature_2m);

              // Extract next 5 hours from hourly array
              const nowIso = cur.time?.slice(0, 13);
              let startIdx = wx.hourly?.time?.findIndex((t) => t.startsWith(nowIso)) ?? 0;
              if (startIdx < 0) startIdx = 0;
              const hourly = [];
              for (let i = 0; i < 5; i++) {
                const tIdx = startIdx + i;
                const tVal = wx.hourly?.temperature_2m?.[tIdx];
                if (tVal !== undefined) {
                  hourly.push({
                    time: i === 0 ? 'Now' : `+${i}h`,
                    temp: `${Math.round(tVal)}°`
                  });
                }
              }

              return JSON.stringify({
                location: displayLoc,
                temperature: `${Math.round(cur.temperature_2m)}°F`,
                feelsLike: `${Math.round(cur.apparent_temperature)}°F`,
                condition,
                high: `${highF}°F`,
                low: `${lowF}°F`,
                humidity: `${Math.round(cur.relative_humidity_2m)}%`,
                wind_speed: `${Math.round(cur.wind_speed_10m)} mph`,
                hourly
              });
            }
          }
        }
      } catch (openMeteoErr) {
        console.warn('[Weather] Open-Meteo fallback error:', openMeteoErr.message);
      }

      // 2. Secondary: OpenWeatherMap if user configured an API key
      if (apiKeys.weather) {
        const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKeys.weather}`);
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          const { lat, lon, name: cityName, state } = geoData[0];
          const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKeys.weather}`);
          const weatherData = await weatherRes.json();
          return JSON.stringify({
            location: state ? `${cityName}, ${state}` : cityName,
            temperature: Math.round(weatherData.main.temp) + '°F',
            condition: weatherData.weather[0]?.main || 'Clear',
            high: Math.round(weatherData.main.temp_max) + '°F',
            low: Math.round(weatherData.main.temp_min) + '°F',
            humidity: weatherData.main.humidity + '%',
            wind_speed: Math.round(weatherData.wind.speed) + ' mph'
          });
        }
      }

      // 3. Last resort: wttr.in (preserve user's requested city name rather than obscure neighborhood)
      const wttrRes = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
      if (!wttrRes.ok) throw new Error("Weather providers unavailable.");
      const wttrData = await wttrRes.json();
      const current = wttrData.current_condition[0];
      const today = wttrData.weather[0];
      const formattedCity = location.replace(/\b\w/g, c => c.toUpperCase());

      return JSON.stringify({
        location: formattedCity,
        temperature: current.temp_F + '°F',
        condition: current.weatherDesc[0]?.value || 'Clear',
        high: today.maxtempF + '°F',
        low: today.mintempF + '°F',
        humidity: current.humidity + '%',
        wind_speed: current.windspeedMiles + ' mph'
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to fetch weather: " + e.message });
    }
  }
  
  if (name === 'search_web') {
    try {
      const { searchWeb } = await import('./webScraper.js');
      const data = await Promise.race([
        searchWeb(args.query),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Web search timed out after 15 seconds')), 15000))
      ]);
      return JSON.stringify({
        results: data.results || [],
        source: data.source || 'DuckDuckGo'
      });
    } catch (e) {
      return JSON.stringify({ error: "Search failed: " + e.message, message: "The web search timed out or failed. Answer with your own knowledge instead." });
    }
  }

  if (name === 'get_location') {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) throw new Error('IP API failed');
      const data = await res.json();
      return JSON.stringify({
        city: data.city,
        region: data.regionName || data.region,
        country: data.country_name || data.country,
        lat: data.latitude || data.lat,
        lon: data.longitude || data.lon,
        timezone: data.timezone,
        isp: data.org || data.isp
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to determine location." });
    }
  }

  if (name === 'play_music') {
    try {
      const rawSong = (args.song || '').trim();
      const songLower = rawSong.toLowerCase();

      let nowPlaying = null;
      const { detectNowPlaying, controlMedia } = await import('./mediaDetector.js');
      const rawPlatform = (args.platform || apiKeys?.musicPlatform || 'spotify').toLowerCase();

      const PLATFORM_LABELS = {
        spotify: 'Spotify',
        spotify_web: 'Spotify Web',
        youtube_music: 'YouTube Music',
        youtube: 'YouTube Music',
        apple_music: 'Apple Music',
        apple: 'Apple Music',
        soundcloud: 'SoundCloud'
      };
      const platformLabel = PLATFORM_LABELS[rawPlatform] || 'Spotify';

      const isStatusQuery = !rawSong ||
        songLower === 'now playing' ||
        songLower === 'current' ||
        songLower === 'currently playing' ||
        songLower.includes('what song') ||
        songLower.includes('what plays') ||
        songLower.includes('what is playing') ||
        songLower.includes('whats playing') ||
        songLower.includes('playing right now');

      if (['play', 'pause', 'playpause', 'resume', 'next', 'skip', 'prev', 'previous'].includes(songLower)) {
        let action = songLower;
        if (action === 'skip') action = 'next';
        if (action === 'previous') action = 'prev';
        if (action === 'resume') action = 'play';
        nowPlaying = await controlMedia(action);
      } else if (!isStatusQuery) {
        const { shell } = await import('electron');

        // Check if user asked for generic "music" / "playlist" and has a default playlist link in Profile
        if (['music', 'my playlist', 'playlist', 'default_playlist', 'some music'].includes(songLower) && apiKeys?.spotify) {
          const playlistUrl = apiKeys.spotify.trim();
          if (playlistUrl.startsWith('http://') || playlistUrl.startsWith('https://') || playlistUrl.startsWith('spotify:')) {
            shell.openExternal(playlistUrl);
            return JSON.stringify({
              status: "success",
              action: `Opened your favorite playlist on ${platformLabel}.`,
              platform: platformLabel,
              title: 'Favorite Playlist',
              artist: platformLabel,
              isPlaying: true,
              now_playing: {
                title: 'Favorite Playlist',
                artist: platformLabel,
                album: 'User Profile Playlist',
                source: platformLabel,
                isPlaying: true,
                cover: 'https://misc.scdn.co/liked-songs/liked-songs-64.png',
                position: 0,
                duration: 180
              }
            });
          }
        }

        // Resolve clean track metadata & album art via keyless iTunes Search API
        let resolvedTitle = rawSong;
        let resolvedArtist = platformLabel;
        let resolvedAlbum = '';
        let resolvedArt = '';
        let resolvedDuration = 200;

        try {
          const controller = new AbortController();
          const tId = setTimeout(() => controller.abort(), 3000);
          const metaRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(rawSong)}&entity=song&limit=1`, {
            signal: controller.signal
          });
          clearTimeout(tId);
          if (metaRes.ok) {
            const metaJson = await metaRes.json();
            const hit = metaJson.results?.[0];
            if (hit) {
              resolvedTitle = hit.trackName || rawSong;
              resolvedArtist = hit.artistName || platformLabel;
              resolvedAlbum = hit.collectionName || '';
              resolvedArt = (hit.artworkUrl100 || '').replace('100x100bb', '600x600bb');
              if (hit.trackTimeMillis) {
                resolvedDuration = Math.round(hit.trackTimeMillis / 1000);
              }
            }
          }
        } catch {}

        const searchQuery = resolvedArtist && resolvedArtist !== platformLabel
          ? `${resolvedTitle} ${resolvedArtist}`
          : rawSong;
        const encoded = encodeURIComponent(searchQuery);

        if (rawPlatform === 'spotify') {
          shell.openExternal(`spotify:search:${encoded}`).catch(() => {
            shell.openExternal(`https://open.spotify.com/search/${encoded}`);
          });
        } else if (rawPlatform === 'spotify_web') {
          shell.openExternal(`https://open.spotify.com/search/${encoded}`);
        } else if (rawPlatform === 'youtube_music' || rawPlatform === 'youtube') {
          shell.openExternal(`https://music.youtube.com/search?q=${encoded}`);
        } else if (rawPlatform === 'apple_music' || rawPlatform === 'apple') {
          shell.openExternal(`https://music.apple.com/us/search?term=${encoded}`);
        } else if (rawPlatform === 'soundcloud') {
          shell.openExternal(`https://soundcloud.com/search?q=${encoded}`);
        } else {
          shell.openExternal(`spotify:search:${encoded}`);
        }

        return JSON.stringify({
          status: "success",
          action: `Playing "${resolvedTitle}" by ${resolvedArtist} on ${platformLabel}.`,
          platform: platformLabel,
          title: resolvedTitle,
          artist: resolvedArtist,
          album: resolvedAlbum,
          albumArt: resolvedArt,
          duration: resolvedDuration,
          isPlaying: true,
          now_playing: {
            title: resolvedTitle,
            artist: resolvedArtist,
            album: resolvedAlbum,
            source: platformLabel,
            isPlaying: true,
            cover: resolvedArt || "https://misc.scdn.co/liked-songs/liked-songs-64.png",
            position: 0,
            duration: resolvedDuration
          }
        });
      } else {
        nowPlaying = await detectNowPlaying();
      }

      const isActive = nowPlaying && (nowPlaying.status === 'playing' || nowPlaying.status === 'paused') && nowPlaying.title;

      if (isActive) {
        return JSON.stringify({
          status: "success",
          action: `Currently ${nowPlaying.status}: "${nowPlaying.title}" by ${nowPlaying.artist || 'Unknown Artist'} on ${nowPlaying.source?.name || 'System'}.`,
          platform: nowPlaying.source?.name || 'System',
          title: nowPlaying.title,
          artist: nowPlaying.artist || '',
          album: nowPlaying.album || '',
          albumArt: nowPlaying.albumArt || '',
          isPlaying: nowPlaying.status === 'playing',
          now_playing: {
            title: nowPlaying.title,
            artist: nowPlaying.artist || '',
            album: nowPlaying.album || '',
            source: nowPlaying.source?.name || 'System',
            isPlaying: nowPlaying.status === 'playing',
            cover: nowPlaying.albumArt || "https://misc.scdn.co/liked-songs/liked-songs-64.png",
            position: nowPlaying.position || 0,
            duration: nowPlaying.duration || 0
          }
        });
      }

      return JSON.stringify({
        status: "idle",
        action: "Nothing is currently playing on your Windows media session.",
        platform: "System",
        now_playing: { title: 'Nothing Playing', artist: '', source: 'System', isPlaying: false }
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to control media: " + e.message });
    }
  }

  if (name === 'get_sports') {
    try {
      const team = (args.team || '').trim();
      const league = (args.league || 'nba').toLowerCase();
      const statusArg = (args.status || 'all').toLowerCase();
      
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

      let sportPath = LEAGUE_MAP[league] || (league.includes('/') ? league : null);
      if (!sportPath) {
        for (const [key, p] of Object.entries(LEAGUE_MAP)) {
          if (league.includes(key)) {
            sportPath = p;
            break;
          }
        }
      }
      sportPath = sportPath || 'basketball/nba';

      // Fetch live scoreboard from ESPN (using ESPN's own server date so local clock skew never breaks it!)
      const scoreRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard?limit=100`);
      const scoreData = await scoreRes.json();

      let allEvents = scoreData.events || [];
      const teamLower = team.toLowerCase();
      
      if (teamLower && !['nba', 'nfl', 'mlb', 'nhl', 'epl', 'mls', 'all', 'scores', 'latest'].includes(teamLower)) {
        const teamFiltered = allEvents.filter(e => {
          const comps = e.competitions?.[0]?.competitors || [];
          return comps.some(c => 
            c.team?.displayName?.toLowerCase().includes(teamLower) ||
            c.team?.abbreviation?.toLowerCase() === teamLower ||
            c.team?.shortDisplayName?.toLowerCase().includes(teamLower)
          );
        });
        if (teamFiltered.length > 0) {
          allEvents = teamFiltered;
        } else {
          // Team wasn't on today's main slate — check ESPN teams API for their latest/next game
          try {
            const teamsRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams?limit=50`);
            const teamsData = await teamsRes.json();
            const teamsList = teamsData.sports?.[0]?.leagues?.[0]?.teams || [];
            const matchedTeam = teamsList.find(t =>
              t.team?.displayName?.toLowerCase().includes(teamLower) ||
              t.team?.abbreviation?.toLowerCase() === teamLower ||
              t.team?.shortDisplayName?.toLowerCase().includes(teamLower)
            );
            if (matchedTeam?.team?.id) {
              const schedRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${sportPath}/teams/${matchedTeam.team.id}/schedule`);
              const schedData = await schedRes.json();
              if (schedData.events && schedData.events.length > 0) {
                allEvents = schedData.events;
              }
            }
          } catch {}
        }
      }

      const sortByProximity = (list) => {
        const now = Date.now();
        return [...list].sort((a, b) => {
          const aLive = a.status?.type?.state === 'in' ? 1 : 0;
          const bLive = b.status?.type?.state === 'in' ? 1 : 0;
          if (aLive !== bLive) return bLive - aLive;
          return Math.abs(new Date(a.date).getTime() - now) - Math.abs(new Date(b.date).getTime() - now);
        });
      };

      let events = [...allEvents];
      if (statusArg === 'past') {
        events = events.filter(e => e.status?.type?.completed);
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else if (statusArg === 'upcoming') {
        events = events.filter(e => !e.status?.type?.completed && e.status?.type?.state !== 'in');
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else if (statusArg === 'live') {
        events = events.filter(e => e.status?.type?.state === 'in');
      } else {
        events = sortByProximity(events);
      }

      // CRITICAL FALLBACK: If 'live' or 'past' filter yielded 0 games,
      // fall back to showing the closest recent & upcoming games so the widget is NEVER empty!
      if (events.length === 0 && allEvents.length > 0) {
        events = sortByProximity(allEvents);
      }

      const formatGame = (event) => {
        const comp = event.competitions?.[0];
        const competitors = comp?.competitors || [];
        const home = competitors.find(c => c.homeAway === 'home') || competitors[0];
        const away = competitors.find(c => c.homeAway === 'away') || competitors[1];
        const status = event.status?.type;
        const link = event.links?.[0]?.href || `https://www.espn.com/${sportPath}/game/_/gameId/${event.id}`;
        const extractScore = (s) => {
          if (s === null || s === undefined) return '0';
          if (typeof s === 'object') return String(s.displayValue ?? s.value ?? '0');
          return String(s);
        };
        
        return {
          id: event.id,
          name: event.shortName || event.name,
          status: status?.description || 'Scheduled',
          statusDetail: status?.shortDetail || status?.detail || '',
          isLive: status?.state === 'in',
          isCompleted: status?.completed || false,
          link,
          home: {
            name: home?.team?.displayName || '?',
            abbreviation: home?.team?.abbreviation || '?',
            score: extractScore(home?.score),
            logo: home?.team?.logo || home?.team?.logos?.[0]?.href || '',
            color: home?.team?.color ? `#${home.team.color}` : '#3B82F6',
            record: home?.records?.[0]?.summary || home?.record?.[0]?.displayValue || '',
          },
          away: {
            name: away?.team?.displayName || '?',
            abbreviation: away?.team?.abbreviation || '?',
            score: extractScore(away?.score),
            logo: away?.team?.logo || away?.team?.logos?.[0]?.href || '',
            color: away?.team?.color ? `#${away.team.color}` : '#EF4444',
            record: away?.records?.[0]?.summary || away?.record?.[0]?.displayValue || '',
          },
          venue: comp?.venue?.fullName || '',
          broadcast: comp?.broadcasts?.[0]?.names?.[0] || '',
          league: league.toUpperCase(),
        };
      };

      const games = events.slice(0, 6).map(formatGame);
      
      if (games.length === 0) {
        return JSON.stringify({
          error: `No games found in the live scoreboard for ${team || league}.`,
          message: "No scoreboard data found right now."
        });
      }

      return JSON.stringify({
        status: 'success',
        action: `Found ${games.length} ${league.toUpperCase()} games.`,
        games,
        league: league.toUpperCase(),
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to fetch sports data: " + e.message });
    }
  }

  if (name === 'get_stocks') {
    try {
      const rawQuery = (args.query || args.symbol || 'AAPL').trim();
      const upper = rawQuery.toUpperCase().replace(/\s+/g, '');

      // Built-in normalization for crypto & common tickers
      const CRYPTO_AND_COMMON_MAP = {
        'BITCOIN': 'BTC-USD',
        'BTC': 'BTC-USD',
        'BTCUSD': 'BTC-USD',
        'BTC/USD': 'BTC-USD',
        'ETHEREUM': 'ETH-USD',
        'ETH': 'ETH-USD',
        'ETHUSD': 'ETH-USD',
        'ETH/USD': 'ETH-USD',
        'SOLANA': 'SOL-USD',
        'SOL': 'SOL-USD',
        'SOLUSD': 'SOL-USD',
        'DOGECOIN': 'DOGE-USD',
        'DOGE': 'DOGE-USD',
        'DOGEUSD': 'DOGE-USD',
        'XRP': 'XRP-USD',
        'XRPUSD': 'XRP-USD',
        'RIPPLE': 'XRP-USD',
        'CARDANO': 'ADA-USD',
        'ADA': 'ADA-USD',
        'ADAUSD': 'ADA-USD',
        'BNB': 'BNB-USD',
        'BNBUSD': 'BNB-USD',
        'AVALANCHE': 'AVAX-USD',
        'AVAX': 'AVAX-USD',
        'POLYGON': 'POL-USD',
        'LITECOIN': 'LTC-USD',
        'LTC': 'LTC-USD',
        'NVIDIA': 'NVDA',
        'APPLE': 'AAPL',
        'MICROSOFT': 'MSFT',
        'GOOGLE': 'GOOGL',
        'ALPHABET': 'GOOGL',
        'AMAZON': 'AMZN',
        'TESLA': 'TSLA',
        'META': 'META',
        'NETFLIX': 'NFLX',
        'PALANTIR': 'PLTR',
        'COINBASE': 'COIN',
        'S&P500': 'SPY',
        'SP500': 'SPY',
      };

      let symbol = CRYPTO_AND_COMMON_MAP[upper] || upper;

      // Auto-resolve company/crypto name via Yahoo Finance search if needed
      if (!CRYPTO_AND_COMMON_MAP[upper] && (rawQuery.includes(' ') || rawQuery !== rawQuery.toUpperCase() || (rawQuery.length > 5 && !rawQuery.includes('-')))) {
        // Also handle XXXUSD -> XXX-USD pattern
        if (/^[A-Z]{3,5}USD$/i.test(upper)) {
          symbol = `${upper.slice(0, -3)}-USD`;
        } else {
          const searchRes = await fetch(`https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(rawQuery)}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
          });
          const searchData = await searchRes.json();
          const bestQuote = searchData.quotes?.find(q =>
            ['EQUITY', 'ETF', 'CRYPTOCURRENCY', 'INDEX', 'FUTURE'].includes(q.quoteType)
          );
          if (bestQuote?.symbol) {
            symbol = bestQuote.symbol;
          }
        }
      }
      
      const chartRes = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } }
      );
      const chartData = await chartRes.json();
      const meta = chartData.chart?.result?.[0]?.meta;
      
      if (!meta) {
        return JSON.stringify({ error: `Could not find stock/crypto data for ${symbol}.` });
      }

      const price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose || meta.previousClose;
      const change = prevClose ? ((price - prevClose) / prevClose * 100).toFixed(2) : '0.00';
      const changeAbs = prevClose ? (price - prevClose).toFixed(2) : '0.00';
      
      const closes = chartData.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
      const sparkline = closes.filter(v => v !== null && v !== undefined).map(v => parseFloat(v.toFixed(2)));

      const companyName = meta.longName || meta.shortName || symbol;
      const currency = meta.currency || 'USD';
      const exchange = meta.fullExchangeName || meta.exchangeName || '';
      const marketState = meta.marketState || (symbol.endsWith('-USD') ? 'REGULAR' : 'CLOSED');

      // High-reliability logo URL resolution (works for both Stocks & Crypto without API keys!)
      const isCrypto = symbol.endsWith('-USD') || meta.instrumentType === 'CRYPTOCURRENCY';
      const baseTicker = symbol.replace('-USD', '');
      const logoUrl = isCrypto
        ? `https://assets.coincap.io/assets/icons/${baseTicker.toLowerCase()}@2x.png`
        : `https://financialmodelingprep.com/image-stock/${baseTicker.toUpperCase()}.png`;

      return JSON.stringify({
        status: 'success',
        action: `Fetched live market data for ${companyName} (${symbol}): $${price}.`,
        stock: {
          symbol,
          name: companyName,
          price,
          currency,
          change: parseFloat(change),
          changeAbs: parseFloat(changeAbs),
          isUp: parseFloat(change) >= 0,
          exchange,
          marketState,
          sparkline,
          high: meta.regularMarketDayHigh || (sparkline.length ? Math.max(...sparkline.slice(-2)) : null),
          low: meta.regularMarketDayLow || (sparkline.length ? Math.min(...sparkline.slice(-2)) : null),
          volume: meta.regularMarketVolume || null,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow || null,
          logoUrl,
          sector: isCrypto ? 'Cryptocurrency' : (meta.instrumentType || 'Equity'),
          industry: exchange,
          marketCap: null
        }
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to fetch stock data: " + e.message });
    }
  }

  if (name === 'get_news') {
    try {
      const rawTopic = (args.topic || '').trim();
      const topicLower = rawTopic.toLowerCase();

      // Google News RSS Section Mapping for high-precision categories
      const SECTION_MAP = {
        'tech': 'TECHNOLOGY',
        'technology': 'TECHNOLOGY',
        'ai': 'AI & Technology',
        'science': 'SCIENCE',
        'business': 'BUSINESS',
        'finance': 'BUSINESS',
        'markets': 'BUSINESS',
        'sports': 'SPORTS',
        'entertainment': 'ENTERTAINMENT',
        'health': 'HEALTH',
        'world': 'WORLD',
      };

      const mappedSection = SECTION_MAP[topicLower];
      let url;
      let displayTopic = rawTopic || 'Top Stories';

      if (mappedSection && ['TECHNOLOGY', 'SCIENCE', 'BUSINESS', 'SPORTS', 'ENTERTAINMENT', 'HEALTH', 'WORLD'].includes(mappedSection)) {
        url = `https://news.google.com/rss/headlines/section/topic/${mappedSection}?hl=en-US&gl=US&ceid=US:en`;
        displayTopic = mappedSection.charAt(0) + mappedSection.slice(1).toLowerCase() + ' News';
      } else if (rawTopic) {
        url = `https://news.google.com/rss/search?q=${encodeURIComponent(rawTopic)}&hl=en-US&gl=US&ceid=US:en`;
        displayTopic = rawTopic.replace(/\b\w/g, c => c.toUpperCase());
      } else {
        url = `https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en`;
      }

      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      const xml = await res.text();
      
      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xml)) !== null && items.length < 8) {
        const itemContent = match[1];
        const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
        const sourceMatch = itemContent.match(/<source(?:\s+url="([^"]*)")?[^>]*>([\s\S]*?)<\/source>/);
        const dateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const descMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/);
        const mediaMatch = itemContent.match(/url="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/i);

        if (titleMatch && linkMatch) {
          let title = titleMatch[1]
            .replace(/<!\[CDATA\[|\]\]>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
          const sourceUrl = sourceMatch?.[1] || '';
          const source = sourceMatch?.[2] ? sourceMatch[2].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : 'Google News';
          const link = linkMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim();
          
          if (title.endsWith(` - ${source}`)) {
            title = title.substring(0, title.length - source.length - 3).trim();
          }

          let domain = '';
          try {
            if (sourceUrl) domain = new URL(sourceUrl).hostname.replace('www.', '');
          } catch {}

          // Extract clean snippet from HTML description if present
          let snippet = '';
          if (descMatch?.[1]) {
            const rawDesc = descMatch[1]
              .replace(/<!\[CDATA\[|\]\]>/g, '')
              .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
            const textOnly = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (textOnly && !textOnly.startsWith(title.slice(0, 20))) {
              snippet = textOnly.slice(0, 140);
            }
          }

          const favicon = domain
            ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
            : `https://www.google.com/s2/favicons?domain=news.google.com&sz=128`;

          items.push({
            title,
            link,
            source,
            domain,
            favicon,
            image: mediaMatch?.[1] || null,
            snippet,
            date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
          });
        }
      }

      return JSON.stringify({
        status: 'success',
        action: `Found ${items.length} Google News articles for ${displayTopic}.`,
        articles: items,
        topic: displayTopic,
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to fetch news: " + e.message });
    }
  }

  if (name === 'set_timer') {
    const rawSec = Number(args.seconds) || Number(args.duration) || 60;
    const seconds = Math.max(1, Math.round(rawSec));
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const label = args.label || (mins > 0 ? `${mins}m${secs > 0 ? ` ${secs}s` : ''} Timer` : `${secs}s Timer`);
    return JSON.stringify({
      status: 'success',
      action: `Started a countdown timer for ${label}.`,
      seconds,
      label,
      autoStart: true,
      startedAt: Date.now()
    });
  }

  if (name === 'get_tasks') {
    const rawAction = (args.action || (args.task ? 'add' : 'list')).toLowerCase();
    const taskText = (args.task || '').trim();
    const isComplete = ['complete', 'finish', 'done', 'check', 'checkoff'].includes(rawAction);
    const action = isComplete ? 'complete' : (rawAction === 'add' ? 'add' : 'list');

    let summaryAction = "Opened tasks widget.";
    if (action === 'add' && taskText) {
      summaryAction = `Added task "${taskText}" to your to-do list.`;
    } else if (action === 'complete' && taskText) {
      summaryAction = `Marked task "${taskText}" as complete.`;
    }

    return JSON.stringify({
      status: "success",
      action: summaryAction,
      taskAction: action,
      taskText,
      addedTask: action === 'add' ? taskText : undefined,
      completedTask: action === 'complete' ? taskText : undefined,
      timestamp: Date.now()
    });
  }

  if (name === 'get_translation') {
    const text = (args.text || '').trim();
    const rawLangs = (args.target_language || args.target_languages || args.language || 'Spanish').trim();

    const LANG_CODE_MAP = {
      'spanish': { code: 'es', label: 'Spanish' },
      'es': { code: 'es', label: 'Spanish' },
      'french': { code: 'fr', label: 'French' },
      'fr': { code: 'fr', label: 'French' },
      'german': { code: 'de', label: 'German' },
      'de': { code: 'de', label: 'German' },
      'japanese': { code: 'ja', label: 'Japanese' },
      'ja': { code: 'ja', label: 'Japanese' },
      'chinese': { code: 'zh-CN', label: 'Chinese' },
      'mandarin': { code: 'zh-CN', label: 'Chinese' },
      'zh': { code: 'zh-CN', label: 'Chinese' },
      'portuguese': { code: 'pt', label: 'Portuguese' },
      'pt': { code: 'pt', label: 'Portuguese' },
      'arabic': { code: 'ar', label: 'Arabic' },
      'ar': { code: 'ar', label: 'Arabic' },
      'hindi': { code: 'hi', label: 'Hindi' },
      'hi': { code: 'hi', label: 'Hindi' },
      'korean': { code: 'ko', label: 'Korean' },
      'ko': { code: 'ko', label: 'Korean' },
      'russian': { code: 'ru', label: 'Russian' },
      'ru': { code: 'ru', label: 'Russian' },
      'italian': { code: 'it', label: 'Italian' },
      'it': { code: 'it', label: 'Italian' },
    };

    if (!text) {
      return JSON.stringify({
        status: "success",
        action: "Opened Translation widget."
      });
    }

    const requestedLangs = rawLangs
      .split(/,|and|&/i)
      .map(s => s.trim().toLowerCase())
      .filter(Boolean);

    const targets = requestedLangs.length > 0
      ? requestedLangs.map(l => LANG_CODE_MAP[l] || { code: l.slice(0, 2), label: l.charAt(0).toUpperCase() + l.slice(1) })
      : [{ code: 'es', label: 'Spanish' }];

    const translations = [];
    for (const t of targets) {
      try {
        const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(t.code)}&dt=t&dt=rm&q=${encodeURIComponent(text)}`;
        const res = await fetch(gtxUrl);
        if (res.ok) {
          const data = await res.json();
          const sentences = data?.[0] || [];
          let translatedText = '';
          let phonetic = '';
          for (const part of sentences) {
            if (part?.[0]) translatedText += part[0];
            if (part?.[2]) phonetic += part[2] + ' ';
          }
          translations.push({
            language: t.label,
            langCode: t.code,
            langLabel: t.label,
            translatedText: translatedText.trim(),
            pronunciation: phonetic.trim(),
            phonetic: phonetic.trim()
          });
        }
      } catch (err) {
        console.warn('[Translation] GTX fallback error:', err.message);
      }
    }

    return JSON.stringify({
      status: "success",
      action: translations.length > 0
        ? `Translated "${text}" into ${translations.map(t => `${t.langLabel} (${t.translatedText}${t.phonetic ? ` — ${t.phonetic}` : ''})`).join(' and ')}.`
        : "Opened Translation widget.",
      sourceText: text,
      text,
      targetLanguage: rawLangs,
      translations
    });
  }

  if (name === 'check_system_health' || name === 'get_system_stats') {
    const snapshot = await buildSystemAndHealthSnapshot();
    return JSON.stringify(snapshot);
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

  if (name === 'get_currency') {
    try {
      const from = (args.from || 'USD').toLowerCase();
      const to = (args.to || 'EUR').toLowerCase();
      const amount = parseFloat(args.amount) || 1;

      let rate = null;
      try {
        const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from}.json`);
        const data = await res.json();
        if (data && data[from] && data[from][to]) {
          rate = data[from][to];
        }
      } catch {}

      if (!rate) {
        const res = await fetch(`https://open.er-api.com/v6/latest/${from.toUpperCase()}`);
        const data = await res.json();
        if (data.result === 'success' && data.rates[to.toUpperCase()]) {
          rate = data.rates[to.toUpperCase()];
        }
      }

      if (!rate) {
        return JSON.stringify({ error: `Currency conversion failed for ${from.toUpperCase()} → ${to.toUpperCase()}.` });
      }

      const converted = amount * rate;
      return JSON.stringify({
        status: "success",
        action: `Converted ${amount} ${from.toUpperCase()} to ${converted.toFixed(2)} ${to.toUpperCase()}.`,
        from: from.toUpperCase(), to: to.toUpperCase(), amount, rate, converted, result: converted
      });
    } catch (e) {
      return JSON.stringify({ error: "Failed to fetch currency rates: " + e.message });
    }
  }

  if (name === 'whispr_control') {
    try {
      const rawAction = (args.action || args.command || '').toLowerCase();
      const target = (args.target || '').trim();

      let action = rawAction;
      if (action === 'mute' || action === 'toggle_mute' || action === 'unmute') {
        action = 'volume_mute';
      }

      if (action === 'open_app') {
        const APP_MAP = {
          'notepad': 'notepad.exe',
          'calculator': 'calc.exe',
          'calc': 'calc.exe',
          'paint': 'mspaint.exe',
          'explorer': 'explorer.exe',
          'file explorer': 'explorer.exe',
          'files': 'explorer.exe',
          'task manager': 'taskmgr.exe',
          'settings': 'ms-settings:',
          'cmd': 'cmd.exe',
          'terminal': 'wt.exe',
          'powershell': 'powershell.exe',
          'chrome': 'chrome',
          'edge': 'msedge',
          'spotify': 'spotify:',
          'vscode': 'code',
          'vs code': 'code',
          'discord': 'discord:',
        };
        const cmd = APP_MAP[target.toLowerCase()] || target;
        await execPromise(`start "" "${cmd}"`);
        return JSON.stringify({ status: 'success', action: `Launched application: ${target}` });
      }

      if (action === 'open_url') {
        const { shell } = await import('electron');
        const url = target.startsWith('http') ? target : `https://${target}`;
        await shell.openExternal(url);
        return JSON.stringify({ status: 'success', action: `Opened URL: ${url}` });
      }

      if (action === 'volume_up' || action === 'volume_down' || action === 'volume_mute') {
        const keyChar = action === 'volume_up' ? 175 : action === 'volume_down' ? 174 : 173;
        const repeats = action === 'volume_mute' ? 1 : 5;
        await execPromise(`powershell -NoProfile -NonInteractive -Command "$w = New-Object -ComObject WScript.Shell; 1..${repeats} | ForEach-Object { $w.SendKeys([char]${keyChar}) }"`);
        const label = action === 'volume_mute' ? 'Toggled audio mute' : (action === 'volume_up' ? 'Increased system volume' : 'Decreased system volume');
        return JSON.stringify({ status: 'success', action: label });
      }

      if (action === 'minimize_all') {
        await execPromise(`powershell -NoProfile -NonInteractive -Command "(New-Object -ComObject Shell.Application).ToggleDesktop()"`);
        return JSON.stringify({ status: 'success', action: 'Toggled desktop / minimized windows.' });
      }

      if (action === 'copy_clipboard') {
        const safeText = target.replace(/'/g, "''");
        await execPromise(`powershell -NoProfile -NonInteractive -Command "Set-Clipboard -Value '${safeText}'"`);
        return JSON.stringify({ status: 'success', action: 'Copied text to Windows clipboard.' });
      }

      if (action === 'lock_screen') {
        await execPromise(`rundll32.exe user32.dll,LockWorkStation`);
        return JSON.stringify({ status: 'success', action: 'Locked Windows workstation.' });
      }

      return JSON.stringify({ error: `Unknown Whispr Control action: ${action}` });
    } catch (e) {
      return JSON.stringify({ error: `Whispr Control failed: ${e.message}` });
    }
  }

  if (name === "get_flights") {
    return JSON.stringify({
      error: "Flight tracking is not yet supported in this version of Whispr.",
      message: "Inform the user that real-time flight status is not yet available."
    });
  }

  if (name === "transcribe_audio") {
    return JSON.stringify({
      status: "ready",
      message: "Transcription infrastructure is prepared."
    });
  }

  return JSON.stringify({ error: "Tool not implemented or unknown tool." });
}

const dynamicExecutors = new Map();

export function registerTool(schema, executor) {
  const toolName = schema.function?.name;
  if (!toolName) throw new Error("Invalid tool schema: Missing function name.");
  availableTools.push(schema);
  dynamicExecutors.set(toolName, executor);
  console.log(`[Plugin System] Successfully registered dynamic skill: ${toolName}`);
}

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
