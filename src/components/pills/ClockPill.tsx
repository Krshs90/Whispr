import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { PillLayout } from './PillLayout';

export function ClockPill() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <PillLayout height={56}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
        <Clock size={18} color="#FFFFEB" style={{ opacity: 0.6 }} />
        <span style={{ fontSize: 22, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </span>
      </div>
    </PillLayout>
  );
}
export const clockPillMeta = { name: 'Clock', height: 56, keywords: ['time', 'clock'] };
