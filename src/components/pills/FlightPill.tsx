import { Plane, AlertCircle } from 'lucide-react';

export function FlightPill() {
  return (
    <div style={{
      width: '100%',
      background: '#1C1C1E',
      padding: '16px 18px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxSizing: 'border-box', borderRadius: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: '#FF950018', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plane size={15} color="#FF9500" />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5EB', marginBottom: 4 }}>
          Flight Tracking
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
          <AlertCircle size={11} color="#FF8C00" />
          <span style={{ fontSize: 11, color: '#FF8C00', fontWeight: 600 }}>Not yet supported</span>
        </div>
        <div style={{ fontSize: 11, color: '#6A6A70', lineHeight: 1.5 }}>
          Real-time flight status (FlightAware / AeroAPI) is coming in a future update.
          Try asking Whispr to search for your flight instead.
        </div>
      </div>
    </div>
  );
}

export const flightPillMeta = { name: 'Flight', height: 100, keywords: ['flight', 'track flight', 'airline'] };

