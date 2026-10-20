import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Droplets, CloudSnow, ChevronDown, RefreshCw } from 'lucide-react';

export function WeatherPill({ data: initialData, defaultExpanded = false, onExpand }: { data?: any, defaultExpanded?: boolean, onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [localData, setLocalData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync prop changes
  useEffect(() => {
    if (initialData) setLocalData(initialData);
  }, [initialData]);

  const refreshWeather = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetLoc = localData?.location || 'Chicago';
    setIsRefreshing(true);
    try {
      const apiKeys = { weather: localStorage.getItem('whispr_api_weather') || '' };
      const rawRes = await window.electronAPI?.executeTool('get_weather', { location: targetLoc }, apiKeys);
      if (rawRes) {
        const parsed = typeof rawRes === 'string' ? JSON.parse(rawRes) : rawRes;
        if (!parsed.error) setLocalData((prev: any) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
    setIsRefreshing(false);
  }, [localData?.location]);

  // Auto refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => refreshWeather(), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshWeather]);

  const locRaw = localData?.location;
  const loc = (typeof locRaw === 'object' && locRaw !== null) 
    ? (locRaw.value || locRaw.default || 'Unknown') 
    : (locRaw || 'Chicago');
  const temp = localData?.temperature || '72°F';
  const rawCond = localData?.condition || 'Clear';
  const high = localData?.high || '76°F';
  const low = localData?.low || '60°F';
  const humidity = localData?.humidity || '45%';
  const wind = localData?.wind || localData?.wind_speed || '8 mph';

  const tempNum = String(temp).replace(/[^0-9-]/g, '') || '72';

  let MainIcon = Sun;
  if (rawCond.includes('Cloud') || rawCond.includes('Overcast') || rawCond.includes('Fog')) MainIcon = Cloud;
  if (rawCond.includes('Rain') || rawCond.includes('Drizzle') || rawCond.includes('Shower')) MainIcon = CloudRain;
  if (rawCond.includes('Thunder')) MainIcon = CloudLightning;
  if (rawCond.includes('Snow')) MainIcon = CloudSnow;

  // Use real Open-Meteo hourly forecast when present, fallback to deterministic curve
  const hourlyTemps = useMemo(() => {
    if (Array.isArray(localData?.hourly) && localData.hourly.length > 0) {
      return localData.hourly;
    }
    const base = parseInt(tempNum) || 72;
    return [
      { time: 'Now', temp: `${base}°` },
      { time: '+1h', temp: `${base + 1}°` },
      { time: '+2h', temp: `${base + 2}°` },
      { time: '+3h', temp: `${base + 1}°` },
      { time: '+4h', temp: `${base - 1}°` },
    ];
  }, [localData?.hourly, tempNum]);

  // ─── COMPACT VIEW ───
  if (!expanded) {
    return (
      <div 
        onClick={() => {
          setExpanded(true);
          if (onExpand) onExpand(340);
        }}
        style={{
          width: '100%', height: 48,
          background: '#1A1A1A',
          padding: '0 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
      >
        <MainIcon size={16} color="#FBBF24" />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFEB' }}>{tempNum}°F</span>
        <span style={{ fontSize: 13, color: '#A0A0A5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc}</span>
        <span style={{ fontSize: 11, color: '#6A6A70', marginLeft: 4 }}>{rawCond}</span>
        <div style={{ flex: 1 }} />
        <ChevronDown size={14} color="#555" />
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  return (
    <div 
      onWheel={e => e.stopPropagation()}
      style={{
        width: '100%', minHeight: 340,
        background: '#18181A',
        padding: '20px 22px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
        boxSizing: 'border-box',
        position: 'relative',
        color: '#FFFFEB',
        overflow: 'visible',
      }}
    >
      {/* Actions container top-right */}
      <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', alignItems: 'center', gap: 12, zIndex: 2 }}>
        <div 
          onClick={refreshWeather}
          style={{ cursor: 'pointer', opacity: 0.6, display: 'flex', alignItems: 'center', transition: 'all 0.2s', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
          title="Refresh weather"
        >
          <RefreshCw size={12} color="#A0A0A5" />
        </div>
        
        {!defaultExpanded && (
          <div 
            onClick={() => {
              setExpanded(false);
              if (onExpand) onExpand(48);
            }}
            style={{
              cursor: 'pointer', opacity: 0.5,
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10, color: '#A0A0A5',
            }}
          >
            <span>collapse</span>
            <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
          </div>
        )}
      </div>

      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>

      {/* Background icon watermark */}
      <div style={{ position: 'absolute', top: 20, right: 56, opacity: 0.07, pointerEvents: 'none' }}>
        <MainIcon size={76} />
      </div>

      {/* Temperature header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFEB' }}>{loc}</span>
        <span style={{ fontSize: 54, fontWeight: 300, lineHeight: 1.05, letterSpacing: '-0.03em' }}>{tempNum}°F</span>
        <span style={{ fontSize: 13, color: '#A0A0A5', marginTop: 2 }}>{rawCond}</span>
        <span style={{ fontSize: 11, color: '#6A6A70', fontWeight: 500 }}>H: {high}  ·  L: {low}</span>
      </div>

      {/* Hourly forecast row */}
      <div style={{ 
        display: 'flex', gap: 6, 
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {hourlyTemps.map((h: any, i: number) => (
          <div key={i} style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: '#222224', borderRadius: 12, padding: '10px 12px',
            minWidth: 52, flexShrink: 0,
            border: i === 0 ? '1px solid rgba(255,255,235,0.12)' : '1px solid transparent'
          }}>
            <span style={{ fontSize: 10, color: i === 0 ? '#FFFFEB' : '#A0A0A5', fontWeight: i === 0 ? 600 : 400 }}>{h.time}</span>
            <MainIcon size={14} color={i === 0 ? '#FBBF24' : '#A0A0A5'} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{h.temp}</span>
          </div>
        ))}
      </div>

      {/* Wind & Humidity blocks */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: '#222224', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#A0A0A5', fontSize: 11, fontWeight: 500 }}>
            <Wind size={12} /> Wind
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{wind}</div>
        </div>
        <div style={{ flex: 1, background: '#222224', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#A0A0A5', fontSize: 11, fontWeight: 500 }}>
            <Droplets size={12} /> Humidity
          </div>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{humidity}</div>
        </div>
      </div>
    </div>
  );
}

export const weatherPillMeta = { name: 'Weather', height: 48, keywords: ['weather', 'temperature', 'forecast'] };
