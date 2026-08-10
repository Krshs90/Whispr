import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
import { PillLayout } from './PillLayout';

export function TimerPill({ data }: { data?: any }) {
  const [initialSeconds, setInitialSeconds] = useState(data?.seconds || 300);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => setSeconds(s => s - 1), 1000);
    } else if (seconds === 0) {
      setIsActive(false);
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, seconds]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => { setIsActive(false); setSeconds(initialSeconds); };
  
  const adjustTime = (amount: number) => {
    if (isActive) return;
    const newTime = Math.max(0, initialSeconds + amount);
    setInitialSeconds(newTime);
    setSeconds(newTime);
  };

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = initialSeconds > 0 ? 1 - (seconds / initialSeconds) : 0;

  return (
    <div style={{
      width: '100%',
      background: '#1C1C1E',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 14,
      boxSizing: 'border-box', borderRadius: 16,
    }}>
      {/* Top Row: Timer Display */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 36, height: 36 }}>
            <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={18} cy={18} r={15} stroke="#2A2A2A" strokeWidth={3} fill="none" />
              <motion.circle cx={18} cy={18} r={15} stroke="#FF9500" strokeWidth={3} fill="none" 
                strokeDasharray={94.2} 
                animate={{ strokeDashoffset: 94.2 * (1 - progress) }} 
                strokeLinecap="round" 
              />
            </svg>
            <Timer size={14} color="#FF9500" style={{ position: 'absolute', top: 11, left: 11 }} />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={toggle} style={{
            background: isActive ? '#FF950033' : '#FF9500', 
            color: isActive ? '#FF9500' : '#111',
            border: 'none', borderRadius: 20, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>
          <button onClick={reset} style={{
            background: '#2A2A2A', color: '#A0A0A5',
            border: 'none', borderRadius: 20, width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Adjust Row */}
      {!isActive && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', borderTop: '1px solid #2A2A2A', paddingTop: 14 }}>
          <button onClick={() => adjustTime(-60)} style={{ background: '#252527', color: '#A0A0A5', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Minus size={10} /> 1m
          </button>
          <button onClick={() => adjustTime(60)} style={{ background: '#252527', color: '#A0A0A5', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={10} /> 1m
          </button>
          <button onClick={() => adjustTime(300)} style={{ background: '#252527', color: '#A0A0A5', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={10} /> 5m
          </button>
        </div>
      )}
    </div>
  );
}
export const timerPillMeta = { name: 'Timer', height: 120, keywords: ['timer', 'set timer', 'countdown'] };
