import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

interface NowPlayingData {
  status: string;
  title: string;
  artist: string;
  album: string;
  albumArt?: string;
  source: { name: string; color: string; icon: string };
}

// Source icon mapping
function SourceIcon({ source, size = 14 }: { source: { name: string; color: string; icon: string }, size?: number }) {
  const s: React.CSSProperties = { width: size, height: size, borderRadius: 3, objectFit: 'cover' };
  switch (source.icon) {
    case 'spotify':
      return <img src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg" alt="Spotify" style={s} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    case 'youtube':
      return <img src="https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg" alt="YouTube" style={s} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    case 'apple':
      return <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg" alt="Apple Music" style={s} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    default:
      return <Music size={size} color={source.color} />;
  }
}

export function MusicPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [playing, setPlaying] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll Windows Media Session every 2 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const result = await (window as any).electronAPI?.getNowPlaying();
        if (result) {
          setNowPlaying(result);
          setPlaying(result.status === 'playing');
        }
      } catch { /* ignore if not available */ }
    };
    
    poll(); // immediate
    pollRef.current = setInterval(poll, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Only use live detection — ignore data.song to prevent "null" / fake titles, 
  // UNLESS nowPlaying is completely unavailable (like in the Settings mock view)
  const isIdle = !nowPlaying || nowPlaying.status === 'idle' || !nowPlaying.title;
  const isPaused = nowPlaying?.status === 'paused' && !!nowPlaying.title;
  
  const fallbackToMock = isIdle && data && data.title;
  
  const isActive = (!isIdle || isPaused) || fallbackToMock;
  const isPlayingNow = fallbackToMock ? (data.isPlaying || false) : playing;
  
  const title = fallbackToMock ? data.title : (isActive ? nowPlaying!.title : 'No Music Playing');
  const artist = fallbackToMock ? data.artist : (isActive ? nowPlaying!.artist : '');
  const album = fallbackToMock ? data.album : (isActive ? nowPlaying!.album : '');
  const activeAlbumArt = fallbackToMock ? data.albumArt : (isActive ? nowPlaying?.albumArt : undefined);
  const source = fallbackToMock ? { name: 'Spotify', color: '#1DB954', icon: 'spotify' } : (isActive ? nowPlaying!.source : { name: 'None', color: '#555', icon: 'music' });

  // ─── COMPACT VIEW ───
  if (!expanded) {
    return (
      <div
        onClick={() => { setExpanded(true); if (onExpand) onExpand(340); }}
        style={{
          width: '100%', height: 64,
          background: '#1A1A1A',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        {/* Source badge */}
        <div style={{
          width: 40, height: 40, borderRadius: 8,
          background: isActive ? `linear-gradient(135deg, ${source.color}33, ${source.color}11)` : '#222',
          border: `1px solid ${isActive ? source.color + '44' : '#333'}`,
          display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {isActive && activeAlbumArt ? (
            <img src={activeAlbumArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <SourceIcon source={source} size={20} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 600, color: '#FFFFEB',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 10, color: '#888',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {isActive ? `${artist}${source.name !== 'None' ? ` · ${source.name}` : ''}` : 'Tap to expand'}
          </div>
        </div>

        {/* Live bars animation */}
        {isPlayingNow && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div key={i}
                animate={{ height: [3, 8 + Math.random() * 8, 3] }}
                transition={{ repeat: Infinity, duration: 0.4 + Math.random() * 0.4, delay: i * 0.1 }}
                style={{ width: 2, background: source.color, borderRadius: 1 }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  return (
    <div style={{
      width: '100%', minHeight: 340,
      background: '#18181A',
      padding: '30px 24px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxSizing: 'border-box', color: '#FFFFEB', position: 'relative',
      gap: 16,
    }}>

      {/* Collapse button top-left */}
      <div 
        onClick={() => { setExpanded(false); if (onExpand) onExpand(64); }}
        style={{
          position: 'absolute', top: 14, left: 20,
          cursor: 'pointer', opacity: 0.4,
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, color: '#A0A0A5', zIndex: 2,
        }}
      >
        <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>‹</span>
        <span>collapse</span>
      </div>

      {/* Source badge top-right */}
      <div style={{
        position: 'absolute', top: 16, right: 20,
        display: 'flex', alignItems: 'center', gap: 6,
        background: `${source.color}22`, border: `1px solid ${source.color}33`,
        borderRadius: 20, padding: '3px 10px 3px 6px',
      }}>
        <SourceIcon source={source} size={12} />
        <span style={{ fontSize: 10, fontWeight: 600, color: source.color, opacity: 0.9 }}>{source.name}</span>
      </div>

      {/* Album Art / Cover */}
      <div style={{
        width: 120, height: 120, borderRadius: 16,
        background: isActive ? `linear-gradient(135deg, ${source.color}44, #22222488)` : '#252527',
        boxShadow: isActive ? `0 4px 16px ${source.color}33` : 'none',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden', flexShrink: 0,
        border: `1px solid ${isActive ? source.color + '22' : '#333'}`,
        marginTop: 0
      }}>
        {!isActive ? (
          <Music size={40} color="#555" />
        ) : activeAlbumArt ? (
          <img src={activeAlbumArt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: `linear-gradient(145deg, ${source.color}66, #1A1A1A)`,
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <SourceIcon source={source} size={48} />
          </div>
        )}
      </div>

      {/* Title & Artist */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{
          fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#A0A0A5', marginTop: 2 }}>
          {artist || (isActive ? 'Unknown Artist' : 'Nothing is playing right now')}
        </div>
        {album && (
          <div style={{ fontSize: 10, color: '#6A6A70', marginTop: 1 }}>
            {album}
          </div>
        )}
      </div>

      {/* Timeline Bar */}
      {isActive && nowPlaying && nowPlaying.duration > 0 && (
        <div style={{ width: '100%', padding: '0 10px', marginTop: 4 }}>
          <div style={{ 
            width: '100%', height: 4, background: '#333', 
            borderRadius: 2, overflow: 'hidden', position: 'relative' 
          }}>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, bottom: 0, 
              background: source.color, 
              width: `${Math.min(100, Math.max(0, (nowPlaying.position / nowPlaying.duration) * 100))}%`,
              transition: 'width 1s linear'
            }} />
          </div>
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', 
            fontSize: 10, color: '#888', marginTop: 4, fontWeight: 500 
          }}>
            <span>{Math.floor(nowPlaying.position / 60)}:{(nowPlaying.position % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(nowPlaying.duration / 60)}:{(nowPlaying.duration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 4 }}>
          <button 
            onClick={() => window.electronAPI?.chatRequest({ messages: [{ role: 'user', content: 'prev' }], defaultModel: 'llama3.2', apiKeys: {}, userData: {} })}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', opacity: 0.7 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
          </button>
          <button 
            onClick={() => window.electronAPI?.chatRequest({ messages: [{ role: 'user', content: isPlayingNow ? 'pause' : 'play' }], defaultModel: 'llama3.2', apiKeys: {}, userData: {} })}
            style={{ 
              background: '#FFF', border: 'none', color: '#000', cursor: 'pointer', 
              width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
          >
            {isPlayingNow ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            )}
          </button>
          <button 
            onClick={() => window.electronAPI?.chatRequest({ messages: [{ role: 'user', content: 'skip' }], defaultModel: 'llama3.2', apiKeys: {}, userData: {} })}
            style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', opacity: 0.7 }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
          </button>
        </div>
      )}

      {/* Audio Visualizer */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 3, height: 40,
        justifyContent: 'center', width: '100%', marginTop: isActive ? 10 : 30
      }}>
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ height: !isPlayingNow ? 3 : [3, 10 + ((i * 7) % 20), 3] }}
            transition={{
              repeat: Infinity,
              duration: 0.35 + ((i % 4) * 0.1),
              delay: (i % 5) * 0.04
            }}
            style={{
              width: 3,
              background: !isPlayingNow ? '#333' : `linear-gradient(180deg, ${source.color}, ${source.color}33)`,
              borderRadius: 1.5,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const musicPillMeta = { name: 'Spotify', height: 64, keywords: ['play', 'spotify', 'music', 'song'] };
