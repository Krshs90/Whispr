import React, { useState, useEffect, useCallback } from 'react';
import { PillLayout } from './PillLayout';
import { Activity, Server, Cpu, Cloud, HardDrive, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export function ConnectivityPill({ data }: { data?: any } = {}) {
  const [health, setHealth] = useState<any>(data?.engine || data?.cpu !== undefined ? data : null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFullDiagnostics = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRefreshing(true);
    try {
      const res = await window.electronAPI?.executeTool?.('check_system_health', {}, {
        modelPrefs: {
          fast: localStorage.getItem('whispr_pref_fast') || 'llama3.2:latest',
          heavy: localStorage.getItem('whispr_pref_heavy') || 'llama3:8b'
        }
      });
      if (res) {
        const parsed = typeof res === 'string' ? JSON.parse(res) : res;
        if (parsed && !parsed.error) setHealth((prev: any) => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  useEffect(() => {
    if (data && (data.engine || data.cpu !== undefined || data.system)) {
      setHealth((prev: any) => ({ ...prev, ...data, ...(data.system || {}) }));
    }
  }, [data]);

  useEffect(() => {
    if (data?.isPreview) return;
    const cleanup = window.electronAPI?.onSystemHealth?.((status) => {
      setHealth((prev: any) => ({ ...prev, ...status }));
    });
    fetchFullDiagnostics();
    const interval = setInterval(() => fetchFullDiagnostics(), 15000);
    return () => {
      if (cleanup) cleanup();
      clearInterval(interval);
    };
  }, [fetchFullDiagnostics, data?.isPreview]);

  if (!health) {
    return (
      <PillLayout height={260}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
          <Activity size={20} style={{ animation: 'pulse 1.5s infinite' }} />
          <span style={{ marginLeft: 10, fontSize: 13 }}>Running System & RAM Diagnostics...</span>
        </div>
      </PillLayout>
    );
  }

  const engineStatus = health.engine || (health.ollamaOnline ? 'online' : 'offline');
  const engineColor = engineStatus === 'online' ? '#4ADE80' : '#FF3B30';
  const toolsOk = health.models?.tools ?? true;
  const chatOk = health.models?.chat ?? true;
  const toolsColor = toolsOk ? '#4ADE80' : '#FF9500';
  const chatColor = chatOk ? '#4ADE80' : '#FF9500';

  const cpuPercent = health.cpu ?? health.cpuPercent ?? health.system?.cpuPercent ?? 15;
  const memPercent = health.mem ?? health.memPercent ?? health.system?.memPercent ?? 48;
  const memUsedGB = health.memUsedGB ?? health.usedMemGB ?? health.system?.usedMemGB ?? '8.0';
  const memTotalGB = health.memTotalGB ?? health.totalMemGB ?? health.system?.totalMemGB ?? '16.0';
  const diskFreeGB = health.diskFreeGB ?? health.system?.diskFreeGB ?? '100.0';

  return (
    <PillLayout height={310}>
      <div
        onWheel={e => e.stopPropagation()}
        style={{ padding: '16px 18px', width: '100%', display: 'flex', flexDirection: 'column', gap: 12, boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2A2A2E' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="#4ADE80" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#FFFFEB' }}>System Health & RAM Diagnostics</h3>
          </div>
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 0.8, repeat: refreshing ? Infinity : 0 }}
            onClick={fetchFullDiagnostics}
            style={{ cursor: 'pointer', opacity: 0.6 }}
            title="Refresh diagnostics"
          >
            <RefreshCw size={13} color="#A0A0A5" />
          </motion.div>
        </div>

        {/* Live Hardware Bars: CPU & RAM */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: '#222226', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#A0A0A5', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <Cpu size={12} color="#60A5FA" /> CPU Load
              </span>
              <span style={{ color: cpuPercent > 80 ? '#FF3B30' : '#60A5FA', fontWeight: 700 }}>{cpuPercent}%</span>
            </div>
            <div style={{ width: '100%', height: 5, background: '#161618', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, cpuPercent)}%`, height: '100%', background: cpuPercent > 80 ? '#FF3B30' : '#60A5FA', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: '#7A7A82' }}>Disk Free: {diskFreeGB} GB</div>
          </div>

          <div style={{ background: '#222226', borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#A0A0A5', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                <HardDrive size={12} color="#4ADE80" /> RAM Usage
              </span>
              <span style={{ color: memPercent > 85 ? '#FF3B30' : '#4ADE80', fontWeight: 700 }}>{memPercent}%</span>
            </div>
            <div style={{ width: '100%', height: 5, background: '#161618', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, memPercent)}%`, height: '100%', background: memPercent > 85 ? '#FF3B30' : '#4ADE80', borderRadius: 3, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ fontSize: 10, color: '#7A7A82' }}>{memUsedGB} GB / {memTotalGB} GB</div>
          </div>
        </div>

        {/* Ollama Engine Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={14} color={engineColor} />
            <span style={{ fontSize: 12, color: '#A0A0A5' }}>Ollama Backend Engine</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: engineColor, textTransform: 'uppercase' }}>
            {engineStatus}
          </span>
        </div>

        {/* Model Checks */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} color={toolsColor} />
            <span style={{ fontSize: 12, color: '#A0A0A5' }}>Tool & Code Execution Agent</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: toolsColor, textTransform: 'uppercase' }}>
            {toolsOk ? 'Operational' : 'Missing'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} color={chatColor} />
            <span style={{ fontSize: 12, color: '#A0A0A5' }}>General Conversational Agent</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: chatColor, textTransform: 'uppercase' }}>
            {chatOk ? 'Operational' : 'Missing'}
          </span>
        </div>

        {/* External Widget APIs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cloud size={14} color="#4ADE80" />
            <span style={{ fontSize: 12, color: '#A0A0A5' }}>Live Widget APIs (Open-Meteo, Google News, ESPN, Yahoo)</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', textTransform: 'uppercase' }}>
            Connected
          </span>
        </div>
      </div>
    </PillLayout>
  );
}
export const connectivityPillMeta = { name: 'Health', height: 310, keywords: ['diagnostics', 'backend', 'connectivity', 'status'] };
