import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PillLayout } from './PillLayout';

export function RecordingPill() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;

  return (
    <PillLayout height={56}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
        <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF3B30', flexShrink: 0 }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>
          {mins}:{s.toString().padStart(2, '0')}
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} animate={{ height: [4, 12 + Math.random() * 10, 4] }} transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, delay: i * 0.08 }} style={{ width: 2, background: '#FF3B30', borderRadius: 1, minHeight: 3 }} />
          ))}
        </div>
      </div>
    </PillLayout>
  );
}
export const recordingPillMeta = { name: 'Recording', height: 56, keywords: ['record', 'audio', 'voice'] };
