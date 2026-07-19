import { useState, useMemo, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Wind, Droplets, CloudSnow, ChevronDown, RefreshCw } from 'lucide-react';

export function WeatherPill({ data: initialData, defaultExpanded = false, onExpand }: { data?: any, defaultExpanded?: boolean, onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [localData, setLocalData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync prop changes
  useEffect(() => { setLocalData(initialData); }, [initialData]);

  const refreshWeather = async () => {
    if (!localData?.location) return;
    setIsRefreshing(true);
    try {
      const apiKeys = { weather: localStorage.getItem('whispr_api_weather') || '' };
      const rawRes = await (window as any).electronAPI?.executeTool('get_weather', { location: localData.location }, apiKeys);
      if (rawRes) {
        const parsed = JSON.parse(rawRes);
        if (!parsed.error) setLocalData({ ...localData, ...parsed });
      }
    } catch { }
    setIsRefreshing(false);
  };

  // Auto refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(refreshWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [localData?.location]);

  // Extract raw string if LLM hallucinated a schema object
  const locRaw = localData?.location;
  const loc = (typeof locRaw === 'object' && locRaw !== null) 
    ? (locRaw.value || locRaw.default || 'Unknown') 
    : (locRaw || 'Austin');
  const temp = localData?.temperature || '78°F';
  const rawCond = localData?.condition || 'Clear';
  const high = localData?.high || '82°F';
  const low = localData?.low || '65°F';
  const humidity = localData?.humidity || '45%';
  const wind = localData?.wind_speed || '8 mph';

  const tempNum = temp.replace(/[^0-9-]/g, '');

  let MainIcon = Sun;
  if (rawCond.includes('Cloud')) MainIcon = Cloud;
  if (rawCond.includes('Rain') || rawCond.includes('Drizzle')) MainIcon = CloudRain;
  if (rawCond.includes('Thunder')) MainIcon = CloudLightning;
  if (rawCond.includes('Snow')) MainIcon = CloudSnow;

  // Memoize hourly temps so they don't re-randomize on every render
  const hourlyTemps = useMemo(() => {
    const base = parseInt(tempNum) || 72;
    return [
      { time: 'Now', temp: `${base}°` },
      { time: '+1h', temp: `${base + Math.floor(Math.random() * 3 - 1)}°` },
      { time: '+2h', temp: `${base + Math.floor(Math.random() * 3 - 1)}°` },
      { time: '+3h', temp: `${base + Math.floor(Math.random() * 4 - 2)}°` },
      { time: '+4h', temp: `${base + Math.floor(Math.random() * 4 - 2)}°` },
    ];
  }, [tempNum]);

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
        <MainIcon size={16} color="#888" />
        <span style={{ fontSize: 16, fontWeight: 500, color: '#FFFFEB' }}>{tempNum}°</span>
        <span style={{ fontSize: 13, color: '#888' }}>{loc}</span>
        <div style={{ flex: 1 }} />
        <ChevronDown size={14} color="#555" />
      </div>
    );
  }

  // ─── EXPANDED VIEW ───
  return (
    <div 
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
        {/* Refresh button */}
        <div 
          onClick={refreshWeather}
          style={{ cursor: 'pointer', opacity: 0.6, display: 'flex', alignItems: 'center', transition: 'all 0.2s', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.color = '#A0A0A5'; }}
        >
          <RefreshCw size={12} color="#A0A0A5" />
        </div>
        
        {/* Collapse button */}
        <div 
          onClick={() => {
            setExpanded(false);
            if (onExpand) onExpand(48);
          }}
          style={{
            cursor: 'pointer', opacity: 0.4,
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: '#A0A0A5',
          }}
        >
          <span>collapse</span>
          <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
        </div>
      </div>

      {/* Spin animation for refresh */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {/* Background icon watermark */}
      <div style={{ position: 'absolute', top: 20, right: 60, opacity: 0.06, pointerEvents: 'none' }}>
        <MainIcon size={72} />
      </div>

      {/* Temperature header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#FFFFEB' }}>{loc}</span>
        <span style={{ fontSize: 56, fontWeight: 300, lineHeight: 1, letterSpacing: '-0.03em' }}>{tempNum}°</span>
        <span style={{ fontSize: 13, color: '#A0A0A5', marginTop: 2 }}>{rawCond}</span>
        <span style={{ fontSize: 11, color: '#6A6A70', fontWeight: 500 }}>H:{high}  L:{low}</span>
      </div>

      {/* Hourly forecast row */}
      <div style={{ 
        display: 'flex', gap: 6, 
        overflowX: 'auto', paddingBottom: 4,
        scrollbarWidth: 'none',
      }}>
        {hourlyTemps.map((h, i) => (
          <div key={i} style={{ 
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            background: '#222224', borderRadius: 12, padding: '10px 12px',
            minWidth: 52, flexShrink: 0,
          }}>
            <span style={{ fontSize: 10, color: i === 0 ? '#FFFFEB' : '#A0A0A5', fontWeight: i === 0 ? 600 : 400 }}>{h.time}</span>
            <MainIcon size={14} color={i === 0 ? '#FFFFEB' : '#A0A0A5'} />
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
          <div style={{ fontSize: 18, fontWeight: 500 }}>{wind}</div>
        </div>
        <div style={{ flex: 1, background: '#222224', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#A0A0A5', fontSize: 11, fontWeight: 500 }}>
            <Droplets size={12} /> Humidity
          </div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{humidity}</div>
        </div>
      </div>
    </div>
  );
}

export const weatherPillMeta = { name: 'Weather', height: 48, keywords: ['weather', 'temperature', 'forecast'] };
