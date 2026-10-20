import React, { useState, useEffect, useMemo } from 'react';
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
  logoUrl?: string | null;
  sector?: string | null;
  industry?: string | null;
  marketCap?: string | null;
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

  const gradId = `grad-${color.replace('#', '')}-${width}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
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

function formatPrice(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return '0.00';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function extractStockFromData(data: any): StockData | null {
  if (!data) return null;
  if (data.stock && typeof data.stock === 'object') return data.stock;
  if (data.symbol && data.price !== undefined) {
    return {
      symbol: data.symbol,
      name: data.name || data.symbol,
      price: Number(data.price),
      currency: data.currency || 'USD',
      change: typeof data.change === 'number' ? data.change : parseFloat(String(data.changePercent || '0').replace(/[^0-9.-]/g, '')) || 0,
      changeAbs: typeof data.changeAbs === 'number' ? data.changeAbs : parseFloat(String(data.change || '0').replace(/[^0-9.-]/g, '')) || 0,
      isUp: data.isUp ?? true,
      exchange: data.exchange || 'Market',
      marketState: data.marketState || 'REGULAR',
      sparkline: Array.isArray(data.sparkline) ? data.sparkline : [],
      high: data.high ?? null,
      low: data.low ?? null,
      volume: data.volume ?? null,
      fiftyTwoWeekHigh: data.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: data.fiftyTwoWeekLow ?? null,
      logoUrl: data.logoUrl || null,
      sector: data.sector || null,
      industry: data.industry || null,
      marketCap: data.marketCap || null,
    };
  }
  return null;
}

export function StocksPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [refreshing, setRefreshing] = useState(false);
  const [logoIndex, setLogoIndex] = useState(0);
  const [localStock, setLocalStock] = useState<StockData | null>(() => extractStockFromData(data));

  useEffect(() => {
    const extracted = extractStockFromData(data);
    if (extracted) {
      setLocalStock(extracted);
      setLogoIndex(0);
    }
  }, [data]);

  const stock: StockData | null = localStock || extractStockFromData(data);

  // Build ordered list of candidate logo URLs so if one fails, the next automatically loads
  const candidateLogos = useMemo(() => {
    if (!stock) return [];
    const urls: string[] = [];
    if (stock.logoUrl) urls.push(stock.logoUrl);
    const cleanTicker = stock.symbol.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (cleanTicker.endsWith('-USD')) {
      const coin = cleanTicker.replace('-USD', '').toLowerCase();
      urls.push(`https://assets.coincap.io/assets/icons/${coin}@2x.png`);
    } else {
      urls.push(`https://financialmodelingprep.com/image-stock/${cleanTicker}.png`);
    }
    const firstWord = stock.name?.split(/[\s,Inc.Corp]+/i)[0]?.toLowerCase();
    if (firstWord && firstWord.length > 1) {
      urls.push(`https://www.google.com/s2/favicons?domain=${firstWord}.com&sz=128`);
    }
    return [...new Set(urls)];
  }, [stock]);

  if (!stock) {
    return (
      <div style={{
        width: '100%', height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#1A1A1A', color: '#888',
        fontSize: 12, gap: 8
      }}>
        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Loading market data...</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const color = stock.isUp ? '#4ADE80' : '#FF3B30';
  const changePrefix = stock.isUp ? '+' : '';
  const activeLogoUrl = logoIndex < candidateLogos.length ? candidateLogos[logoIndex] : null;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefreshing(true);
    try {
      const resStr = await window.electronAPI?.executeTool?.('get_stocks', { query: stock.symbol }, {
        stocks: localStorage.getItem('whispr_api_stocks') || ''
      });
      if (resStr) {
        const parsed = typeof resStr === 'string' ? JSON.parse(resStr) : resStr;
        const extracted = extractStockFromData(parsed);
        if (extracted) {
          setLocalStock(extracted);
          setLogoIndex(0);
        }
      }
    } catch { /* ignore refresh error */ }
    setTimeout(() => setRefreshing(false), 800);
  };

  // ─── COMPACT VIEW ───
  if (!expanded) {
    return (
      <div
        onClick={() => { setExpanded(true); if (onExpand) onExpand(330); }}
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
          width: 34, height: 34, borderRadius: 9,
          background: '#242428', display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', flexShrink: 0, border: '1px solid #333',
        }}>
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt={stock.symbol}
              style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'contain' }}
              onError={() => setLogoIndex(i => i + 1)}
            />
          ) : (
            <span style={{ fontSize: 12, fontWeight: 700, color: color }}>{stock.symbol.slice(0, 4)}</span>
          )}
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>{stock.symbol}</div>
          <div style={{ fontSize: 10, color: '#8A8A90', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stock.name}</div>
        </div>

        {/* Sparkline */}
        <Sparkline data={stock.sparkline} color={color} width={64} height={22} />

        {/* Price */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>
            ${formatPrice(stock.price)}
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
          }}>
            {stock.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {changePrefix}{Number(stock.change || 0).toFixed(2)}%
          </div>
        </div>
      </div>
    );
  }

  // ─── EXPANDED VIEW (Scrollable!) ───
  const statRow = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize: 11, color: '#8A8A90' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );

  return (
    <div
      onWheel={e => e.stopPropagation()}
      style={{
        width: '100%',
        maxHeight: defaultExpanded ? 380 : 330,
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#18181A',
        padding: '26px 20px 18px',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', color: '#FFFFEB', position: 'relative',
      }}
    >
      {/* Collapse */}
      {!defaultExpanded && (
        <div
          onClick={() => { setExpanded(false); if (onExpand) onExpand(64); }}
          style={{
            position: 'absolute', top: 10, left: 18,
            cursor: 'pointer', opacity: 0.5,
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
        style={{ position: 'absolute', top: 10, right: 18, cursor: 'pointer', opacity: 0.6, zIndex: 2 }}
        title="Refresh quote"
      >
        <RefreshCw size={13} color="#A0A0A5" />
      </motion.div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: '#242428', display: 'flex', justifyContent: 'center', alignItems: 'center',
          overflow: 'hidden', border: '1px solid #333', flexShrink: 0,
        }}>
          {activeLogoUrl ? (
            <img
              src={activeLogoUrl}
              alt={stock.symbol}
              style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'contain' }}
              onError={() => setLogoIndex(i => i + 1)}
            />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color: color }}>{stock.symbol.slice(0, 4)}</span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{stock.symbol}</div>
          <div style={{ fontSize: 11, color: '#8A8A90', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {stock.name} · {stock.exchange}
          </div>
          {stock.sector && (
            <div style={{ fontSize: 10, color: '#6A6A70', marginTop: 2 }}>
              {stock.sector} {stock.industry ? `· ${stock.industry}` : ''}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            ${formatPrice(stock.price)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
            {stock.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {changePrefix}{formatPrice(stock.changeAbs)} ({changePrefix}{Number(stock.change || 0).toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Market state badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: stock.marketState === 'REGULAR' ? '#4ADE80' : '#FF8C00',
        }} />
        <span style={{ fontSize: 9, color: '#8A8A90', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
          {stock.marketState === 'REGULAR' ? 'Market Open / 24h Live' : stock.marketState === 'PRE' ? 'Pre-Market' : stock.marketState === 'POST' ? 'After Hours' : 'Market Closed'}
        </span>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', padding: '8px 0', marginTop: 6 }}>
        <Sparkline data={stock.sparkline} color={color} width={300} height={54} />
      </div>

      {/* Stats grid */}
      <div style={{ width: '100%', borderTop: '1px solid #2A2A2E', paddingTop: 6, marginTop: 4 }}>
        {statRow('Day High', stock.high ? `$${formatPrice(stock.high)}` : '-')}
        {statRow('Day Low', stock.low ? `$${formatPrice(stock.low)}` : '-')}
        {statRow('Volume', formatVolume(stock.volume))}
        {statRow('Market Cap', stock.marketCap || '-')}
        {statRow('52W High', stock.fiftyTwoWeekHigh ? `$${formatPrice(stock.fiftyTwoWeekHigh)}` : '-')}
        {statRow('52W Low', stock.fiftyTwoWeekLow ? `$${formatPrice(stock.fiftyTwoWeekLow)}` : '-')}
      </div>
    </div>
  );
}

export const stocksPillMeta = { name: 'Stocks', height: 64, keywords: ['stock', 'price', 'market', 'ticker', 'bitcoin', 'btc', 'crypto', 'ethereum', 'eth', 'aapl', 'tsla', 'googl', 'msft', 'amzn', 'nvda', 'meta', 'shares', 'portfolio'] };
