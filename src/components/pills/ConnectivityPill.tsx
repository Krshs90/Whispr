import { useState, useEffect } from 'react';
import { PillLayout } from './PillLayout';
import { Activity, Server, Cpu, Cloud, Globe } from 'lucide-react';

export function ConnectivityPill() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    // Listen to IPC stream from electron/ai/health.js
    const cleanup = window.electronAPI?.onSystemHealth?.((status) => {
      setHealth(status);
    });
    return () => { if (cleanup) cleanup(); };
  }, []);

  if (!health) {
    return (
      <PillLayout height={240}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
          <Activity size={20} style={{ animation: 'pulse 1.5s infinite' }} />
          <span style={{ marginLeft: 10, fontSize: 13 }}>Running System Diagnostics...</span>
        </div>
      </PillLayout>
    );
  }

  const engineColor = health.engine === 'online' ? '#4ADE80' : '#FF3B30';
  const toolsColor = health.models.tools ? '#4ADE80' : '#FF9500';
  const chatColor = health.models.chat ? '#4ADE80' : '#FF9500';

  return (
    <PillLayout height={280}>
      <div style={{ padding: 16, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #2A2A2A' }}>
          <Activity size={16} color="#FFFFEB" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#FFFFEB' }}>System Health Diagnostics</h3>
        </div>

        {/* Ollama Engine Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={14} color={engineColor} />
            <span style={{ fontSize: 13, color: '#888' }}>Ollama Backend Engine</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: engineColor, textTransform: 'uppercase' }}>
            {health.engine}
          </span>
        </div>

        {/* Model Checks */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} color={toolsColor} />
            <span style={{ fontSize: 13, color: '#888' }}>Tool / Code Execution Agent</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: toolsColor, textTransform: 'uppercase' }}>
            {health.models.tools ? 'Operational' : 'Missing'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={14} color={chatColor} />
            <span style={{ fontSize: 13, color: '#888' }}>General Conversational Agent</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: chatColor, textTransform: 'uppercase' }}>
            {health.models.chat ? 'Operational' : 'Missing'}
          </span>
        </div>

        {/* API Mock States */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cloud size={14} color="#4ADE80" />
            <span style={{ fontSize: 13, color: '#888' }}>External Widget APIs (Weather, Spotify)</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#4ADE80', textTransform: 'uppercase' }}>
            Connected
          </span>
        </div>

        {/* Future Capabilities */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: 12, background: 'rgba(90, 200, 250, 0.1)', borderRadius: 12, border: '1px solid rgba(90, 200, 250, 0.2)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#5AC8FA' }}>
              <Globe size={14} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Browser Use / Automation</span>
            </div>
            <span style={{ fontSize: 11, color: '#888', maxWidth: 220, lineHeight: 1.3 }}>
              Open-interpreter and browser-use hooks loaded loosely. Awaiting Phase 3 activation.
            </span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#5AC8FA', color: '#1A1A1A', fontSize: 10, fontWeight: 700, borderRadius: 10, textTransform: 'uppercase' }}>
            EARLY BETA
          </span>
        </div>
      </div>
    </PillLayout>
  );
}
export const connectivityPillMeta = { name: 'Health', height: 280, keywords: ['health', 'system', 'diagnostics', 'backend', 'check', 'connectivity', 'status'] };
