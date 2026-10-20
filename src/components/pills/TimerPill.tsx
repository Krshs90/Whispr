import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Plus, BellRing } from 'lucide-react';

const PRESETS = [
  { label: '30s', secs: 30 },
  { label: '1m', secs: 60 },
  { label: '3m', secs: 180 },
  { label: '5m', secs: 300 },
  { label: '10m', secs: 600 },
  { label: '25m', secs: 1500 },
];

export function TimerPill({ data }: { data?: any }) {
  const incomingSeconds = Number(data?.seconds) > 0 ? Number(data.seconds) : 300;
  const [initialSeconds, setInitialSeconds] = useState<number>(incomingSeconds);
  const [seconds, setSeconds] = useState<number>(incomingSeconds);
  const [isActive, setIsActive] = useState<boolean>(() => Boolean(data?.seconds || data?.autoStart));

  // Sync whenever AI sets a new timer duration (e.g., "Set a timer for 1 minute")
  useEffect(() => {
    if (data?.seconds && Number(data.seconds) > 0) {
      const targetSecs = Number(data.seconds);
      setInitialSeconds(targetSecs);
      setSeconds(targetSecs);
      if (data.autoStart !== false) {
        setIsActive(true);
      }
    }
  }, [data?.seconds, data?.autoStart]);

  useEffect(() => {
    if (!isActive || seconds <= 0) {
      if (seconds <= 0 && isActive) setIsActive(false);
      return;
    }
    const interval = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) {
          setIsActive(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggle = () => {
    if (seconds === 0) {
      setSeconds(initialSeconds);
      setIsActive(true);
    } else {
      setIsActive(prev => !prev);
    }
  };

  const reset = () => {
    setIsActive(false);
    setSeconds(initialSeconds);
  };

  const selectPreset = (secs: number) => {
    setInitialSeconds(secs);
    setSeconds(secs);
    setIsActive(true);
  };

  const addTime = (delta: number) => {
    setSeconds(prev => {
      const next = Math.max(0, prev + delta);
      if (next > initialSeconds) setInitialSeconds(next);
      return next;
    });
  };

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const formattedTime = hrs > 0
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const progress = initialSeconds > 0 ? (initialSeconds - seconds) / initialSeconds : 0;
  const isFinished = seconds === 0 && initialSeconds > 0;
  const ringRadius = 22;
  const circumference = 2 * Math.PI * ringRadius;
  const accentColor = isFinished ? '#4ADE80' : isActive ? '#FF9500' : '#8A8A94';

  return (
    <div style={{
      width: '100%',
      background: 'linear-gradient(145deg, #1E1E22 0%, #161619 100%)',
      padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 14,
      boxSizing: 'border-box', borderRadius: 16,
      border: isFinished ? '1px solid rgba(74, 222, 128, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
    }}>
      {/* Top Row: Ring + Time + Play/Reset */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ position: 'relative', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={52} height={52} style={{ transform: 'rotate(-90deg)' }}>
              <circle cx={26} cy={26} r={ringRadius} stroke="#2A2A30" strokeWidth={4} fill="none" />
              <motion.circle
                cx={26} cy={26} r={ringRadius}
                stroke={accentColor}
                strokeWidth={4}
                fill="none"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isFinished ? <BellRing size={18} color="#4ADE80" /> : <Timer size={18} color={accentColor} />}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{
              fontSize: 30, fontWeight: 700, color: isFinished ? '#4ADE80' : '#FFFFEB',
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', lineHeight: 1.05
            }}>
              {formattedTime}
            </div>
            <div style={{ fontSize: 10, fontWeight: 600, color: accentColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {isFinished ? 'Timer Complete!' : isActive ? 'Running' : 'Paused'}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => addTime(30)}
            title="Add 30 seconds"
            style={{
              background: '#26262B', color: '#CCC', border: '1px solid #34343C',
              borderRadius: 10, padding: '6px 9px', fontSize: 11, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2
            }}
          >
            <Plus size={11} />30s
          </button>

          <button
            onClick={toggle}
            style={{
              background: isActive ? 'rgba(255, 149, 0, 0.18)' : '#FF9500',
              color: isActive ? '#FF9500' : '#111',
              border: isActive ? '1px solid rgba(255, 149, 0, 0.4)' : 'none',
              borderRadius: 12, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={isActive ? 'Pause' : 'Start'}
          >
            {isActive ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
          </button>

          <button
            onClick={reset}
            style={{
              background: '#26262B', color: '#A0A0A5',
              border: '1px solid #34343C', borderRadius: 12, width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
            title="Reset timer"
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>

      {/* Bottom Row: Quick Duration Presets */}
      <div style={{
        display: 'flex', gap: 6, justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12
      }}>
        {PRESETS.map(p => {
          const isSelected = initialSeconds === p.secs;
          return (
            <button
              key={p.label}
              onClick={() => selectPreset(p.secs)}
              style={{
                flex: 1,
                background: isSelected ? 'rgba(255, 149, 0, 0.2)' : '#232328',
                color: isSelected ? '#FF9500' : '#A0A0A5',
                border: isSelected ? '1px solid rgba(255, 149, 0, 0.45)' : '1px solid #2E2E34',
                borderRadius: 8, padding: '5px 0', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s ease'
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export const timerPillMeta = { name: 'Timer', height: 138, keywords: ['timer', 'set timer', 'countdown'] };
