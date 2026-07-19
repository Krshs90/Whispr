import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer } from 'lucide-react';
import { PillLayout } from './PillLayout';

export function TimerPill() {
  const [seconds, setSeconds] = useState(187);
  useEffect(() => {
    const interval = setInterval(() => setSeconds(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(interval);
  }, []);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = 1 - (seconds / 300);

  return (
    <PillLayout height={60}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
        <div style={{ position: 'relative', width: 32, height: 32 }}>
          <svg width={32} height={32} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={16} cy={16} r={13} stroke="#2A2A2A" strokeWidth={3} fill="none" />
            <motion.circle cx={16} cy={16} r={13} stroke="#FF9500" strokeWidth={3} fill="none" strokeDasharray={81.68} animate={{ strokeDashoffset: 81.68 * (1 - progress) }} strokeLinecap="round" />
          </svg>
          <Timer size={12} color="#FF9500" style={{ position: 'absolute', top: 10, left: 10 }} />
        </div>
        <span style={{ fontSize: 22, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {mins}:{secs.toString().padStart(2, '0')}
        </span>
      </div>
    </PillLayout>
  );
}
export const timerPillMeta = { name: 'Timer', height: 60, keywords: ['timer', 'set timer', 'countdown'] };
