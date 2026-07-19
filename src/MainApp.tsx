import { useState, useRef, useEffect } from 'react';
import { WhisprErrorBoundary } from './components/ErrorBoundary';
import { Send, Plus, Settings as SettingsIcon, Trash2, MessageSquare, ChevronLeft, Search, Globe, BookOpen, ExternalLink, Minus, Square, X, Copy, Check, Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MarkdownRenderer from './components/MarkdownRenderer';
import { WeatherPill } from './components/pills/WeatherPill';
import { SportsPill } from './components/pills/SportsPill';
import { MusicPill } from './components/pills/MusicPill';
import { StocksPill } from './components/pills/StocksPill';
import { FlightPill } from './components/pills/FlightPill';
import { NewsPill } from './components/pills/NewsPill';
import { ConnectivityPill } from './components/pills/ConnectivityPill';
import { CurrencyPill } from './components/pills/CurrencyPill';
import { CalculatorPill } from './components/pills/CalculatorPill';
import { SystemPill } from './components/pills/SystemPill';
import { TranslationPill } from './components/pills/TranslationPill';
import { CalendarPill } from './components/pills/CalendarPill';
import Settings from './Settings';
import { useSharedSessions, estimateContextMemory, loadSessions } from './lib/sessionStore';
import type { ChatMessage, ChatSession } from './lib/types';
import { Onboarding } from './components/Onboarding';

// electronAPI type is declared globally in App.tsx


// Demo sessions with rich content
const DEMO_SESSIONS: ChatSession[] = [
  {
    id: '1',
    title: 'Electron Overlay Setup',
    messages: [
      { id: 'm1', role: 'user', content: 'How do I create a transparent overlay in Electron?', timestamp: new Date().toISOString() },
      {
        id: 'm2', role: 'assistant',
        content: 'To create a transparent overlay in Electron, configure your `BrowserWindow` with **transparent**, **frameless**, and **alwaysOnTop** properties.\n\nHere\'s a minimal example:\n\n```javascript\nconst { BrowserWindow } = require(\'electron\');\n\nconst win = new BrowserWindow({\n  transparent: true,\n  frame: false,\n  alwaysOnTop: true,\n  skipTaskbar: true,\n  hasShadow: false,\n});\n```\n\nFor *click-through* behavior on transparent areas, use:\n\n```javascript\nwin.setIgnoreMouseEvents(true, { forward: true });\n```\n\nThis lets users interact with apps behind your overlay while still detecting mouse hover on your UI elements.',
        timestamp: new Date().toISOString(),
        sources: [
          { title: 'Electron Docs — BrowserWindow', url: 'https://electronjs.org/docs/api/browser-window', icon: 'globe' },
          { title: 'Stack Overflow — Transparent Windows', url: 'https://stackoverflow.com/questions/electron-transparent', icon: 'code' },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Weather in Austin',
    messages: [
      { id: 'm3', role: 'user', content: "What's the weather like in Austin, TX?", timestamp: new Date().toISOString() },
      {
        id: 'm4', role: 'assistant',
        content: "Currently in **Austin, TX** it's *78°F (26°C)* with partly cloudy skies. Here's the forecast:",
        timestamp: new Date().toISOString(),
        pill: 'weather',
        pillData: { location: 'Austin, TX', temp: 78, feelsLike: 75, condition: 'Partly Cloudy', humidity: 60, wind: 8, icon: '⛅', forecast: [
          { day: 'Mon', high: 80, low: 62, icon: '☀️' }, { day: 'Tue', high: 82, low: 64, icon: '☀️' },
          { day: 'Wed', high: 79, low: 60, icon: '⛅' }, { day: 'Thu', high: 75, low: 58, icon: '🌧️' },
          { day: 'Fri', high: 78, low: 60, icon: '⛅' },
        ], hourly: [] },
        sources: [{ title: 'Weather.gov — Austin Forecast', url: 'https://weather.gov/austin', icon: 'weather' }],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'DAL vs LAL Game',
    messages: [
      { id: 'm5', role: 'user', content: "What's the score of the Dallas vs Lakers game?", timestamp: new Date().toISOString() },
      {
        id: 'm6', role: 'assistant',
        content: "Here's the **live score** for tonight's game:",
        timestamp: new Date().toISOString(),
        pill: 'sports',
        pillData: { team: 'Dallas Mavericks', league: 'NBA', games: [
          { 
            id: 'mock2', name: 'Mavericks vs Lakers', status: 'Live', statusDetail: 'Q4 5:12', isLive: true, isCompleted: false, 
            home: { name: 'Los Angeles Lakers', abbreviation: 'LAL', score: '102', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Los_Angeles_Lakers_logo.svg', color: '#552583', record: '24-25' }, 
            away: { name: 'Dallas Mavericks', abbreviation: 'DAL', score: '108', logo: 'https://upload.wikimedia.org/wikipedia/en/9/97/Dallas_Mavericks_logo.svg', color: '#00538C', record: '26-22' }, 
            venue: 'Crypto.com Arena', broadcast: 'ESPN', league: 'NBA' 
          }
        ], stats: { wins: 26, losses: 22, ppg: 118.4, papg: 117.2 } },
        sources: [{ title: 'ESPN — NBA Live Scores', url: 'https://espn.com/nba', icon: 'sports' }],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Play Blinding Lights',
    messages: [
      { id: 'm7', role: 'user', content: 'Play Blinding Lights by The Weeknd', timestamp: new Date().toISOString() },
      {
        id: 'm8', role: 'assistant',
        content: 'Now playing **Blinding Lights** by *The Weeknd* on Spotify:',
        timestamp: new Date().toISOString(),
        pill: 'music',
        pillData: { isPlaying: true, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', albumArt: 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png' },
        sources: [{ title: 'Spotify — Now Playing', url: 'https://open.spotify.com', icon: 'music' }],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'AAPL Stock Price',
    messages: [
      { id: 'm9', role: 'user', content: "What's Apple's stock price?", timestamp: new Date().toISOString() },
      {
        id: 'm10', role: 'assistant',
        content: 'Here\'s the current **AAPL** stock data:',
        timestamp: new Date().toISOString(),
        pill: 'stocks',
        pillData: { stock: { symbol: 'AAPL', name: 'Apple Inc.', price: 189.42, currency: 'USD', change: 1.24, changeAbs: 2.32, isUp: true, exchange: 'NASDAQ', marketState: 'Open', sparkline: [185, 186, 187, 186.5, 188, 187.5, 189, 189.42], high: 190.1, low: 186.8, volume: 52400000, fiftyTwoWeekHigh: 199.62, fiftyTwoWeekLow: 164.08 } },
        sources: [{ title: 'Yahoo Finance — AAPL', url: 'https://finance.yahoo.com/quote/AAPL', icon: 'finance' }],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Python Fibonacci',
    messages: [
      { id: 'm11', role: 'user', content: 'Write me a fibonacci function in Python', timestamp: new Date().toISOString() },
      {
        id: 'm12', role: 'assistant',
        content: 'Here\'s an efficient **Fibonacci** implementation using *memoization*:\n\n```python\nfrom functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef fibonacci(n: int) -> int:\n    """Return the nth Fibonacci number."""\n    if n <= 1:\n        return n\n    return fibonacci(n - 1) + fibonacci(n - 2)\n\n# Usage\nfor i in range(10):\n    print(f"F({i}) = {fibonacci(i)}")\n```\n\nThis runs in **O(n)** time thanks to `lru_cache`. For very large values, consider an iterative approach to avoid stack overflow.',
        timestamp: new Date().toISOString(),
        sources: [
          { title: 'Python Docs — functools', url: 'https://docs.python.org/3/library/functools.html', icon: 'docs' },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
];

function MainApp() {
  const { sessions, updateSessions: setSessions } = useSharedSessions();
  
  // Read active session ID from local storage if dynamic bar opened us newly
  const [activeSessionId, setActiveSessionId] = useState<string>(
    () => localStorage.getItem('whispr_active_chat') || sessions[0]?.id || ''
  );
  const [inputValue, setInputValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTabOverride, setSettingsTabOverride] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [slowWarning, setSlowWarning] = useState<{activeModel: string, fastModel: string, tps: string} | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const pinnedSessions = sessions.filter(s => s.pinned);
  const recentSessions = sessions.filter(s => !s.pinned);

  const [needsOnboarding, setNeedsOnboarding] = useState(!localStorage.getItem('whispr_hw_scanned'));

  const rawActiveSession = sessions.find(s => s.id === activeSessionId) || DEMO_SESSIONS.find(s => s.id === activeSessionId);
  // Safety: ensure messages array is always valid so the app never blank-screens
  const activeSession = rawActiveSession ? {
    ...rawActiveSession,
    messages: Array.isArray(rawActiveSession.messages) ? rawActiveSession.messages : []
  } : undefined;
  const memoryTokens = estimateContextMemory(activeSession);
  const maxTokens = 4096;

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  // Sync active session if Dynamic Bar changes it while MainApp is open
  useEffect(() => {
    // 'storage' event only fires from OTHER windows, so we also poll for same-window changes
    const syncActiveChat = (e: StorageEvent) => {
      if (e.key === 'whispr_active_chat' && e.newValue) {
        setActiveSessionId(e.newValue);
      }
    };
    window.addEventListener('storage', syncActiveChat);
    
    // Poll every 500ms to catch same-window localStorage writes (from IPC handlers)
    const poll = setInterval(() => {
      const live = localStorage.getItem('whispr_active_chat');
      if (live && live !== activeSessionId) {
        setActiveSessionId(live);
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', syncActiveChat);
      clearInterval(poll);
    };
  }, [activeSessionId]);

  // IPC AI Stream Listeners
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    // Always read the live session ID from localStorage so we target the correct session
    // even if the Dynamic Bar was the one that fired the request
    const getLiveSessionId = () => localStorage.getItem('whispr_active_chat') || activeSessionId;

    const cleanupToken = api.onChatToken((token) => {
      const targetId = getLiveSessionId();
      if (!targetId) return;
      
      // Sync our UI to show this session if we aren't already
      setActiveSessionId(targetId);
      // NOTE: Keep isProcessing = true while tokens stream so the Stop button stays visible.
      // It only clears on chat-end.
      
      setSessions(prev => {
        // Check if session exists in React state
        const sessionExists = prev.some(s => s.id === targetId);
        
        // If the session doesn't exist, reload ALL sessions from localStorage 
        // (the Dynamic Bar already created and saved them there)
        let base = sessionExists ? prev : loadSessions();
        
        return base.map(s => {
          if (s.id !== targetId) return s;
          const newMessages = [...s.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            if (token === '__CLEAR_LAST__') {
              lastMsg.content = '';
            } else {
              lastMsg.content += token;
            }
          }
          return { ...s, messages: newMessages };
        });
      });
    });

    const cleanupTool = api.onChatTool((toolData) => {
      const targetId = getLiveSessionId();
      if (!targetId) return;
      
      setActiveSessionId(targetId);
      const keyword = toolData.toolName.replace('get_', '').replace('search_', '').replace('play_', '');
      setSessions(prev => {
        const sessionExists = prev.some(s => s.id === targetId);
        let base = sessionExists ? prev : loadSessions();
        
        return base.map(s => {
          if (s.id !== targetId) return s;
          const newMessages = [...s.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            lastMsg.pill = keyword;
            lastMsg.pillData = toolData.args;
          }
          return { ...s, messages: newMessages };
        });
      });
    });

    const cleanupEnd = api.onChatEnd(() => {
      setIsProcessing(false);
      setSlowWarning(null);
      localStorage.removeItem('whispr_is_processing');
    });

    const cleanupSystemHealth = api.onSystemHealth ? api.onSystemHealth(() => {
      // Future use
    }) : undefined;

    const cleanupSlowWarning = api.onChatSlowWarning((speedInfo) => {
      setSlowWarning(speedInfo);
    });

    const cleanupToolResult = (api as any).onChatToolResult?.((resultData: { toolName: string, resultStr: string }) => {
      const keyword = resultData.toolName.replace('get_', '').replace('search_', '').replace('play_', '');
      const searchKey = keyword === 'check_system_health' ? 'health' : keyword;
      
      const targetId = getLiveSessionId();
      if (!targetId) return;

      let parsedResult = {};
      try { parsedResult = JSON.parse(resultData.resultStr); } catch (e) {}

      setSessions(prev => {
        const sessionExists = prev.some(s => s.id === targetId);
        let base = sessionExists ? prev : loadSessions();
        
        return base.map(s => {
          if (s.id !== targetId) return s;
          const newMessages = [...s.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.pill === searchKey) {
            lastMsg.pillData = { ...(lastMsg.pillData || {}), ...parsedResult };
          }
          return { ...s, messages: newMessages };
        });
      });
    });

    return () => { 
      cleanupToken(); 
      cleanupTool(); 
      cleanupEnd(); 
      if (cleanupToolResult) cleanupToolResult(); 
      if (cleanupSystemHealth) cleanupSystemHealth();
      cleanupSlowWarning();
    };
  }, [activeSessionId]);

  // Sync isProcessing flag across windows specifically for transfer
  useEffect(() => {
    const syncProcessing = (e: StorageEvent) => {
      if (e.key === 'whispr_is_processing') setIsProcessing(e.newValue === 'true');
    };
    if (localStorage.getItem('whispr_is_processing') === 'true') {
      setIsProcessing(true);
    }
    window.addEventListener('storage', syncProcessing);
    return () => window.removeEventListener('storage', syncProcessing);
  }, []);

  // Ensure first visit shows setup if needed
  useEffect(() => {
    if (needsOnboarding && !window.location.search.includes('mode=overlay')) {
      setShowSettings(true);
    }
  }, [needsOnboarding]);

  // Listen for custom events from Markdown links
  useEffect(() => {
    const handleOpenSettings = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSettingsTabOverride(customEvent.detail);
      }
      setShowSettings(true);
    };
    window.addEventListener('open-settings', handleOpenSettings);
    return () => window.removeEventListener('open-settings', handleOpenSettings);
  }, []);

  useEffect(() => {
    if (isProcessing) {
      setElapsed(0);
      const interval = setInterval(() => setElapsed(e => e + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    localStorage.setItem('whispr_active_chat', newSession.id);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id && sessions.length > 1) {
      const remaining = sessions.filter(s => s.id !== id);
      setActiveSessionId(remaining[0]?.id || '');
    }
  };

  const handleTogglePin = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s));
  };

  const handleSend = () => {
    if (!inputValue.trim() || !activeSession) return;
    const query = inputValue.trim();

    const isDemo = DEMO_SESSIONS.some(s => s.id === activeSessionId);
    let targetSessionId = activeSessionId;
    let baseMessages = activeSession.messages;

    if (isDemo) {
      targetSessionId = Date.now().toString();
      const newSessionTitle = `${activeSession.title} (Copy)`;
      const newSession: ChatSession = {
        id: targetSessionId,
        title: newSessionTitle,
        messages: activeSession.messages.map(m => ({ ...m })),
        updatedAt: new Date().toISOString(),
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
      localStorage.setItem('whispr_active_chat', targetSessionId);
      baseMessages = newSession.messages;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    };

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '', // Starts empty, fills via stream
      timestamp: new Date().toISOString(),
    };

    setSessions(prev =>
      prev.map(s => {
        if (s.id !== targetSessionId) return s;
        return {
          ...s,
          title: s.messages.length === 0 ? query.slice(0, 40) : s.title,
          messages: [...s.messages, userMsg, aiMsg],
        };
      })
    );
    setInputValue('');

    // Fire actual AI Request.
    setIsProcessing(true);
    setSlowWarning(null);
    localStorage.setItem('whispr_is_processing', 'true');
    window.electronAPI?.chatRequest({
      messages: [...baseMessages, userMsg].map(m => ({ role: m.role, content: m.content })),
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

  // Render dynamic pill based on type — uses registry lookup with fallback
  const renderPill = (type: string, data?: any) => {
    if (data && data.error) return null;

    const pillCard: React.CSSProperties = { 
      marginTop: 10, 
      background: '#1A1A1A', 
      borderRadius: 16, 
      border: '1px solid #2A2A2A', 
      overflow: 'hidden',
      minWidth: 320,
      maxWidth: 460,
    };
    switch (type) {
      case 'weather': return <div style={{ ...pillCard, minHeight: 340 }}><WeatherPill data={data} defaultExpanded={true} /></div>;
      case 'sports': return <div style={{ ...pillCard, minHeight: 280 }}><SportsPill data={data} defaultExpanded={true} /></div>;
      case 'music': return <div style={{ ...pillCard, minHeight: 380 }}><MusicPill data={data} defaultExpanded={true} /></div>;
      case 'stocks': return <div style={{ ...pillCard, minHeight: 280 }}><StocksPill data={data} defaultExpanded={true} /></div>;
      case 'news': return <div style={{ ...pillCard, minHeight: 280 }}><NewsPill data={data} defaultExpanded={true} /></div>;
      case 'flight': return <div style={{ ...pillCard, minHeight: 280 }}><FlightPill /></div>;
      case 'currency':
      case 'get_currency': return <div style={{ ...pillCard, minHeight: 160 }}><CurrencyPill data={data} defaultExpanded={true} /></div>;
      case 'calculator':
      case 'open_calculator': return <div style={{ ...pillCard, minHeight: 420 }}><CalculatorPill defaultExpanded={true} /></div>;
      case 'translation':
      case 'get_translation': return <div style={{ ...pillCard, minHeight: 340 }}><TranslationPill /></div>;
      case 'calendar':
      case 'get_calendar': return <div style={{ ...pillCard, minHeight: 260 }}><CalendarPill /></div>;
      case 'tasks':
      case 'get_tasks': return <div style={{ ...pillCard, minHeight: 280 }}><TasksPill data={data} defaultExpanded={true} /></div>;
      case 'system':
      case 'get_system_stats': return <div style={{ ...pillCard, minHeight: 260 }}><SystemPill data={data} defaultExpanded={true} /></div>;
      case 'health': 
      case 'check_system_health': return <div style={{ ...pillCard, minHeight: 280 }}><ConnectivityPill /></div>;
      default: return null;
    }
  };

  // Source icon resolver
  const getSourceIcon = (icon?: string) => {
    switch (icon) {
      case 'globe': return <Globe size={11} />;
      case 'code': return <BookOpen size={11} />;
      case 'docs': return <BookOpen size={11} />;
      case 'weather': return <span style={{ fontSize: 11 }}>🌤️</span>;
      case 'sports': return <span style={{ fontSize: 11 }}>🏀</span>;
      case 'music': return <span style={{ fontSize: 11 }}>🎵</span>;
      case 'finance': return <span style={{ fontSize: 11 }}>📈</span>;
      case 'local': return <span style={{ fontSize: 11 }}>💻</span>;
      default: return <Globe size={11} />;
    }
  };

  // Settings with slide animation
  return (
    <AnimatePresence mode="wait">
      {needsOnboarding ? (
        <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: '100vw', height: '100vh', zIndex: 100000, position: 'relative' }}>
          <Onboarding onComplete={(models) => {
            localStorage.setItem('whispr_hw_scanned', 'true');
            localStorage.setItem('whispr_pref_fast', models.fast);
            localStorage.setItem('whispr_pref_heavy', models.heavy);
            // Fallback update current ollama selection
            localStorage.setItem('whispr_ollama_model', models.fast);
            setNeedsOnboarding(false);
          }} />
        </motion.div>
      ) : showSettings ? (
        <motion.div key="settings" initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} style={{ width: '100vw', height: '100vh' }}>
          <Settings 
            isOpen={showSettings} 
            onClose={() => {
              setShowSettings(false);
              setSettingsTabOverride(null);
              if (needsOnboarding) {
                setNeedsOnboarding(false);
                localStorage.setItem('whispr_hw_scanned', 'true');
              }
            }} 
            initialTab={settingsTabOverride || undefined}
          />
        </motion.div>
      ) : (
        <motion.div key="chat" initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }} style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div style={styles.container}>
      {/* ═══ SIDEBAR ═══ */}
      <div style={{ ...styles.sidebar, width: sidebarOpen ? 280 : 0, padding: sidebarOpen ? '20px 16px' : 0, overflow: 'hidden' }}>
        <div style={styles.sidebarHeader}>
          <span style={styles.logo}>Whispr</span>
          <button onClick={() => setSidebarOpen(false)} style={styles.iconBtn} title="Collapse sidebar">
            <ChevronLeft size={18} />
          </button>
        </div>

        <button onClick={handleNewChat} style={styles.newChatBtn}
          onMouseEnter={e => (e.currentTarget.style.background = '#31312F')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        <div style={styles.sessionList}>
          <AnimatePresence>
            {pinnedSessions.length > 0 && (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11, fontWeight: 600, color: '#888', padding: '12px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pinned
              </motion.div>
            )}
            {pinnedSessions.map(session => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  localStorage.setItem('whispr_active_chat', session.id);
                  setActiveSessionId(session.id);
                }}
                style={{
                  ...styles.sessionItem,
                  background: session.id === activeSessionId ? '#31312F' : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.querySelector('.session-actions')!.setAttribute('style', 'display: flex')}
                onMouseLeave={(e) => e.currentTarget.querySelector('.session-actions')!.setAttribute('style', 'display: none')}
              >
                <Pin size={14} style={{ flexShrink: 0, opacity: 0.8, color: '#4ADE80' }} />
                <span style={styles.sessionTitle}>{session.title}</span>
                <div style={styles.actionRow} className="session-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleTogglePin(session.id); }} style={styles.deleteBtn} title="Unpin chat"><Pin size={13} fill="currentColor" /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} style={styles.deleteBtn} title="Delete chat"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}

            {recentSessions.length > 0 && (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 11, fontWeight: 600, color: '#888', padding: `${pinnedSessions.length > 0 ? 16 : 12}px 10px 4px`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recent
              </motion.div>
            )}
            {recentSessions.map(session => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  localStorage.setItem('whispr_active_chat', session.id);
                  setActiveSessionId(session.id);
                }}
                style={{
                  ...styles.sessionItem,
                  background: session.id === activeSessionId ? '#31312F' : 'transparent',
                }}
                onMouseEnter={(e) => e.currentTarget.querySelector('.session-actions')!.setAttribute('style', 'display: flex')}
                onMouseLeave={(e) => e.currentTarget.querySelector('.session-actions')!.setAttribute('style', 'display: none')}
              >
                <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                <span style={styles.sessionTitle}>{session.title}</span>
                <div style={styles.actionRow} className="session-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleTogglePin(session.id); }} style={styles.deleteBtn} title="Pin chat"><Pin size={13} /></button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} style={styles.deleteBtn} title="Delete chat"><Trash2 size={13} /></button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', padding: '16px 10px 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Example Chats</div>
          {DEMO_SESSIONS.map(session => (
            <div
              key={session.id}
              onClick={() => {
                localStorage.setItem('whispr_active_chat', session.id);
                setActiveSessionId(session.id);
              }}
              style={{
                ...styles.sessionItem,
                background: session.id === activeSessionId ? '#31312F' : 'transparent',
                opacity: 0.8
              }}
            >
              <MessageSquare size={14} style={{ flexShrink: 0, opacity: 0.3 }} />
              <span style={styles.sessionTitle}>{session.title}</span>
            </div>
          ))}
        </div>

        <div style={styles.sidebarFooter}>
          <button style={styles.settingsBtn} onClick={() => setShowSettings(true)}
            onMouseEnter={e => (e.currentTarget.style.background = '#31312F')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <SettingsIcon size={16} />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div style={styles.main}>
        {/* Top bar */}
        <div style={{ ...styles.topBar, WebkitAppRegion: 'drag' } as React.CSSProperties}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{ ...styles.iconBtn, WebkitAppRegion: 'no-drag' } as React.CSSProperties} title="Open sidebar">
              <MessageSquare size={18} />
            </button>
          )}
          <span style={styles.topBarTitle}>{activeSession?.title || 'Whispr'}</span>
          <div style={{ flex: 1 }} />
          <button style={{ ...styles.iconBtn, WebkitAppRegion: 'no-drag' } as React.CSSProperties} title="Search chats">
            <Search size={18} />
          </button>
          <div style={{ display: 'flex', gap: 2, marginLeft: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <button onClick={() => window.electronAPI?.minimizeWindow()} style={{ ...styles.winBtn }} title="Minimize"
              onMouseEnter={e => e.currentTarget.style.background = '#31312F'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Minus size={14} />
            </button>
            <button onClick={() => window.electronAPI?.maximizeWindow()} style={{ ...styles.winBtn }} title="Maximize"
              onMouseEnter={e => e.currentTarget.style.background = '#31312F'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Square size={12} />
            </button>
            <button onClick={() => window.electronAPI?.closeWindow()} style={{ ...styles.winBtn }} title="Close"
              onMouseEnter={e => e.currentTarget.style.background = '#FF3B30'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Dynamic Context Memory Tracker */}
        <div style={{ height: 3, background: '#222', width: '100%' }}>
           <div style={{ 
            height: '100%', 
            background: memoryTokens > maxTokens * 0.9 ? '#FF3B30' : '#4ADE80', 
            width: `${Math.min((memoryTokens / maxTokens) * 100, 100)}%`,
            transition: 'width 0.5s ease-out, background 0.5s'
           }} title={`Context Memory: ~${memoryTokens}/${maxTokens} tokens`}/>
        </div>

        {/* Messages */}
        <div style={styles.messagesArea}>
          {activeSession && activeSession.messages.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyOrb}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#FFFFEB', boxShadow: '0 0 20px 4px rgba(255,255,235,0.4)' }} />
              </div>
              <h2 style={styles.emptyTitle}>What can I help you with?</h2>
              <p style={styles.emptySubtitle}>Ask anything — I can search the web, run tasks, and more.</p>
            </div>
          )}

          {activeSession?.messages.map(msg => (
            <div key={msg.id} style={{ ...styles.messageBubble, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                ...styles.messageContent,
                background: msg.role === 'user' ? '#31312F' : 'transparent',
                border: msg.role === 'user' ? 'none' : '1px solid #2A2A2A',
                maxWidth: msg.role === 'user' ? 480 : 680,
              }}>
                {/* Markdown rendered content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                   <div style={{ position: 'relative' }}>
                    {msg.role === 'user' ? (
                      msg.content 
                    ) : (
                      (!msg.content && isProcessing) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#888' }}>
                          <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
                          <span style={{ fontSize: 13 }}>({elapsed}s / ~{Math.max(6, elapsed + 1)}s)</span>
                        </div>
                      ) : (
                        msg.content ? <MarkdownRenderer content={msg.content} /> : (!msg.pill && <span style={{color: '#888'}}>No text response.</span>)
                      )
                    )}
                   </div>
                   {msg.role === 'assistant' && (
                     <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
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

                {/* Dynamic pill card */}
                {msg.pill && renderPill(msg.pill, msg.pillData)}

                {/* Sources with icons */}
                {msg.sources && msg.sources.length > 0 && (
                  <div style={styles.sourcesRow}>
                    {msg.sources.map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" style={styles.sourceChip}
                        onMouseEnter={e => (e.currentTarget.style.background = '#3A3A3A')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#262626')}
                      >
                        {getSourceIcon(src.icon)}
                        <span style={styles.sourceText}>{src.title}</span>
                        <ExternalLink size={9} style={{ opacity: 0.4, flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <AnimatePresence>
            {slowWarning && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                style={{ background: 'rgba(255, 140, 0, 0.1)', border: '1px solid rgba(255, 140, 0, 0.3)', padding: '10px 16px', borderRadius: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 720 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FF8C00' }}>GPU Heavy Load Detected ({slowWarning.tps} tokens/sec)</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,235,0.7)', marginTop: 2 }}>{slowWarning.activeModel} is generating slowly. Consider using a smaller model.</div>
                </div>
                <button onClick={() => {
                  window.electronAPI?.stopChat();
                  setSlowWarning(null);
                }} style={{ background: '#FF8C00', border: 'none', color: '#111', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Stop Generation</button>
                <button onClick={() => setSlowWarning(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', padding: 4 }}><X size={14} /></button>
              </motion.div>
            )}
          </AnimatePresence>
          <div style={styles.inputBox}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Message Whispr..."
              style={styles.input}
            />
            <button
              onClick={isProcessing ? () => window.electronAPI?.stopChat() : handleSend}
              style={styles.sendBtn}
              onMouseEnter={e => (e.currentTarget.style.background = '#444')}
              onMouseLeave={e => (e.currentTarget.style.background = '#31312F')}
              title={isProcessing ? "Stop generation" : "Send message"}
            >
              {isProcessing ? <Square size={14} fill="currentColor" /> : <Send size={18} />}
            </button>
          </div>
          <span style={styles.disclaimer}>Whispr is a local AI assistant. Responses may not always be accurate.</span>
        </div>
      </div>
    </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { width: '100vw', height: '100vh', display: 'flex', background: '#1A1A1A', color: '#FFFFEB', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', overflow: 'hidden' },
  sidebar: { height: '100%', background: '#141414', borderRight: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', transition: 'width 0.25s ease, padding 0.25s ease', flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  logo: { fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFEB' },
  newChatBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid #2A2A2A', background: 'transparent', color: '#FFFFEB', fontSize: 14, cursor: 'pointer', marginBottom: 16, transition: 'background 0.2s' },
  sessionList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 },
  sessionItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', transition: 'background 0.15s', color: '#FFFFEB' },
  sessionTitle: { flex: 1, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.85 },
  actionRow: { display: 'none', alignItems: 'center', gap: 4 },
  deleteBtn: { background: 'transparent', border: 'none', color: '#FFFFEB', opacity: 0.3, cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
  sidebarFooter: { paddingTop: 12, borderTop: '1px solid #2A2A2A' },
  settingsBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: '#FFFFEB', fontSize: 13, cursor: 'pointer', width: '100%', opacity: 0.7, transition: 'background 0.15s' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 },
  topBar: { display: 'flex', alignItems: 'center', padding: '12px 20px', gap: 10, borderBottom: '1px solid #2A2A2A' },
  topBarTitle: { fontSize: 14, fontWeight: 600, opacity: 0.8 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: '#FFFFEB', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', opacity: 0.6, transition: 'background 0.2s' },
  winBtn: { width: 44, height: 30, border: 'none', background: 'transparent', color: '#FFFFEB', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', opacity: 0.6, transition: 'background 0.2s' },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '24px 40px', display: 'flex', flexDirection: 'column', gap: 16 },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', opacity: 0.7 },
  emptyOrb: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,235,0.08)', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: '#FFFFEB' },
  emptySubtitle: { fontSize: 14, margin: 0, opacity: 0.5 },
  messageBubble: { display: 'flex', maxWidth: '100%' },
  messageContent: { padding: '16px 20px', borderRadius: 16, minWidth: 0, maxWidth: '100%' },
  sourcesRow: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, paddingTop: 12, borderTop: '1px solid #2A2A2A' },
  sourceChip: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, background: '#262626', fontSize: 11, color: '#FFFFEB', opacity: 0.7, textDecoration: 'none', transition: 'background 0.15s', cursor: 'pointer' },
  sourceText: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 },
  inputArea: { padding: '12px 40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  inputBox: { display: 'flex', alignItems: 'center', width: '100%', maxWidth: 720, background: '#222', borderRadius: 20, border: '1px solid #2A2A2A', padding: '6px 8px 6px 18px' },
  input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFFFEB', fontSize: 15, fontFamily: 'inherit', padding: '10px 0' },
  sendBtn: { width: 40, height: 40, borderRadius: '50%', border: 'none', background: '#31312F', color: '#FFFFEB', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' },
  disclaimer: { fontSize: 11, opacity: 0.35, textAlign: 'center' },
};

function MainAppWithErrorBoundary() {
  return (
    <WhisprErrorBoundary>
      <MainApp />
    </WhisprErrorBoundary>
  );
}

export default MainAppWithErrorBoundary;
