import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface StockData {
  symbol: string;
  name: string;
  price: number;
  currency: string;
  change: number;
  changeAbs: number;
  isUp: boolean;
  exchange: string;
  marketState: string;
  sparkline: number[];
  high: number | null;
  low: number | null;
  volume: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
}

// Mini sparkline SVG chart
function Sparkline({ data, color, width = 80, height = 28 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad-${color.replace('#','')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatVolume(vol: number | null): string {
  if (!vol) return '-';
  if (vol >= 1_000_000_000) return (vol / 1_000_000_000).toFixed(2) + 'B';
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(2) + 'M';
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + 'K';
  return vol.toString();
}

export function StocksPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [refreshing, setRefreshing] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const stock: StockData | null = data?.stock || null;
  if (!stock) {
    return (
      <div style={{
        width: '100%', height: 60, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#1A1A1A', color: '#6A6A70',
        fontSize: 12,
      }}>
        No stock data available
      </div>
    );
  }

  const color = stock.isUp ? '#4ADE80' : '#FF3B30';
  const changePrefix = stock.isUp ? '+' : '';
  const logoUrl = stock.logoUrl || `https://logo.clearbit.com/${stock.name?.split(' ')[0]?.toLowerCase()}.com`;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      await (window as any).electronAPI?.executeTool?.('get_stocks', { symbol: stock.symbol }, {});
    } catch { }
    setTimeout(() => setRefreshing(false), 2000);
  };



  // ─── COMPACT VIEW ───
  if (!expanded) {
    return (
      <div
        onClick={() => { setExpanded(true); if (onExpand) onExpand(280); }}
        style={{
          width: '100%', height: 64,
          background: '#1A1A1A',
          padding: '0 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer', boxSizing: 'border-box',
        }}
      >
        {/* Logo */}
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', flexShrink: 0, border: '1px solid #333',
        }}>
          {!logoFailed && logoUrl ? (
             <img src={logoUrl} alt={stock.symbol} style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }}
               onError={() => setLogoFailed(true)}
             />
          ) : (
             <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFEB' }}>{stock.symbol[0]}</span>
          )}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>{stock.symbol}</div>
          <div style={{ fontSize: 9, color: '#6A6A70', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
        </div>

        {/* Sparkline */}
        <Sparkline data={stock.sparkline} color={color} width={60} height={22} />

        {/* Price */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>
            ${stock.price?.toFixed(2)}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
          }}>
            {stock.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {changePrefix}{stock.change?.toFixed(2)}%
          </div>
        </div>
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  const statRow = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <span style={{ fontSize: 11, color: '#6A6A70' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );

  return (
    <div style={{
      width: '100%', minHeight: 280,
      background: '#18181A',
      padding: '24px 20px',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', color: '#FFFFEB', position: 'relative',
    }}>
      {/* Collapse */}
      {!defaultExpanded && (
        <div
          onClick={() => { setExpanded(false); if (onExpand) onExpand(64); }}
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

      {/* Refresh */}
      <motion.div
        animate={refreshing ? { rotate: 360 } : {}}
        transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
        onClick={handleRefresh}
        style={{ position: 'absolute', top: 12, right: 18, cursor: 'pointer', opacity: 0.5 }}
      >
        <RefreshCw size={13} color="#A0A0A5" />
      </motion.div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', border: '1px solid #333', flexShrink: 0,
        }}>
          {!logoFailed && logoUrl ? (
             <img src={logoUrl} alt={stock.symbol} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }}
               onError={() => setLogoFailed(true)}
             />
          ) : (
             <span style={{ fontSize: 16, fontWeight: 700, color: '#FFFFEB' }}>{stock.symbol[0]}</span>
          )}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{stock.symbol}</div>
          <div style={{ fontSize: 10, color: '#6A6A70' }}>{stock.name} · {stock.exchange}</div>
          {stock.sector && <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>{stock.sector} {stock.industry ? `· ${stock.industry}` : ''}</div>}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            ${stock.price?.toFixed(2)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
            {stock.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {changePrefix}{stock.changeAbs?.toFixed(2)} ({changePrefix}{stock.change?.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Market state badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: stock.marketState === 'REGULAR' ? '#4ADE80' : '#FF8C00',
        }} />
        <span style={{ fontSize: 9, color: '#6A6A70', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {stock.marketState === 'REGULAR' ? 'Market Open' : stock.marketState === 'PRE' ? 'Pre-Market' : stock.marketState === 'POST' ? 'After Hours' : 'Market Closed'}
        </span>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', padding: '4px 0', marginTop: 8 }}>
        <Sparkline data={stock.sparkline} color={color} width={280} height={50} />
      </div>

      {/* Stats grid */}
      <div style={{ width: '100%', borderTop: '1px solid #2A2A2E', paddingTop: 8, marginTop: 8 }}>
        {statRow('Day High', stock.high ? `$${stock.high.toFixed(2)}` : '-')}
        {statRow('Day Low', stock.low ? `$${stock.low.toFixed(2)}` : '-')}
        {statRow('Volume', formatVolume(stock.volume))}
        {statRow('Market Cap', stock.marketCap || '-')}
        {statRow('52W High', stock.fiftyTwoWeekHigh ? `$${stock.fiftyTwoWeekHigh.toFixed(2)}` : '-')}
        {statRow('52W Low', stock.fiftyTwoWeekLow ? `$${stock.fiftyTwoWeekLow.toFixed(2)}` : '-')}
      </div>
    </div>
  );
}

export const stocksPillMeta = { name: 'Stocks', height: 64, keywords: ['stock', 'price', 'market', 'ticker', 'aapl', 'tsla', 'googl', 'msft', 'amzn', 'nvda', 'meta', 'shares', 'portfolio'] };
