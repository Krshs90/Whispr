import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Maximize2, Minimize2, X, Check, Copy, AudioLines, Send, Square } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer';
import { useIslandState } from '../../context/IslandContext';
import { estimateContextMemory } from '../../lib/sessionStore';
import type { ChatMessage } from '../../lib/types';

export function ResponseView() {
  const {
    isExpanded,
    setIsExpanded,
    dismiss,
    activeChatId,
    sessions,
    copiedId,
    setCopiedId,
    isFollowUpLoading,
    elapsed,
    slowWarning,
    setSlowWarning,
    query,
    setQuery,
    setPhase,
    updateSessions,
    activeChatIdRef,
    setActiveChatId,
    setActiveView,
    messagesEndRef,
    inputRef,
    setIsFollowUpLoading
  } = useIslandState();

  const activeSession = sessions.find(s => s.id === activeChatId);
  const memoryTokens = estimateContextMemory(activeSession);
  const maxTokens = 4096;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const isFollowUp = activeChatId !== '';
    
    if (isFollowUp) {
      setPhase('response');
      setIsFollowUpLoading(true);
    } else {
      setPhase('processing');
    }
    
    // We can extract this into a shared hook or utility later, but for now duplicate
    // the logic to keep things moving.
    // ... wait, handleSubmit is complex. I'll just keep it here.
    
    localStorage.setItem('whispr_is_processing', 'true');
    const q = query.trim();
    setQuery('');

    let sid: string;
    let oldMsgs: ChatMessage[] = [];

    if (isFollowUp && activeChatId) {
      sid = activeChatId;
      oldMsgs = activeSession?.messages || [];
      localStorage.setItem('whispr_active_chat', sid);
    } else {
      sid = Date.now().toString();
      setActiveChatId(sid);
      activeChatIdRef.current = sid;
      localStorage.setItem('whispr_active_chat', sid);
      updateSessions((prev: any) => [{ id: sid, title: q.slice(0, 40), messages: [], updatedAt: new Date().toISOString() }, ...prev]);
    }

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
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      <div style={{ padding: 20, paddingBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 12 }}>
          <Search size={12} /><span>Local model</span>
          {memoryTokens > 0 && <span style={{ opacity: 0.5 }}>• Memory: {memoryTokens}/{maxTokens}</span>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => {
              const next = !isExpanded;
              setIsExpanded(next);
              window.electronAPI?.resizeOverlay(next);
            }}
            style={{ ...iconBtnStyle, width: 28, height: 28 }}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          <button onClick={() => { if (isExpanded) { setIsExpanded(false); window.electronAPI?.resizeOverlay(false); } dismiss(); }} style={{ ...iconBtnStyle, width: 28, height: 28 }}>
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: 20, paddingTop: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activeSession?.messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', background: msg.role === 'user' ? '#31312F' : 'transparent', padding: '10px 14px', borderRadius: 16, border: msg.role === 'user' ? 'none' : '1px solid #2A2A2A', maxWidth: '90%', fontSize: 13.5, color: '#FFFFEB', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <MarkdownRenderer content={msg.content || '...'} />
                )}
              </div>
              {msg.role === 'assistant' && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                      setCopiedId(msg.id);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: copiedId === msg.id ? '#4ADE80' : '#888',
                      cursor: 'pointer',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      borderRadius: 6,
                      fontSize: 11
                    }}
                    title="Copy response"
                  >
                    {copiedId === msg.id ? <Check size={12} /> : <Copy size={12} />}
                    <span style={{ fontWeight: 500 }}>COPY</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Inline follow-up loading indicator */}
        {isFollowUpLoading && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: 'flex-start', background: 'transparent', padding: '10px 14px', borderRadius: 16, border: '1px solid #2A2A2A', maxWidth: '90%', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AudioLines size={16} color="#888" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 13, color: '#888' }}>Whispr is thinking...</span>
            <span style={{ fontSize: 11, color: '#555', marginLeft: 4 }}>({elapsed}s)</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div style={{ padding: '10px 16px 16px', background: 'linear-gradient(0deg, #1A1A1A 60%, transparent)' }}>
        <AnimatePresence>
          {slowWarning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              style={{ background: 'rgba(255, 140, 0, 0.1)', border: '1px solid rgba(255, 140, 0, 0.3)', padding: '8px 12px', borderRadius: 10, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#FF8C00' }}>GPU Heavy Load ({slowWarning.tps} tps)</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,235,0.7)', marginTop: 1 }}>{slowWarning.activeModel} is slow.</div>
              </div>
              <button onClick={() => {
                window.electronAPI?.stopChat();
                setSlowWarning(null);
              }} style={{ background: '#FF8C00', border: 'none', color: '#111', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Stop</button>
              <button onClick={() => setSlowWarning(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', background: '#222', borderRadius: 20, border: '1px solid #2A2A2A', padding: '6px 8px 6px 16px', minWidth: 0 }}>
          <input ref={inputRef} autoFocus type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Continue chat..." style={{ ...inputStyle, fontSize: 14, minWidth: 0 }} />
          <button type="button" onClick={() => isFollowUpLoading ? window.electronAPI?.stopChat() : handleSubmit(new Event('submit') as any)} style={{ ...iconBtnStyle, width: 32, height: 32, background: '#31312F', color: '#FFFFEB' }} title={isFollowUpLoading ? "Stop generation" : "Send"}>
            {isFollowUpLoading ? <Square size={13} fill="currentColor" /> : <Send size={15} />}
          </button>
        </form>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, justifyContent: 'center' }}>
          <button onClick={() => { setPhase('dynamic'); setActiveView('-1'); setActiveChatId(''); }} style={chipBtnStyle}>New Session</button>
          <button onClick={handleOpenMainApp} style={chipBtnStyle}>Open in Window</button>
        </div>
      </div>
    </motion.div>
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

const chipBtnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 16, border: '1px solid #3A3A3A',
  background: 'transparent', color: '#FFFFEB', fontSize: 12, cursor: 'pointer',
};
