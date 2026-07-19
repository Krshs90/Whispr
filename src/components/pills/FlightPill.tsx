import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { PillLayout } from './PillLayout';

export function FlightPill() {
  return (
    <PillLayout height={80}>
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plane size={14} color="#FF9500" />
            <span style={{ fontSize: 11, color: '#FF9500', fontWeight: 600 }}>AA 1001</span>
            <span style={{ marginLeft: 6, fontSize: 8, background: '#FF950020', color: '#FF9500', padding: '2px 6px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>Coming Soon</span>
          </div>
          <span style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600 }}>On Time</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFEB' }}>SFO</div>
            <div style={{ fontSize: 10, color: '#888' }}>10:26 AM</div>
          </div>
          <div style={{ flex: 1, margin: '0 12px', position: 'relative', height: 2 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#2A2A2A', borderRadius: 1 }} />
            <motion.div animate={{ left: ['20%', '65%'] }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: -4, width: 10, height: 10 }}>
              <Plane size={10} color="#FFFFEB" style={{ transform: 'rotate(90deg)' }} />
            </motion.div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFEB' }}>JFK</div>
            <div style={{ fontSize: 10, color: '#888' }}>4:45 PM</div>
          </div>
        </div>
      </div>
    </PillLayout>
  );
}
export const flightPillMeta = { name: 'Flight', height: 80, keywords: ['flight', 'track flight', 'airline'] };
