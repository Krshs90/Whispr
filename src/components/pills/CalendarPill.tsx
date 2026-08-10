import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';

export function CalendarPill() {
  const [now, setNow] = useState(new Date());

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  // Day grid for the current month
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const today = now.getDate();

  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div style={{
      width: '100%',
      background: '#1A1A1A',
      padding: '16px 18px 18px',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      borderRadius: 16,
    }}>
      {/* Header: date + time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: '#6A6A70', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dayName}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F5F5EB' }}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6A6A70', fontSize: 12 }}>
          <Clock size={12} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
        </div>
      </div>

      {/* Mini calendar grid */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
          {DOW.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 9, color: '#555', fontWeight: 700, padding: '2px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 11,
              borderRadius: 6, padding: '4px 2px',
              background: day === today ? '#4ADE80' : 'transparent',
              color: day === today ? '#111' : day ? '#A0A0A5' : 'transparent',
              fontWeight: day === today ? 700 : 400,
            }}>
              {day ?? ''}
            </div>
          ))}
        </div>
      </div>

      {/* Honest empty state */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 8,
        background: '#22222A', borderRadius: 10, padding: '10px 12px',
      }}>
        <AlertCircle size={14} color="#FF8C00" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#FF8C00', marginBottom: 2 }}>Calendar not connected</div>
          <div style={{ fontSize: 10, color: '#6A6A70', lineHeight: 1.5 }}>
            Google Calendar / iCal sync is coming in a future update. Your events will appear here once connected.
          </div>
        </div>
      </div>
    </div>
  );
}

export const calendarPillMeta = { name: 'Calendar', height: 360, keywords: ['calendar', 'schedule', 'events'] };

