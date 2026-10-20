/**
 * Windows Media Session Detector & Controller
 * Uses WinRT GlobalSystemMediaTransportControls (SMTC) for universal access.
 */

import util from 'util';
import { execFile } from 'child_process';

const execFilePromise = util.promisify(execFile);

const albumArtCache = {}; // Cache iTunes API requests

async function fetchAlbumArt(artist, title) {
  if (!artist && !title) return '';
  const query = `${artist} ${title}`.trim();
  if (albumArtCache[query]) return albumArtCache[query];
  
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.results?.[0]?.artworkUrl100) {
        const art = data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
        albumArtCache[query] = art;
        return art;
      }
    }
  } catch (e) {}
  
  albumArtCache[query] = ''; 
  return '';
}

function getSmtcScript(action) {
  return `
[CmdletBinding()]
param([string]$action = "${action}")

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1'
})[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null

$manager = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
$session = $manager.GetCurrentSession()
if (-not $session) {
    $sessions = $manager.GetSessions()
    if ($sessions -and $sessions.Count -gt 0) {
        $session = $sessions[0]
    }
}
if (-not $session) {
    @{ status = "idle" } | ConvertTo-Json -Compress
    exit
}

if ($action -eq "play") { Await ($session.TryPlayAsync()) ([bool]) | Out-Null }
if ($action -eq "pause") { Await ($session.TryPauseAsync()) ([bool]) | Out-Null }
if ($action -eq "playpause") { Await ($session.TryTogglePlayPauseAsync()) ([bool]) | Out-Null }
if ($action -eq "next") { Await ($session.TrySkipNextAsync()) ([bool]) | Out-Null }
if ($action -eq "prev") { Await ($session.TrySkipPreviousAsync()) ([bool]) | Out-Null }

$props = Await ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
$timeline = $session.GetTimelineProperties()
$playbackInfo = $session.GetPlaybackInfo()

$status = "idle"
if ($playbackInfo.PlaybackStatus -eq 4) { $status = "playing" }
elseif ($playbackInfo.PlaybackStatus -eq 5) { $status = "paused" }

$source = $session.SourceAppUserModelId
if ($source -match "Spotify") { $source = "spotify" }
elseif ($source -match "Chrome") { $source = "chrome" }
elseif ($source -match "msedge") { $source = "msedge" }
elseif ($source -match "Firefox") { $source = "firefox" }
elseif ($source -match "iTunes|AppleMusic") { $source = "itunes" }

$position = 0
$endTime = 0
if ($timeline) {
    $position = [math]::Floor($timeline.Position.TotalSeconds)
    $endTime = [math]::Floor($timeline.EndTime.TotalSeconds)
}

@{
    status = $status
    title = $props.Title
    artist = $props.Artist
    album = $props.AlbumTitle
    source = $source
    position = $position
    duration = $endTime
} | ConvertTo-Json -Compress
`;
}

const SOURCE_MAP = {
  'spotify': { name: 'Spotify', color: '#1DB954', icon: 'spotify' },
  'chrome': { name: 'Chrome', color: '#4285F4', icon: 'browser' },
  'msedge': { name: 'Edge', color: '#0078D7', icon: 'browser' },
  'firefox': { name: 'Firefox', color: '#FF7139', icon: 'browser' },
  'itunes': { name: 'Apple Music', color: '#FC3C44', icon: 'apple' },
};

function resolveSource(sourceId) {
  if (!sourceId) return { name: 'Unknown', color: '#888', icon: 'music' };
  const lower = sourceId.toLowerCase();
  for (const [key, val] of Object.entries(SOURCE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return { name: sourceId, color: '#888', icon: 'music' };
}

export async function detectNowPlaying() {
  return executeSmtcCommand("status");
}

export async function controlMedia(action) {
  return executeSmtcCommand(action);
}

async function executeSmtcCommand(action) {
  try {
    const ALLOWED_ACTIONS = ['status', 'play', 'pause', 'playpause', 'next', 'prev'];
    if (!ALLOWED_ACTIONS.includes(action)) {
      throw new Error(`Unauthorized SMTC action: ${action}`);
    }

    const script = getSmtcScript(action);
    const encoded = Buffer.from(script, 'utf16le').toString('base64');
    
    const { stdout } = await execFilePromise(
      'powershell',
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
      { timeout: 5000 }
    );

    const trimmed = stdout.trim();
    if (!trimmed) {
      return { status: 'idle', title: '', artist: '', album: '', albumArt: '', position: 0, duration: 0, source: resolveSource() };
    }

    const data = JSON.parse(trimmed);
    const title = data.title || '';
    const artist = data.artist || '';
    
    let albumArt = '';
    const isPlaying = data.status === 'playing' || data.status === 'paused';
    if (isPlaying && title) {
      albumArt = await fetchAlbumArt(artist, title);
    }

    return {
      status: data.status?.toLowerCase() || 'idle',
      title: title,
      artist: artist,
      album: data.album || '',
      albumArt: albumArt,
      position: data.position || 0,
      duration: data.duration || 0,
      source: resolveSource(data.source),
    };
  } catch (e) {
    console.warn('[MediaDetector] SMTC Failed:', e.message?.substring(0, 120));
    return { status: 'idle', title: '', artist: '', album: '', albumArt: '', position: 0, duration: 0, source: resolveSource() };
  }
}
