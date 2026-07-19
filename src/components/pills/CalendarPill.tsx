import { Calendar as CalendarIcon, Clock } from 'lucide-react';

export function CalendarPill() {
  const events = [
    { title: 'Project Sync', time: '10:00 AM', color: '#4ADE80' },
    { title: 'Lunch w/ Team', time: '12:30 PM', color: '#6A6A70' },
    { title: 'Design Review', time: '3:00 PM', color: '#3178C6' }
  ];

  return (
    <div style={{
      width: '100%',
      background: '#1A1A1A',
      padding: '20px',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      borderRadius: 16, border: '1px solid #2A2A2A',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#4ADE8022', display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexShrink: 0,
        }}>
          <CalendarIcon size={16} color="#4ADE80" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Schedule
        </span>
      </div>

      <div style={{ borderLeft: '2px solid #2A2A2A', paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: ev.color }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFEB' }}>{ev.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6A6A70', fontSize: 11, paddingLeft: 14 }}>
              <Clock size={10} />
              <span>{ev.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 11, color: '#555', textAlign: 'center' }}>
        Live connecting in development
      </div>
    </div>
  );
}

export const calendarPillMeta = { name: 'Calendar', height: 260, keywords: ['calendar', 'schedule', 'events'] };
