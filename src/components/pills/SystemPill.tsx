import { Activity, Cpu, HardDrive, Server } from 'lucide-react';
import { motion } from 'framer-motion';

export function SystemPill({ data, defaultExpanded: _defaultExpanded = false }: { data?: any; defaultExpanded?: boolean }) {
  const sys = data?.system || {
    platform: 'win32', arch: 'x64',
    cpuCores: 8, cpuModel: 'Intel Core i9',
    totalMemGB: 32, usedMemGB: 16, freeMemGB: 16, memPercent: 50,
    uptimeHours: 12.5
  };

  return (
    <div style={{
      width: '100%',
      background: '#1A1A1A',
      padding: '20px',
      display: 'flex', flexDirection: 'column',
      boxSizing: 'border-box', color: '#FFFFEB',
      borderRadius: 16, border: '1px solid #2A2A2A',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: '#4ADE8022', display: 'flex', justifyContent: 'center', alignItems: 'center',
          flexShrink: 0,
        }}>
          <Activity size={16} color="#4ADE80" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          System Monitor
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* CPU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cpu size={24} color="#6A6A70" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>CPU ({sys.cpuCores} Cores)</span>
              <span style={{ color: '#4ADE80', fontVariantNumeric: 'tabular-nums' }}>Active</span>
            </div>
            <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sys.cpuModel}
            </div>
          </div>
        </div>

        {/* Memory */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HardDrive size={24} color="#6A6A70" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>Memory Usage</span>
              <span style={{ color: sys.memPercent > 80 ? '#FF3B30' : '#4ADE80', fontVariantNumeric: 'tabular-nums' }}>
                {sys.memPercent}%
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#2A2A2A', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sys.memPercent}%` }}
                style={{ height: '100%', background: sys.memPercent > 80 ? '#FF3B30' : '#4ADE80', borderRadius: 3 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6A6A70', marginTop: 4 }}>
              <span>{sys.usedMemGB} GB Used</span>
              <span>{sys.totalMemGB} GB Total</span>
            </div>
          </div>
        </div>

        {/* Server stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Server size={24} color="#6A6A70" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>Uptime</span>
              <span style={{ color: '#A0A0A5', fontVariantNumeric: 'tabular-nums' }}>{sys.uptimeHours} hrs</span>
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>Platform: {sys.platform} ({sys.arch})</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const systemPillMeta = { name: 'System', height: 260, keywords: ['system', 'cpu', 'memory', 'stats', 'health'] };
