import React, { useEffect } from 'react';
import { Send, LayoutGrid } from 'lucide-react';
import { useIslandState } from '../../context/IslandContext';
import type { ChatMessage } from '../../lib/types';

export function IslandInput() {
  const {
    phase,
    setPhase,
    query,
    setQuery,
    activeChatId,
    setActiveChatId,
    activeChatIdRef,
    updateSessions,
    sessions,
    inputRef,
    dismiss,
    activeView
  } = useIslandState();

  const activeSession = sessions.find(s => s.id === activeChatId);

  // Auto-focus input
  useEffect(() => {
    if (phase === 'dynamic' && activeView === '-1') {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [phase, activeView, inputRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setPhase('processing');
    localStorage.setItem('whispr_is_processing', 'true');
    const q = query.trim();
    setQuery('');

    let sid: string;
    let oldMsgs: ChatMessage[] = [];

    // Always create a fresh session for new queries from the core bar
    sid = Date.now().toString();
    setActiveChatId(sid);
    activeChatIdRef.current = sid;
    localStorage.setItem('whispr_active_chat', sid);
    updateSessions((prev: any) => [{ id: sid, title: q.slice(0, 40), messages: [], updatedAt: new Date().toISOString() }, ...prev]);

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: q, timestamp: new Date().toISOString() };
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date().toISOString() };

    updateSessions((prev: any) =>
      prev.map((s: any) => s.id === sid ? { ...s, messages: [...s.messages, userMsg, aiMsg], updatedAt: new Date().toISOString() } : s)
    );

    window.electronAPI?.chatRequest({
      messages: [...oldMsgs, userMsg].map(m => ({ role: m.role, content: m.content })),
      defaultModel: localStorage.getItem('whispr_ollama_model') || 'llama3.2',
      apiKeys: {
        weather: localStorage.getItem('whispr_api_weather') || '',
        serper: localStorage.getItem('whispr_api_search') || '',
        stocks: localStorage.getItem('whispr_api_stocks') || '',
        spotify: localStorage.getItem('whispr_spotify_playlist') || '',
        modelPrefs: {
          fast: localStorage.getItem('whispr_pref_fast') || 'llama3.2',
          heavy: localStorage.getItem('whispr_pref_heavy') || 'qwen2.5:32b',
          math: localStorage.getItem('whispr_pref_math') || '',
          code: localStorage.getItem('whispr_pref_code') || '',
          history: localStorage.getItem('whispr_pref_history') || '',
          business: localStorage.getItem('whispr_pref_business') || ''
        }
      },
      userData: {
        name: localStorage.getItem('whispr_user_name') || '',
        context: localStorage.getItem('whispr_user_context') || '',
        visionEnabled: localStorage.getItem('whispr_vision_enabled') !== 'false',
        allowedMonitors: localStorage.getItem('whispr_allowed_monitors') || '[]'
      }
    });
  };

  const handleOpenMainApp = () => {
    if (activeChatId) {
      localStorage.setItem('whispr_active_chat', activeChatId);
    }
    dismiss();
    setTimeout(() => {
      window.electronAPI?.openMainApp();
    }, 350);
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
      <button onClick={handleOpenMainApp} title="Open Whispr" style={iconBtnStyle}
        onMouseEnter={e => { e.currentTarget.style.background = '#31312F'; e.currentTarget.style.color = '#FFFFEB'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,235,0.5)'; }}
      >
        <LayoutGrid size={16} />
      </button>
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', flex: 1, height: '100%', marginLeft: 10 }}>
        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Ask Whispr..." style={inputStyle} />
        <button type="submit" style={iconBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = '#31312F'; e.currentTarget.style.color = '#FFFFEB'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,235,0.5)'; }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%', border: '1px solid #3A3A3A',
  background: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center',
  cursor: 'pointer', color: 'rgba(255,255,235,0.5)', flexShrink: 0, transition: 'background 0.2s, color 0.2s',
};

const inputStyle: React.CSSProperties = {
  flex: 1, background: 'transparent', border: 'none', outline: 'none',
  color: '#FFFFEB', fontSize: 16, fontFamily: 'inherit', letterSpacing: '0.01em',
};
