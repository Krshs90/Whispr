import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { Send, X, AudioLines, Search, LayoutGrid, Check, Copy, Maximize2, Minimize2, Square } from 'lucide-react';
import { PILL_REGISTRY, findPillByQuery } from './components/pills';
import MarkdownRenderer from './components/MarkdownRenderer';
import { useSharedSessions, estimateContextMemory } from './lib/sessionStore';
import type { ChatMessage } from './lib/types';

declare global {
  interface Window {
    electronAPI?: {
      onShowIsland: (callback: () => void) => (() => void);
      onHideIsland: (callback: () => void) => (() => void);
      onWindowBlur: (callback: () => void) => (() => void);
      hideOverlay: () => void;
      openMainApp: () => void;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      setAutoStart: (enabled: boolean) => void;
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
      chatRequest: (data: { messages: {role: string, content: string}[], defaultModel: string, apiKeys: Record<string, unknown>, userData: Record<string, any> }) => void;
      getNowPlaying: () => Promise<Record<string, unknown> | null>;
      executeTool: (name: string, args: Record<string, unknown>, apiKeys: Record<string, string>) => Promise<string>;
      onChatToken: (cb: (token: string) => void) => (() => void);
      onChatTool: (cb: (data: { toolName: string, args: Record<string, unknown> }) => void) => (() => void);
      onChatEnd: (cb: () => void) => (() => void);
      stopChat: () => void;
      onChatSlowWarning: (cb: (data: Record<string, unknown>) => void) => (() => void);
      onSystemHealth?: (cb: (status: Record<string, unknown>) => void) => (() => void);
      openExternal: (url: string) => void;
      resizeOverlay: (expanded: boolean) => void;
      scanHardware: () => Promise<{ ramGB: number, cores: number, diskFreeGB: number }>;
      getInstalledModels: () => Promise<string[]>;
      pullModel: (modelName: string) => void;
      onPullProgress: (cb: (data: Record<string, unknown>) => void) => (() => void);
      onPullError: (cb: (msg: string) => void) => (() => void);
    };
  }
}

type IslandPhase = 'idle' | 'orb' | 'processing' | 'response' | 'dynamic' | 'closing';

interface StackItem {
  id: string;
  pillIdx: number;
  pillData?: any;
}

const PILL_WIDTH = 480;
const PILL_WIDTH_EXPANDED = 660;
const INPUT_HEIGHT = 56;

function App() {
  const [phase, setPhase] = useState<IslandPhase>('idle');
  const [pillStack, setPillStack] = useState<StackItem[]>([]);
  // activeView: '-1' is the text bar, otherwise the string ID of a StackItem
  const [activeView, setActiveView] = useState<string>('-1');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState<{activeModel: string, fastModel: string, tps: string} | null>(null);

  const { sessions, updateSessions } = useSharedSessions();
  const [activeChatId, setActiveChatId] = useState<string>('');

  const activeSession = sessions.find(s => s.id === activeChatId);
  const memoryTokens = estimateContextMemory(activeSession);
  const maxTokens = 4096;

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Push API keys to the backend for background tasks (like Health Monitor)
  useEffect(() => {
    if ((window as any).electronAPI?.updateApiKeys) {
      (window as any).electronAPI.updateApiKeys({
        weather: localStorage.getItem('whispr_api_weather') || ''
      });
    }
  }, []);

  // First-launch Hardware Onboarding Intercept
  useEffect(() => {
    if (localStorage.getItem('whispr_hw_scanned') !== 'true') {
      window.electronAPI?.openMainApp();
    }
  }, []);

  const pillStackRef = useRef(pillStack);
  useEffect(() => {
    pillStackRef.current = pillStack;
  }, [pillStack]);

  // Auto-scroll inside the dynamic chat pill
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const dismiss = useCallback(() => {
    if (phase === 'idle' || phase === 'closing') return;
    setPhase('closing');
  }, [phase]);

  // Closing sequence
  useEffect(() => {
    if (phase === 'closing') {
      const timer = setTimeout(() => {
        setPhase('idle');
        setTimeout(() => window.electronAPI?.hideOverlay(), 350);
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Elapsed processing timer
  useEffect(() => {
    if (phase === 'processing') {
      setElapsed(0);
      const interval = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  // Sync external widget generation from MainApp
  useEffect(() => {
    if (!activeSession) return;
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.pill) {
      const pillIdx = findPillByQuery(lastMsg.pill);
      if (pillIdx >= 0) {
        setPillStack(prev => {
          // If any pill in the stack matches this index, don't mount it again on the dynamic island!
          if (prev.some(p => p.pillIdx === pillIdx)) return prev;
          return [...prev, { id: Date.now().toString(), pillIdx, pillData: lastMsg.pillData }];
        });
      }
    }
  }, [activeSession?.updatedAt]);

  // IPC listeners
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    const cleanupShow = api.onShowIsland(() => {
      const skipAnim = localStorage.getItem('whispr_skip_dynamic_anim') === 'true';
      if (pillStack.length > 0) {
        setPhase('dynamic');
      } else {
        if (skipAnim) {
          setPhase('dynamic');
          setActiveView('-1');
        } else {
          setPhase('orb');
        }
      }
    });
    const cleanupHide = api.onHideIsland(() => {
      dismiss();
      // We purposefully DO NOT wipe activeChatId, pillStack, activeView, or query here!
      // This solves the 'spam toggle' bug where reopening the island would clear widgets.
      // The state remains preserved natively in React's memory.
    });
    const cleanupBlur = api.onWindowBlur(() => { });

    const cleanupSlowWarning = api.onChatSlowWarning((speedInfo) => {
      setSlowWarning(speedInfo);
    });

    const cleanupToken = api.onChatToken((token) => {
      setIsFollowUpLoading(false);
      // Only switch to 'response' if we're in the bare 'processing' spinner.
      // If we're already in 'dynamic' (showing a pill), STAY in dynamic — don't clobber it.
      setPhase(prev => {
        if (prev === 'processing') return 'response';
        return prev; // keep 'dynamic', 'response', etc. as-is
      });

      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';
      if (!currentChatId) return;

      updateSessions(prev =>
        prev.map(s => {
          if (s.id !== currentChatId) return s;
          const newMsgs = [...s.messages];
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            if (token === '__CLEAR_LAST__') {
              lastMsg.content = '';
            } else {
              lastMsg.content += token;
            }
          }
          return { ...s, messages: newMsgs };
        })
      );
    });

    const cleanupTool = api.onChatTool((toolData) => {
      // Find the appropriate pill based on the tool invoked
      const keyword = toolData.toolName.replace('get_', '').replace('search_', '').replace('play_', '');
      const searchKey = keyword === 'check_system_health' ? 'health' : keyword;
      const pillIdx = findPillByQuery(searchKey);

      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';

      if (pillIdx >= 0) {
        // Enforce uniqueness — don't open the same widget twice in the dynamic bar
        const existingPill = pillStackRef.current.find(p => p.pillIdx === pillIdx);
        const targetId = existingPill ? existingPill.id : Date.now().toString() + Math.random().toString(36).substr(2, 5);

        if (!existingPill) {
          setPillStack(prev => [...prev, { id: targetId, pillIdx, pillData: toolData.args }]);
        } else {
          setPillStack(prev => prev.map(p => p.id === targetId ? { ...p, pillData: toolData.args } : p));
        }

        setActiveView(targetId);
        setPhase('dynamic');

        // Sync the pill triggering to LocalStorage so MainApp instantly renders it
        if (currentChatId) {
          updateSessions(prev =>
            prev.map(s => {
              if (s.id !== currentChatId) return s;
              const newMsgs = [...s.messages];
              const lastMsg = newMsgs[newMsgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant') {
                lastMsg.pill = searchKey;
                lastMsg.pillData = toolData.args;
              }
              return { ...s, messages: newMsgs };
            })
          );
        }
      }
    });

    const cleanupToolResult = (api as any).onChatToolResult?.((resultData: { toolName: string, resultStr: string }) => {
      const keyword = resultData.toolName.replace('get_', '').replace('search_', '').replace('play_', '');
      const searchKey = keyword === 'check_system_health' ? 'health' : keyword;
      const pillIdx = findPillByQuery(searchKey);

      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';

      if (pillIdx >= 0) {
        let parsedResult = {};
        try { parsedResult = JSON.parse(resultData.resultStr); } catch (e) { }

        setPillStack(prev => prev.map(p => {
          if (p.pillIdx === pillIdx) {
            // Merge existing args with full result data
            return { ...p, pillData: { ...p.pillData, ...parsedResult } };
          }
          return p;
        }));

        if (currentChatId) {
          updateSessions(prev =>
            prev.map(s => {
              if (s.id !== currentChatId) return s;
              const newMsgs = [...s.messages];
              const lastMsg = newMsgs[newMsgs.length - 1];
              if (lastMsg && lastMsg.role === 'assistant' && lastMsg.pill === searchKey) {
                lastMsg.pillData = { ...(lastMsg.pillData || {}), ...parsedResult };
              }
              return { ...s, messages: newMsgs };
            })
          );
        }
      }
    });

    const cleanupEnd = api.onChatEnd(() => {
      localStorage.removeItem('whispr_is_processing');
      setIsFollowUpLoading(false);
      setSlowWarning(null);
    });

    const handleUnload = () => {
      localStorage.removeItem('whispr_is_processing');
    };
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      cleanupShow(); cleanupHide(); cleanupBlur();
      cleanupToken(); cleanupTool(); cleanupSlowWarning();
      if (cleanupToolResult) cleanupToolResult();
      cleanupEnd();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [dismiss, pillStack.length, activeChatId]);

  // Auto-expand orb -> dynamic
  useEffect(() => {
    if (phase === 'orb') {
      const timer = setTimeout(() => {
        setPhase('dynamic');
        setActiveView('-1');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Auto-focus input
  useEffect(() => {
    if (phase === 'dynamic' && activeView === '-1') {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [phase, activeView]);

  // ESC to dismiss overlay completely
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'idle' && phase !== 'closing') dismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, dismiss]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const isFollowUp = phase === 'response' && activeChatId;
    
    if (isFollowUp) {
      setIsFollowUpLoading(true);
    } else {
      setPhase('processing');
    }
    
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
      // Always create a fresh session for new queries
      sid = Date.now().toString();
      setActiveChatId(sid);
      activeChatIdRef.current = sid;
      localStorage.setItem('whispr_active_chat', sid);
      updateSessions(prev => [{ id: sid, title: q.slice(0, 40), messages: [], updatedAt: new Date().toISOString() }, ...prev]);
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: q, timestamp: new Date().toISOString() };
    const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '', timestamp: new Date().toISOString() };

    updateSessions(prev =>
      prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMsg, aiMsg], updatedAt: new Date().toISOString() } : s)
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
    }, 350); // Wait for the transition out to mostly complete
  };

  // Up/Down = Cycle infinitely. Left/Right = Dismiss ACTIVE pill (except text input).
  const handleDragEnd = (viewId: string, _e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y);

    if (isHorizontal) {
      // Left/Right Swipe -> Dismiss specific pill
      if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 300) {
        if (viewId !== '-1') {
          setPillStack(prev => {
            const nextStack = prev.filter(item => item.id !== viewId);
            // If we dismissed the currently active view, fallback to text input
            if (activeView === viewId) {
              setActiveView('-1');
            }
            return nextStack;
          });
        }
      }
    } else {
      // Up/Down Swipe -> Cycle through all open pills + text input
      if (Math.abs(offset.y) > 30 || Math.abs(velocity.y) > 300) {
        const allViews = ['-1', ...pillStack.map(p => p.id)];
        if (allViews.length <= 1) return;

        const currentIdx = allViews.indexOf(activeView);
        if (offset.y < 0) {
          // Swipe Up -> Next
          const nextIdx = (currentIdx + 1) % allViews.length;
          setActiveView(allViews[nextIdx]);
        } else {
          // Swipe Down -> Prev
          const nextIdx = (currentIdx - 1 + allViews.length) % allViews.length;
          setActiveView(allViews[nextIdx]);
        }
      }
    }
  };

  const getRotatedViews = () => {
    const allViews = ['-1', ...pillStack.map(p => p.id)];
    if (allViews.length <= 1) return allViews;

    const activeIdx = allViews.indexOf(activeView);
    if (activeIdx === -1) return allViews;

    const rotated = [];
    const N = allViews.length;
    // We want activeView to be the LAST item rendered (bottom of the flex column)
    for (let i = 1; i <= N; i++) {
      rotated.push(allViews[(activeIdx + i) % N]);
    }
    return rotated;
  };

  const [dynamicHeights, setDynamicHeights] = useState<Record<string, number>>({});

  const getPillHeight = (id: string) => {
    if (id === '-1') {
      if (phase === 'orb' || phase === 'closing') return 56;
      if (phase === 'processing') return 120;
      if (phase === 'response') return isExpanded ? 500 : 280;
      return INPUT_HEIGHT;
    }

    if (dynamicHeights[id]) {
      return dynamicHeights[id];
    }

    const stackItem = pillStack.find(p => p.id === id);
    if (stackItem) {
      return PILL_REGISTRY[stackItem.pillIdx].height;
    }
    return INPUT_HEIGHT;
  };

  const renderCoreContent = () => {
    if (phase === 'orb' || phase === 'closing') {
      return (
        <motion.div key="orb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
          style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#FFFFEB', boxShadow: '0 0 18px 4px rgba(255,255,235,0.6)' }} />
        </motion.div>
      );
    }
    if (phase === 'processing') {
      return (
        <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#FFFFEB' }}>
            <AudioLines size={24} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 15, fontWeight: 500 }}>
              Thinking... <span style={{ opacity: 0.5, fontSize: 13 }}>({elapsed}s / ~{Math.max(6, elapsed + 1)}s)</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { window.electronAPI?.stopChat(); setPhase('dynamic'); setActiveView('-1'); localStorage.removeItem('whispr_is_processing'); }} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid #3A3A3A', background: 'transparent', color: '#FFFFEB', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <X size={14} /> Cancel
            </button>
            {elapsed >= 3 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleOpenMainApp} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid #3A3A3A', background: '#31312F', color: '#FFFFEB', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <LayoutGrid size={14} /> Open in Window
              </motion.button>
            )}
          </div>
        </motion.div>
      );
    }
    if (phase === 'response') {
      return (
        <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', justifyContent: 'center',
      background: 'transparent', position: 'relative',
    }}>
      <AnimatePresence mode="popLayout">
        {phase !== 'idle' && getRotatedViews().map((viewId, index, arr) => {
          const stackItem = !viewId || viewId === '-1' ? null : pillStack.find(p => p.id === viewId);
          const isCalcPill = stackItem ? PILL_REGISTRY[stackItem.pillIdx]?.name === 'Calculator' : false;
          const basePillW = isExpanded ? PILL_WIDTH_EXPANDED : PILL_WIDTH;
          const w = (phase === 'orb' || phase === 'closing') ? 56 : (isCalcPill ? Math.max(380, basePillW) : basePillW);
          const h = getPillHeight(viewId);
          const isCore = viewId === '-1';
          const distance = arr.length - 1 - index;

          // When transitioning through orb/thinking state, hide the actual dynamic pills temporarily to focus on the animation
          if (!isCore && phase !== 'dynamic') return null;

          return (
            <motion.div
              key={viewId}
              onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
              onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
              drag={(!isCore && phase !== 'processing' && phase !== 'orb') ? "x" : false} // Lock drag on core view and during orb/processing
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.06}
              onDragEnd={(e, info) => handleDragEnd(viewId, e, info)}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{
                opacity: distance === 0 ? 1 : Math.max(0, 0.6 - distance * 0.2),
                y: distance === 0 ? 0 : (distance * -18) - 10,
                scale: distance === 0 ? 1 : Math.max(0.85, 0.96 - distance * 0.04),
                width: w,
                height: h
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
              style={{
                background: '#1A1A1A',
                borderRadius: 28,
                border: '1px solid #2A2A2A',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                willChange: 'transform, opacity, width, height',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: (!isCore && phase !== 'processing' && phase !== 'orb') ? 'grab' : 'default',
                pointerEvents: 'auto',
                position: 'absolute',
                bottom: 24,
                transformOrigin: 'bottom center',
                zIndex: 20 - distance,
              }}
            >
              {isCore ? (
                <div style={{ width: '100%', height: '100%' }}>
                  <AnimatePresence mode="wait">
                    {renderCoreContent()}
                  </AnimatePresence>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', position: 'relative', pointerEvents: distance === 0 ? 'auto' : 'none' }}>
                  {(() => {
                    const stackItem = pillStack.find(p => p.id === viewId)!;
                    const Component = PILL_REGISTRY[stackItem.pillIdx].component;
                    return <Component
                      data={stackItem.pillData}
                      onExpand={(h: number) => setDynamicHeights(prev => ({ ...prev, [viewId]: h }))}
                    />;
                  })()}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::placeholder { color: rgba(255, 255, 235, 0.35); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #31312F; border-radius: 10px; }
      `}</style>
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

const chipBtnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 16, border: '1px solid #3A3A3A',
  background: 'transparent', color: '#FFFFEB', fontSize: 12, cursor: 'pointer',
};

export default App;
