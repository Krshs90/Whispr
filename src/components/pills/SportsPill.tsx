import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, MapPin, Tv } from 'lucide-react';

interface TeamData {
  name: string;
  abbreviation: string;
  score: string;
  logo: string;
  color: string;
  record: string;
}

interface GameData {
  id: string;
  name: string;
  status: string;
  statusDetail: string;
  isLive: boolean;
  isCompleted: boolean;
  home: TeamData;
  away: TeamData;
  venue: string;
  broadcast: string;
  league: string;
  link?: string;
}

function TeamLogo({ url, abbr, color, size = 32 }: { url: string; abbr: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed || !url) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 8,
        background: color + '33', display: 'flex', justifyContent: 'center', alignItems: 'center',
        fontSize: size * 0.3, fontWeight: 700, color: '#FFFFEB', border: `1px solid ${color}44`,
      }}>{abbr}</div>
    );
  }
  return <img src={url} alt={abbr} style={{ width: size, height: size, objectFit: 'contain' }} onError={() => setFailed(true)} />;
}

function GameCard({ game, compact = false }: { game: GameData; compact?: boolean }) {
  const { home, away, isLive, isCompleted, statusDetail, venue, broadcast, link } = game;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      onClick={() => {
        if (!compact && link) {
          (window as any).electronAPI?.openExternal?.(link);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        background: isHovered && !compact && link ? '#252528' : '#1E1E20',
        borderRadius: 14,
        padding: compact ? '10px 14px' : '14px 18px',
        boxSizing: 'border-box',
        cursor: (!compact && link) ? 'pointer' : 'default',
        transition: 'background 0.2s',
      }}
    >
      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: compact ? 8 : 12 }}>
        {isLive && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B30' }}
          />
        )}
        <span style={{
          fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: isLive ? '#FF3B30' : isCompleted ? '#A0A0A5' : '#4ADE80',
        }}>
          {isLive ? 'Live' : isCompleted ? 'Final' : 'Scheduled'}
        </span>
        <span style={{ fontSize: 9, color: '#6A6A70' }}>· {statusDetail}</span>
      </div>

      {/* Scoreboard */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', gap: 12 }}>
        {/* Away */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10, flex: 1, minWidth: 0 }}>
          <div style={{ flexShrink: 0 }}>
            <TeamLogo url={away.logo} abbr={away.abbreviation} color={away.color} size={compact ? 36 : 48} />
          </div>
          <div style={{ minWidth: 0, flexShrink: 1 }}>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#FFFFEB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{away.abbreviation}</div>
            {!compact && <div style={{ fontSize: 9, color: '#6A6A70', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{away.record}</div>}
          </div>
        </div>

        {/* Scores */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 12 : 20, flexShrink: 0 }}>
          <span style={{
            fontSize: compact ? 22 : 28, fontWeight: 700, color: '#FFFFEB',
            fontVariantNumeric: 'tabular-nums',
          }}>{away.score}</span>
          <span style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>—</span>
          <span style={{
            fontSize: compact ? 22 : 28, fontWeight: 700, color: '#FFFFEB',
            fontVariantNumeric: 'tabular-nums',
          }}>{home.score}</span>
        </div>

        {/* Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 10, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: 'right', minWidth: 0, flexShrink: 1 }}>
            <div style={{ fontSize: compact ? 12 : 13, fontWeight: 600, color: '#FFFFEB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{home.abbreviation}</div>
            {!compact && <div style={{ fontSize: 9, color: '#6A6A70', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{home.record}</div>}
          </div>
          <div style={{ flexShrink: 0 }}>
            <TeamLogo url={home.logo} abbr={home.abbreviation} color={home.color} size={compact ? 36 : 48} />
          </div>
        </div>
      </div>

      {/* Venue + Broadcast */}
      {!compact && (venue || broadcast) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10 }}>
          {venue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={9} color="#555" />
              <span style={{ fontSize: 9, color: '#555' }}>{venue}</span>
            </div>
          )}
          {broadcast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Tv size={9} color="#555" />
              <span style={{ fontSize: 9, color: '#555' }}>{broadcast}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SportsPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [refreshing, setRefreshing] = useState(false);

  const game: GameData | null = data?.game || null;
  const games: GameData[] = data?.games || [];
  const league = data?.league || 'NBA';
  const allGames = game ? [game] : games;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    // Re-fetch via executeTool
    try {
      const result = await (window as any).electronAPI?.executeTool?.('get_sports', {
        team: game ? game.home.abbreviation : '',
        league: league.toLowerCase(),
      }, {});
      if (result) {
        // TODO: trigger re-fetch state update from tool result
      }
    } catch { }
    setTimeout(() => setRefreshing(false), 2000);
  };

  // ─── COMPACT VIEW ───
  if (!expanded && allGames.length > 0) {
    const g = allGames[0];
    return (
      <div
        onClick={() => { setExpanded(true); if (onExpand) onExpand(allGames.length > 1 ? 420 : 280); }}
        style={{
          width: '100%', height: 70,
          background: '#1A1A1A',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        {/* Away */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <TeamLogo url={g.away.logo} abbr={g.away.abbreviation} color={g.away.color} size={28} />
          <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>{g.away.score}</span>
        </div>

        {/* Status Center */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {g.isLive && (
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B30' }} />
            )}
            <span style={{
              fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
              color: g.isLive ? '#FF3B30' : g.isCompleted ? '#A0A0A5' : '#4ADE80',
            }}>
              {g.isLive ? 'Live' : g.isCompleted ? 'Final' : 'Scheduled'}
            </span>
          </div>
          <span style={{ fontSize: 9, color: '#6A6A70' }}>{g.statusDetail}</span>
        </div>

        {/* Home */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>{g.home.score}</span>
          <TeamLogo url={g.home.logo} abbr={g.home.abbreviation} color={g.home.color} size={28} />
        </div>
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  return (
    <div style={{
      width: '100%', minHeight: 200,
      maxHeight: defaultExpanded ? 'none' : 420,
      overflowY: 'auto',
      background: '#18181A',
      padding: '30px 20px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      boxSizing: 'border-box', color: '#FFFFEB', position: 'relative',
      gap: 12,
    }}>
      {/* Collapse + Refresh */}
      {!defaultExpanded && (
        <div
          onClick={() => { setExpanded(false); if (onExpand) onExpand(70); }}
          style={{
            position: 'absolute', top: 12, left: 18,
            cursor: 'pointer', opacity: 0.4,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: '#A0A0A5', zIndex: 2,
          }}
        >
          <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>‹</span>
          <span>collapse</span>
        </div>
      )}

      <div style={{ position: 'absolute', top: 12, right: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.div
          animate={refreshing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
          onClick={handleRefresh}
          style={{ cursor: 'pointer', opacity: 0.5 }}
        >
          <RefreshCw size={13} color="#A0A0A5" />
        </motion.div>
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#A0A0A5',
          background: '#252527', borderRadius: 8, padding: '2px 8px',
        }}>{league}</span>
      </div>

      {/* Header */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 8 }}>
        {allGames.length > 1 ? `Matchups` : 'Game Details'}
      </div>

      {/* Render all games */}
      {allGames.map((g, i) => (
        <GameCard key={g.id || i} game={g} compact={allGames.length > 2} />
      ))}

      {allGames.length === 0 && (
        <div style={{ fontSize: 13, color: '#6A6A70', padding: '20px 0', textAlign: 'center' }}>
          No games found for today.
        </div>
      )}
    </div>
  );
}

export const sportsPillMeta = { name: 'Sports', height: 70, keywords: ['sports', 'score', 'game', 'nba', 'nfl', 'mlb', 'nhl', 'mls', 'epl', 'soccer', 'basketball', 'football', 'baseball', 'hockey', 'lakers', 'mavericks', 'celtics', 'warriors', 'cowboys'] };
