import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, HardDrive, Server, RefreshCw, Database } from 'lucide-react';
import { motion } from 'framer-motion';

export function SystemPill({ data, defaultExpanded: _defaultExpanded = false }: { data?: any; defaultExpanded?: boolean }) {
  const [sysData, setSysData] = useState<any>(data?.system || data || null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (data?.system || data?.cpu !== undefined || data?.mem !== undefined) {
      setSysData(data.system || data);
    }
  }, [data]);

  const fetchStats = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRefreshing(true);
    try {
      const resStr = await window.electronAPI?.executeTool?.('get_system_stats', {}, {});
      if (resStr) {
        const parsed = typeof resStr === 'string' ? JSON.parse(resStr) : resStr;
        if (parsed && !parsed.error) setSysData(parsed.system || parsed);
      }
    } catch { /* ignore */ }
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  useEffect(() => {
    if (data?.isPreview) return;
    if (!data || (data.cpuPercent === undefined && data.cpu === undefined && !data.system)) {
      fetchStats();
    }
    const interval = setInterval(() => fetchStats(), 15000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchStats]);

  const cpuPercent = sysData?.cpuPercent ?? sysData?.cpu ?? 18;
  const cpuCores = sysData?.cpuCores ?? sysData?.cores ?? 8;
  const cpuModel = sysData?.cpuModel ?? 'System Processor';
  const memPercent = sysData?.memPercent ?? sysData?.mem ?? 50;
  const usedMemGB = sysData?.usedMemGB ?? sysData?.memUsedGB ?? '8.0';
  const totalMemGB = sysData?.totalMemGB ?? sysData?.memTotalGB ?? '16.0';
  const diskFreeGB = sysData?.diskFreeGB ?? '120.0';
  const uptimeHours = sysData?.uptimeHours ?? sysData?.uptime ?? '4.0h';
  const ollamaOnline = sysData?.ollamaOnline ?? (sysData?.engine ? sysData.engine === 'online' : true);

  return (
    <div
      onWheel={e => e.stopPropagation()}
      style={{
        width: '100%',
        background: '#18181A',
        padding: '18px 20px',
        display: 'flex', flexDirection: 'column',
        boxSizing: 'border-box', color: '#FFFFEB',
        borderRadius: 16, border: '1px solid #2A2A2E',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: '#4ADE8022', display: 'flex', justifyContent: 'center', alignItems: 'center',
            flexShrink: 0,
          }}>
            <Activity size={16} color="#4ADE80" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFEB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            System & RAM Monitor
          </span>
        </div>

        <motion.div
          animate={refreshing ? { rotate: 360 } : {}}
          transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0 }}
          onClick={fetchStats}
          style={{ cursor: 'pointer', opacity: 0.6 }}
          title="Refresh system stats"
        >
          <RefreshCw size={13} color="#A0A0A5" />
        </motion.div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* CPU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cpu size={20} color="#60A5FA" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>CPU Load ({cpuCores} Cores)</span>
              <span style={{
                color: cpuPercent > 80 ? '#FF3B30' : cpuPercent > 55 ? '#FF9500' : '#4ADE80',
                fontWeight: 700, fontVariantNumeric: 'tabular-nums'
              }}>
                {cpuPercent}%
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#26262A', borderRadius: 3, overflow: 'hidden', marginBottom: 3 }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, cpuPercent)}%` }}
                style={{ height: '100%', background: cpuPercent > 80 ? '#FF3B30' : cpuPercent > 55 ? '#FF9500' : '#60A5FA', borderRadius: 3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div style={{ fontSize: 10, color: '#8A8A90', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cpuModel}
            </div>
          </div>
        </div>

        {/* RAM / Memory Usage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HardDrive size={20} color="#4ADE80" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>RAM Usage</span>
              <span style={{ color: memPercent > 85 ? '#FF3B30' : '#4ADE80', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {usedMemGB} GB / {totalMemGB} GB ({memPercent}%)
              </span>
            </div>
            <div style={{ width: '100%', height: 6, background: '#26262A', borderRadius: 3, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, memPercent)}%` }}
                style={{ height: '100%', background: memPercent > 85 ? '#FF3B30' : '#4ADE80', borderRadius: 3 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        {/* Disk & Uptime & Ollama Row */}
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <div style={{ flex: 1, background: '#222226', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={14} color="#A855F7" />
            <div>
              <div style={{ fontSize: 9, color: '#8A8A90', textTransform: 'uppercase' }}>Free Disk</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{diskFreeGB} GB</div>
            </div>
          </div>
          <div style={{ flex: 1, background: '#222226', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={14} color={ollamaOnline ? '#4ADE80' : '#FF3B30'} />
            <div>
              <div style={{ fontSize: 9, color: '#8A8A90', textTransform: 'uppercase' }}>AI Engine</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ollamaOnline ? '#4ADE80' : '#FF3B30' }}>
                {ollamaOnline ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, background: '#222226', borderRadius: 10, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color="#F59E0B" />
            <div>
              <div style={{ fontSize: 9, color: '#8A8A90', textTransform: 'uppercase' }}>Uptime</div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{String(uptimeHours).replace(/h$/, '')}h</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const systemPillMeta = { name: 'System', height: 260, keywords: ['system', 'cpu', 'memory', 'ram', 'stats', 'hardware'] };
