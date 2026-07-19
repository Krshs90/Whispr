import { MapPin, Navigation } from 'lucide-react';
import { PillLayout } from './PillLayout';

export function DirectionsPill() {
  return (
    <PillLayout height={64}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={14} color="#5AC8FA" style={{ transform: 'rotate(45deg)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Turn right on 5th Ave</span>
          </div>
          <span style={{ fontSize: 8, background: '#5AC8FA20', color: '#5AC8FA', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>Coming Soon</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={10} color="#888" />
            <span style={{ fontSize: 10, color: '#888' }}>0.3 mi · 2 min</span>
          </div>
          <span style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600 }}>Arrive 10:04 AM</span>
        </div>
      </div>
    </PillLayout>
  );
}
export const directionsPillMeta = { name: 'Directions', height: 64, keywords: ['directions', 'navigate', 'map', 'maps'] };
