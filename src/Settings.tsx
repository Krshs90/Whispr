import { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, Keyboard, Mic, Shield, Palette, Bell, Globe, Construction, Eye, Terminal, CheckCircle2 } from 'lucide-react';

// Import all pill components for the Widgets Index showcase
import { WeatherPill } from './components/pills/WeatherPill';
import { SportsPill } from './components/pills/SportsPill';
import { StocksPill } from './components/pills/StocksPill';
import { NewsPill } from './components/pills/NewsPill';
import { MusicPill } from './components/pills/MusicPill';
import { CalculatorPill } from './components/pills/CalculatorPill';
import { CurrencyPill } from './components/pills/CurrencyPill';
import { SystemPill } from './components/pills/SystemPill';
import { ConnectivityPill } from './components/pills/ConnectivityPill';
import { TranslationPill } from './components/pills/TranslationPill';
import { CalendarPill } from './components/pills/CalendarPill';
import { TasksPill } from './components/pills/TasksPill';
import { TimerPill } from './components/pills/TimerPill';
import { FlightPill } from './components/pills/FlightPill';

import { GeneralSettings } from './components/settings/GeneralSettings';
import { AITab } from './components/settings/AITab';

interface SettingsProps {
  onClose: () => void;
  isOpen?: boolean;
  initialTab?: string;
}

function sanitizeStoredModel(key: string, fallback: string): string {
  const raw = localStorage.getItem(key) || fallback;
  const cleaned = raw.trim().replace(/^qqwen/i, 'qwen').replace(/^lllama/i, 'llama');
  if (cleaned !== raw) {
    localStorage.setItem(key, cleaned);
  }
  return cleaned;
}

// ─── In Development Banner ───
function DevBanner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 10,
      background: '#FB923C12', border: '1px solid #FB923C33',
      marginBottom: 20,
    }}>
      <Construction size={18} color="#FB923C" />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#FB923C' }}>In Development</div>
        <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>This feature is under active development and will be available in a future update.</div>
      </div>
    </div>
  );
}

function Settings({ onClose, isOpen: _isOpen = true, initialTab }: SettingsProps) {
  const [tab, setTab] = useState<string>(initialTab || 'general');
  const [userName, setUserName] = useState(() => localStorage.getItem('whispr_user_name') || '');
  const [userContext, setUserContext] = useState(() => localStorage.getItem('whispr_user_context') || '');
  const [musicPlatform, setMusicPlatform] = useState(() => localStorage.getItem('whispr_music_platform') || 'spotify');
  const [favoritePlaylist, setFavoritePlaylist] = useState(() => localStorage.getItem('whispr_spotify_playlist') || '');
  const [ollamaModel, setOllamaModel] = useState(() => sanitizeStoredModel('whispr_ollama_model', 'llama3.2:latest'));
  
  // Custom Dynamic Models Configurations
  const [prefFast, setPrefFast] = useState(() => sanitizeStoredModel('whispr_pref_fast', 'llama3.2:latest'));
  const [prefHeavy, setPrefHeavy] = useState(() => sanitizeStoredModel('whispr_pref_heavy', 'llama3:8b'));
  
  // Advanced Specialty Models
  const [prefMath, setPrefMath] = useState(() => sanitizeStoredModel('whispr_pref_math', ''));
  const [prefCode, setPrefCode] = useState(() => sanitizeStoredModel('whispr_pref_code', ''));
  const [prefHistory, setPrefHistory] = useState(() => sanitizeStoredModel('whispr_pref_history', ''));
  const [prefBusiness, setPrefBusiness] = useState(() => sanitizeStoredModel('whispr_pref_business', ''));

  // Local Models Database
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [downloadingModel, setDownloadingModel] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    window.electronAPI?.getInstalledModels().then(setInstalledModels).catch(() => {});
  }, []);

  const [keybind, setKeybind] = useState(() => localStorage.getItem('whispr_global_shortcut') || 'Ctrl + I');
  
  // Security settings with persistence
  const [confirmApps, setConfirmApps] = useState(() => localStorage.getItem('whispr_sec_apps') !== 'false');
  const [confirmSensitive, setConfirmSensitive] = useState(() => localStorage.getItem('whispr_sec_sensitive') !== 'false');
  const [confirmSystem, setConfirmSystem] = useState(() => localStorage.getItem('whispr_sec_system') !== 'false');
  
  const [isListening, setIsListening] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoStart, setAutoStart] = useState(() => localStorage.getItem('whispr_auto_start') === 'true');
  const [useSpecialized, setUseSpecialized] = useState(() => localStorage.getItem('whispr_use_specialized') !== 'false');

  // Granular Animation Settings
  const [masterAnimations, setMasterAnimations] = useState(() => localStorage.getItem('whispr_disable_all_anim') !== 'true');
  const [dynamicAnimations, setDynamicAnimations] = useState(() => localStorage.getItem('whispr_skip_dynamic_anim') !== 'true');
  const [springPhysics, setSpringPhysics] = useState(() => localStorage.getItem('whispr_disable_spring_physics') !== 'true');
  const [pillAnimations, setPillAnimations] = useState(() => localStorage.getItem('whispr_disable_pill_transitions') !== 'true');
  const [chatAnimations, setChatAnimations] = useState(() => localStorage.getItem('whispr_disable_chat_anim') !== 'true');

  // Optional API Keys
  const [apiWeather, setApiWeather] = useState(() => localStorage.getItem('whispr_api_weather') || '');
  const [apiStocks, setApiStocks] = useState(() => localStorage.getItem('whispr_api_stocks') || '');
  const [apiSearch, setApiSearch] = useState(() => localStorage.getItem('whispr_api_search') || '');

  // Whispr Vision & Whispr Control
  const [monitors, setMonitors] = useState<Array<{ id: string; name: string }>>([]);
  const [visionEnabled, setVisionEnabled] = useState(() => localStorage.getItem('whispr_vision_enabled') !== 'false');
  const [allowedMonitors, setAllowedMonitors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('whispr_allowed_monitors') || '[]'); } catch { return []; }
  });
  const [allowControl, setAllowControl] = useState(() => {
    const val = localStorage.getItem('whispr_control_enabled') ?? localStorage.getItem('whispr_allow_control');
    return val !== 'false';
  });

  // Detect monitors only once (or when opening Security tab if not yet loaded) so switching tabs never lags!
  useEffect(() => {
    if (monitors.length > 0) return;
    if (tab !== 'security' && localStorage.getItem('whispr_monitors_initialized') === 'true') return;
    if (window.electronAPI?.getMonitors) {
      window.electronAPI.getMonitors().then((detected: Array<{ id: string; name: string }>) => {
        setMonitors(detected);
        const initialized = localStorage.getItem('whispr_monitors_initialized') === 'true';
        if (detected.length > 0 && (!initialized || (visionEnabled && allowedMonitors.length === 0))) {
          const allIds = detected.map(m => m.id);
          setAllowedMonitors(allIds);
          localStorage.setItem('whispr_allowed_monitors', JSON.stringify(allIds));
          localStorage.setItem('whispr_monitors_initialized', 'true');
        }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const notifyAnimChanged = () => {
    window.dispatchEvent(new Event('whispr-anim-prefs-changed'));
  };

  const handleMasterAnimChange = (enabled: boolean) => {
    setMasterAnimations(enabled);
    localStorage.setItem('whispr_disable_all_anim', enabled ? 'false' : 'true');
    if (enabled) {
      // When re-enabling master animations, also re-enable sub-animations so it never stays stuck disabled!
      setDynamicAnimations(true);
      localStorage.setItem('whispr_skip_dynamic_anim', 'false');
      setSpringPhysics(true);
      localStorage.setItem('whispr_disable_spring_physics', 'false');
      setPillAnimations(true);
      localStorage.setItem('whispr_disable_pill_transitions', 'false');
      setChatAnimations(true);
      localStorage.setItem('whispr_disable_chat_anim', 'false');
    }
    notifyAnimChanged();
  };

  const handleDynamicAnimChange = (enabled: boolean) => {
    setDynamicAnimations(enabled);
    localStorage.setItem('whispr_skip_dynamic_anim', enabled ? 'false' : 'true');
    if (enabled && !masterAnimations) {
      setMasterAnimations(true);
      localStorage.setItem('whispr_disable_all_anim', 'false');
    }
    notifyAnimChanged();
  };

  const handleSpringPhysicsChange = (enabled: boolean) => {
    setSpringPhysics(enabled);
    localStorage.setItem('whispr_disable_spring_physics', enabled ? 'false' : 'true');
    if (enabled && !masterAnimations) {
      setMasterAnimations(true);
      localStorage.setItem('whispr_disable_all_anim', 'false');
    }
    notifyAnimChanged();
  };

  const handlePillAnimChange = (enabled: boolean) => {
    setPillAnimations(enabled);
    localStorage.setItem('whispr_disable_pill_transitions', enabled ? 'false' : 'true');
    if (enabled && !masterAnimations) {
      setMasterAnimations(true);
      localStorage.setItem('whispr_disable_all_anim', 'false');
    }
    notifyAnimChanged();
  };

  const handleChatAnimChange = (enabled: boolean) => {
    setChatAnimations(enabled);
    localStorage.setItem('whispr_disable_chat_anim', enabled ? 'false' : 'true');
    if (enabled && !masterAnimations) {
      setMasterAnimations(true);
      localStorage.setItem('whispr_disable_all_anim', 'false');
    }
    notifyAnimChanged();
  };

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isListening) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const parts: string[] = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Win');
      
      const isModifier = ['Control', 'Alt', 'Shift', 'Meta'].includes(e.key);
      if (e.key && !isModifier) {
        parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      }
      
      if (parts.length > 0) {
        const newBind = parts.join(' + ');
        setKeybind(newBind + (isModifier ? ' + ...' : ''));
        
        if (!isModifier) {
          localStorage.setItem('whispr_global_shortcut', newBind);
          window.electronAPI?.updateShortcut?.(newBind);
          setIsListening(false);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isListening]);

  const tabs = [
    { id: 'general', label: 'General', icon: <Cpu size={16} /> },
    { id: 'ai', label: 'AI Models', icon: <Cpu size={16} /> },
    { id: 'shortcuts', label: 'Shortcuts', icon: <Keyboard size={16} /> },
    { id: 'voice', label: 'Voice', icon: <Mic size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'widgets', label: 'Widgets Index', icon: <Eye size={16} /> },
    { id: 'services', label: 'Services & APIs', icon: <Globe size={16} /> },
  ];

  return (
    <div style={s.container}>
      {/* Sidebar */}
      <div style={s.sidebar}>
        <button onClick={onClose} style={s.backBtn}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h2 style={s.settingsTitle}>Settings</h2>
        <div style={s.tabList}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                ...s.tabItem,
                background: tab === t.id ? '#31312F' : 'transparent',
                color: tab === t.id ? '#FFFFEB' : 'rgba(255,255,235,0.5)',
              }}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, opacity: 0.3, padding: '0 12px' }}>Whispr Beta 0.2.0</div>
      </div>

      {/* Content */}
      <div style={s.content}>
        {/* ═══ GENERAL ═══ */}
        {tab === 'general' && (
          <GeneralSettings
            userName={userName} setUserName={setUserName}
            userContext={userContext} setUserContext={setUserContext}
            musicPlatform={musicPlatform} setMusicPlatform={setMusicPlatform}
            favoritePlaylist={favoritePlaylist} setFavoritePlaylist={setFavoritePlaylist}
            autoStart={autoStart} setAutoStart={setAutoStart}
          />
        )}

        {/* ═══ AI MODELS ═══ */}
        {tab === 'ai' && (
          <AITab 
            installedModels={installedModels} downloadingModel={downloadingModel} downloadProgress={downloadProgress}
            setDownloadingModel={setDownloadingModel} setDownloadProgress={setDownloadProgress} setInstalledModels={setInstalledModels}
            prefFast={prefFast} setPrefFast={setPrefFast}
            prefHeavy={prefHeavy} setPrefHeavy={setPrefHeavy}
            prefMath={prefMath} setPrefMath={setPrefMath}
            prefCode={prefCode} setPrefCode={setPrefCode}
            prefHistory={prefHistory} setPrefHistory={setPrefHistory}
            prefBusiness={prefBusiness} setPrefBusiness={setPrefBusiness}
            ollamaModel={ollamaModel} setOllamaModel={setOllamaModel}
            useSpecialized={useSpecialized} setUseSpecialized={setUseSpecialized}
            DevBanner={DevBanner}
          />
        )}

        {/* ═══ SHORTCUTS ═══ */}
        {tab === 'shortcuts' && (
          <div>
            <h3 style={s.sectionTitle}>Keyboard Shortcuts</h3>
            <p style={s.sectionDesc}>Customize how you summon the Whispr Dynamic Bar on your desktop.</p>
            <div style={s.field}>
              <label style={s.label}>Toggle Dynamic Bar (Primary)</label>
              <div style={s.keybindBox}>
                <span style={{
                  ...s.keybindText,
                  background: isListening ? '#4ADE8022' : '#222',
                  border: isListening ? '1px solid #4ADE80' : '1px solid #2A2A2A',
                  color: isListening ? '#4ADE80' : '#FFFFEB',
                  animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}>{isListening ? 'Press keys...' : keybind}</span>
                <button onClick={() => setIsListening(true)} style={s.keybindBtn}>Change</button>
                <button onClick={() => {
                  setKeybind('Ctrl + I');
                  localStorage.setItem('whispr_global_shortcut', 'Ctrl + I');
                  window.electronAPI?.updateShortcut?.('Ctrl + I');
                  setIsListening(false);
                }} style={{ ...s.keybindBtn, color: '#FF3B30', borderColor: '#FF3B3044' }}>Reset</button>
              </div>
              <span style={s.hint}>{isListening ? '⌨️ Press the new key combination now...' : 'Secondary shortcut Alt + Space is also always active.'}</span>
            </div>
          </div>
        )}

        {/* ═══ VOICE ═══ */}
        {tab === 'voice' && (
          <div>
            <DevBanner />
            <h3 style={s.sectionTitle}>Voice Activation</h3>
            <p style={s.sectionDesc}>Use voice commands to trigger Whispr hands-free. Wake word detection, speech-to-text input, and text-to-speech output are planned for a future release.</p>
            <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
              <Toggle label="Enable wake word detection" value={false} onChange={() => {}} desc="Say 'Hey Whispr' to activate" />
              <hr style={s.divider} />
              <Toggle label="Read responses aloud" value={false} onChange={() => {}} desc="Text-to-speech for all AI responses" />
            </div>
          </div>
        )}

        {/* ═══ SECURITY ═══ */}
        {tab === 'security' && (
          <div>
            <h3 style={s.sectionTitle}>Permissions & Safety</h3>
            <p style={s.sectionDesc}>Control what Whispr can access and automate on your Windows system.</p>
            <Toggle label="Confirm before opening applications" value={confirmApps} onChange={v => { setConfirmApps(v); localStorage.setItem('whispr_sec_apps', String(v)); }} desc="Whispr will log and confirm before launching external apps." />
            <Toggle label="Confirm before visiting sensitive sites" value={confirmSensitive} onChange={v => { setConfirmSensitive(v); localStorage.setItem('whispr_sec_sensitive', String(v)); }} desc="Blocks banking, password managers, and financial sites without approval." />
            <Toggle label="Confirm before system actions" value={confirmSystem} onChange={v => { setConfirmSystem(v); localStorage.setItem('whispr_sec_system', String(v)); }} desc="System volume, window management, and lock commands." />
            
            <div style={{ marginTop: 16, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Shield size={16} color="#4ADE80" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>AI Safety Filter Active</span>
              </div>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.4 }}>
                Whispr runs a strict native safety filter to gracefully block requests involving profanity, hate speech, or inappropriate material.
              </p>
            </div>
            <hr style={s.divider} />
            <h3 style={s.sectionTitle}>Screen & Automation Control</h3>
            <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Whispr Vision (Multi-Monitor Screen Reading)</div>
                <div style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600, background: '#4ADE8015', padding: '2px 8px', borderRadius: 4 }}>ACTIVE · LLAVA READY</div>
              </div>
              <Toggle 
                label="Enable Whispr Vision" 
                value={visionEnabled} 
                onChange={(val) => {
                  setVisionEnabled(val);
                  localStorage.setItem('whispr_vision_enabled', val.toString());
                  // Automatically enable ALL detected monitors when the user turns Whispr Vision ON
                  if (val) {
                    if (monitors.length > 0) {
                      const allIds = monitors.map(m => m.id);
                      setAllowedMonitors(allIds);
                      localStorage.setItem('whispr_allowed_monitors', JSON.stringify(allIds));
                      localStorage.setItem('whispr_monitors_initialized', 'true');
                    } else {
                      window.electronAPI?.getMonitors?.().then((detected: Array<{ id: string; name: string }>) => {
                        setMonitors(detected);
                        const allIds = detected.map(m => m.id);
                        setAllowedMonitors(allIds);
                        localStorage.setItem('whispr_allowed_monitors', JSON.stringify(allIds));
                        localStorage.setItem('whispr_monitors_initialized', 'true');
                      });
                    }
                  }
                }} 
                desc="Allow Whispr to capture screenshots when you ask 'What is on my screen?'. Automatically enables all monitors when turned on." 
              />
              
              {visionEnabled && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #222' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 11, color: '#A0A0A5', fontWeight: 600 }}>
                      Active Monitors ({allowedMonitors.length}/{monitors.length} enabled — toggle off any monitor manually):
                    </span>
                    {monitors.length > 1 && (
                      <button
                        onClick={() => {
                          const allIds = monitors.map(m => m.id);
                          setAllowedMonitors(allIds);
                          localStorage.setItem('whispr_allowed_monitors', JSON.stringify(allIds));
                        }}
                        style={{ background: '#222', border: '1px solid #333', color: '#4ADE80', fontSize: 10, padding: '3px 8px', borderRadius: 6, cursor: 'pointer' }}
                      >
                        Enable All Monitors
                      </button>
                    )}
                  </div>
                  {monitors.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>Detecting monitors...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {monitors.map((m, idx) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A1A1A', padding: '10px 14px', borderRadius: 8, border: '1px solid #26262A' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Eye size={14} color={allowedMonitors.includes(m.id) ? '#4ADE80' : '#555'} />
                            <span style={{ fontSize: 12, color: '#FFFFEB', fontWeight: 500 }}>{m.name || `Monitor ${idx + 1}`}</span>
                            <span style={{ fontSize: 10, color: '#666', fontFamily: 'monospace' }}>({m.id})</span>
                          </div>
                          <Toggle 
                            label="" 
                            value={allowedMonitors.includes(m.id)} 
                            onChange={(val) => {
                              let next = [...allowedMonitors];
                              if (val) {
                                if (!next.includes(m.id)) next.push(m.id);
                              } else {
                                next = next.filter(id => id !== m.id);
                              }
                              setAllowedMonitors(next);
                              localStorage.setItem('whispr_allowed_monitors', JSON.stringify(next));
                              localStorage.setItem('whispr_monitors_initialized', 'true');
                            }} 
                            inline 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Whispr Control (Windows Desktop Automation)</div>
                <div style={{ fontSize: 10, color: allowControl ? '#4ADE80' : '#888', fontWeight: 600, background: allowControl ? '#4ADE8015' : '#222', padding: '2px 8px', borderRadius: 4 }}>
                  {allowControl ? 'ENABLED' : 'DISABLED'}
                </div>
              </div>
              <Toggle 
                label="Enable Whispr Control for Windows Automation" 
                value={allowControl} 
                onChange={(val) => {
                  setAllowControl(val);
                  localStorage.setItem('whispr_control_enabled', val.toString());
                  localStorage.setItem('whispr_allow_control', val.toString());
                }} 
                desc="Allows Whispr to execute native desktop actions via whispr_control tool." 
              />
              {allowControl && (
                <div style={{ marginTop: 12, padding: '10px 12px', background: '#161618', borderRadius: 8, border: '1px solid #26262C' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#A0A0A5', marginBottom: 6 }}>
                    <Terminal size={12} color="#4ADE80" /> Supported Voice / Text Commands:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, color: '#888' }}>
                    <span>• "Open Notepad / Calculator / Spotify"</span>
                    <span>• "Mute volume" / "Volume up"</span>
                    <span>• "Set volume to 50"</span>
                    <span>• "Minimize all windows" / "Lock my PC"</span>
                  </div>
                </div>
              )}
            </div>
            <hr style={s.divider} />
            <h3 style={s.sectionTitle}>Data Privacy</h3>
            <p style={s.sectionDesc}>All data stays on your machine. Whispr never sends personal data to external servers unless you configure a cloud API.</p>
            <button 
              onClick={() => {
                localStorage.removeItem('whispr_sessions');
                window.dispatchEvent(new Event('whispr_local_storage'));
              }}
              style={s.dangerBtn}>
              Clear All Chat History
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ ...s.dangerBtn, marginLeft: 8 }}>
              Reset All Settings
            </button>
          </div>
        )}

        {/* ═══ APPEARANCE ═══ */}
        {tab === 'appearance' && (
          <div>
            <h3 style={s.sectionTitle}>Theme</h3>
            <p style={s.sectionDesc}>Whispr is engineered for low-glare OLED dark mode on Windows.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 100, height: 72, borderRadius: 12, border: '2px solid #4ADE80',
                background: '#1A1A1A', color: '#FFFFEB', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600,
              }}>
                <div style={{ width: 24, height: 14, borderRadius: 7, background: '#4ADE80', opacity: 0.5 }} />
                Dark (Active)
              </div>
              <div style={{
                width: 100, height: 72, borderRadius: 12, border: '1px solid #2A2A2A',
                background: '#F5F5F0', color: '#1A1A1A', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
                opacity: 0.3, cursor: 'not-allowed', position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: -8, padding: '2px 6px', background: '#FB923C', color: '#fff', fontSize: 9, borderRadius: 4 }}>Soon</div>
                <div style={{ width: 24, height: 14, borderRadius: 7, background: '#1A1A1A', opacity: 0.3 }} />
                Light
              </div>
            </div>

            <hr style={s.divider} />
            <h3 style={s.sectionTitle}>Animations & Motion Control</h3>
            <p style={s.sectionDesc}>
              Fine-tune or disable animations across the Dynamic Bar and Dashboard. Changes apply immediately without restarting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#121214', border: '1px solid #26262A', borderRadius: 12, padding: '12px 16px' }}>
              <Toggle
                label="Enable All UI Animations (Master Switch)"
                value={masterAnimations}
                onChange={handleMasterAnimChange}
                desc="Master toggle for all motion effects. Turning this off makes every transition instantaneous."
              />
              <hr style={{ ...s.divider, margin: '8px 0' }} />
              <div style={{ opacity: masterAnimations ? 1 : 0.45, transition: 'opacity 0.2s' }}>
                <Toggle
                  label="Dynamic Bar Orb Entrance Animation"
                  value={masterAnimations && dynamicAnimations}
                  onChange={handleDynamicAnimChange}
                  desc="Morph from the glowing orb into the input pill when summoned with Ctrl+I or Alt+Space."
                />
                <Toggle
                  label="Spring Physics & Elastic Bounce"
                  value={masterAnimations && springPhysics}
                  onChange={handleSpringPhysicsChange}
                  desc="Use natural spring physics when resizing pills. Disable for fast linear transitions."
                />
                <Toggle
                  label="Widget Card Stack & Expand Animations"
                  value={masterAnimations && pillAnimations}
                  onChange={handlePillAnimChange}
                  desc="Smoothly animate height and card stacking when expanding Weather, Stocks, Sports, or News."
                />
                <Toggle
                  label="Chat Message & Sidebar Transitions"
                  value={masterAnimations && chatAnimations}
                  onChange={handleChatAnimChange}
                  desc="Animate message bubbles and view transitions inside the Main Dashboard."
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══ NOTIFICATIONS ═══ */}
        {tab === 'notifications' && (
          <div>
            <DevBanner />
            <h3 style={s.sectionTitle}>Notification Integration</h3>
            <p style={s.sectionDesc}>Show real-time notifications from connected services on the Dynamic Bar. This feature requires native OS notification forwarding which is under development.</p>
            <div style={{ opacity: 0.4, pointerEvents: 'none' }}>
              <Toggle label="Show notifications on Dynamic Bar" value={notifications} onChange={setNotifications} />
              <hr style={s.divider} />
              <h3 style={s.sectionTitle}>Connected Apps</h3>
              {[
                { name: 'Gmail', color: '#EA4335' },
                { name: 'Slack', color: '#4A154B' },
                { name: 'Spotify', color: '#1DB954' },
                { name: 'Google Calendar', color: '#4285F4' },
                { name: 'Discord', color: '#5865F2' },
              ].map(app => (
                <div key={app.name} style={s.appRow}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: app.color }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{app.name}</span>
                  <button style={s.keybindBtn}>Connect</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ WIDGETS INDEX ═══ */}
        {tab === 'widgets' && (
          <div>
            <h3 style={s.sectionTitle}>Widgets Index & Live Previews</h3>
            <p style={s.sectionDesc}>
              All 14 interactive Whispr widgets with their latest UI updates. Try any of the example prompts in the Dynamic Bar or Chat Dashboard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {[
                { name: 'Weather (Open-Meteo Live)', cmd: '"What\'s the weather in Chicago?"', status: 'Live · Keyless', statusColor: '#4ADE80', component: <WeatherPill data={MOCK_WEATHER} defaultExpanded={true} /> },
                { name: 'Stocks & Crypto (Yahoo Finance + CoinCap)', cmd: '"Check NVDA stock" or "Price of Bitcoin"', status: 'Live · Keyless', statusColor: '#4ADE80', component: <StocksPill data={MOCK_STOCKS} defaultExpanded={true} /> },
                { name: 'Sports Scoreboard (ESPN Live)', cmd: '"What are the latest NBA scores?"', status: 'Live · Keyless', statusColor: '#4ADE80', component: <SportsPill data={MOCK_SPORTS} defaultExpanded={true} /> },
                { name: 'Google News Feed (Topic Tabs & Previews)', cmd: '"What\'s the top tech news today?"', status: 'Live · Keyless', statusColor: '#4ADE80', component: <NewsPill data={MOCK_NEWS} defaultExpanded={true} /> },
                { name: 'Timer & Countdown', cmd: '"Set a timer for 1 minute"', status: 'Interactive', statusColor: '#FF9500', component: <TimerPill data={{ seconds: 60, autoStart: false }} /> },
                { name: 'Tasks & To-Do List', cmd: '"Show my tasks" or "Add a task to buy groceries"', status: 'Persistent', statusColor: '#FF9500', component: <TasksPill defaultExpanded={true} /> },
                { name: 'Multi-Language Translator (Native Script + Phonetics)', cmd: '"Translate \'Good morning, how are you?\' to Spanish and Japanese"', status: 'Live · GTX + AI', statusColor: '#4ADE80', component: <TranslationPill data={MOCK_TRANSLATION} /> },
                { name: 'System & RAM Usage Monitor', cmd: '"Check my system health and RAM usage"', status: 'Live OS Telemetry', statusColor: '#60A5FA', component: <SystemPill data={MOCK_SYSTEM} defaultExpanded={true} /> },
                { name: 'System Health & AI Diagnostics', cmd: '"Run system diagnostics"', status: 'Live Telemetry', statusColor: '#4ADE80', component: <ConnectivityPill data={MOCK_HEALTH} /> },
                { name: 'Music & Spotify Controller (Windows SMTC)', cmd: '"What song is playing right now?"', status: 'Native Windows SMTC', statusColor: '#34D399', component: <MusicPill data={MOCK_MUSIC} defaultExpanded={true} /> },
                { name: 'Scientific Calculator ( + Desmos Plotter in Chat)', cmd: '"Open calculator" or "Plot y = sin(x) * x"', status: 'Desmos + Local', statusColor: '#60A5FA', component: <CalculatorPill defaultExpanded={true} /> },
                { name: 'Currency Converter', cmd: '"Convert 100 USD to EUR"', status: 'Live Exchange Rates', statusColor: '#4ADE80', component: <CurrencyPill data={MOCK_CURRENCY} defaultExpanded={true} /> },
                { name: 'Calendar & Schedule', cmd: '"Show my schedule"', status: 'Local', statusColor: '#A78BFA', component: <CalendarPill /> },
                { name: 'Flight Tracker', cmd: '"Check flight AA 100"', status: 'Preview', statusColor: '#FB923C', component: <FlightPill /> },
              ].map(w => (
                <div key={w.name} style={{ background: '#111113', border: '1px solid #2A2A2E', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #1E1E22' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFEB' }}>{w.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 6, background: w.statusColor + '18', color: w.statusColor }}>{w.status}</span>
                  </div>
                  <div style={{ background: '#18181A', maxHeight: 440, overflowY: 'auto' }}>
                    {w.component}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #1E1E22', background: '#141416' }}>
                    <span style={{ fontSize: 11, color: '#777' }}>Try command: <span style={{ color: '#4ADE80', fontWeight: 600 }}>{w.cmd}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SERVICES & API INTEGRATIONS ═══ */}
        {tab === 'services' && (
          <div>
            <h3 style={s.sectionTitle}>Built-In Zero-Config API Integrations</h3>
            <p style={s.sectionDesc}>
              These live integrations are pre-connected and work out-of-the-box with <strong>zero API keys required</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                { name: 'Open-Meteo Weather & Geocoding', desc: 'Exact city weather, hourly & 7-day forecasts' },
                { name: 'Yahoo Finance + CoinCap Crypto', desc: 'Real-time stocks, Bitcoin/crypto & company logos' },
                { name: 'Google News RSS Sections', desc: 'Live Technology, AI, Business, Science & World news' },
                { name: 'ESPN Live Scoreboard API', desc: 'Real-time NBA, NFL, MLB, NHL, Soccer & F1 scores' },
                { name: 'Google Translate GTX Engine', desc: 'Multi-language native script + phonetic romaji' },
                { name: 'Desmos Graphing Calculator API', desc: 'Interactive 2D function plotting & zoom in chat' },
                { name: 'DuckDuckGo + Wikipedia Search', desc: 'Keyless live web & encyclopedia lookup' },
                { name: 'ExchangeRate-API Currency', desc: 'Live global fiat currency conversion rates' },
              ].map(svc => (
                <div key={svc.name} style={{ background: '#121215', border: '1px solid #26262C', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <CheckCircle2 size={15} color="#4ADE80" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFEB' }}>{svc.name}</div>
                    <div style={{ fontSize: 11, color: '#8A8A92', marginTop: 2 }}>{svc.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <hr style={s.divider} />
            <h3 style={s.sectionTitle}>Optional Custom API Key Overrides</h3>
            <p style={s.sectionDesc}>
              Only needed if you prefer to route requests through your own personal API accounts instead of the built-in keyless providers.
            </p>

            {/* OpenWeatherMap Optional Override */}
            <div style={{ ...s.field, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, maxWidth: 440 }}>
                <label style={{ ...s.label, margin: 0 }}>OpenWeatherMap API Key (Optional Override)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {apiWeather && (
                    <button onClick={() => {
                      setApiWeather('');
                      localStorage.removeItem('whispr_api_weather');
                      window.electronAPI?.updateApiKeys?.({ weather: '' });
                    }} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px', color: '#FF453A' }}>Remove</button>
                  )}
                  <button onClick={() => window.electronAPI?.openExternal('https://home.openweathermap.org/api_keys')} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px' }}>Get Key</button>
                </div>
              </div>
              <input 
                style={s.input} 
                type="password" 
                placeholder="Leave blank to use built-in Open-Meteo" 
                value={apiWeather}
                onChange={e => { 
                  const val = e.target.value;
                  setApiWeather(val); 
                  localStorage.setItem('whispr_api_weather', val);
                  window.electronAPI?.updateApiKeys?.({ weather: val });
                }}
              />
            </div>

            {/* Finnhub Optional Override */}
            <div style={{ ...s.field, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, maxWidth: 440 }}>
                <label style={{ ...s.label, margin: 0 }}>Finnhub Stocks API Key (Optional Override)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {apiStocks && (
                    <button onClick={() => {
                      setApiStocks('');
                      localStorage.removeItem('whispr_api_stocks');
                    }} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px', color: '#FF453A' }}>Remove</button>
                  )}
                  <button onClick={() => window.electronAPI?.openExternal('https://finnhub.io/')} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px' }}>Get Key</button>
                </div>
              </div>
              <input 
                style={s.input} 
                type="password" 
                placeholder="Leave blank to use built-in Yahoo Finance + CoinCap" 
                value={apiStocks}
                onChange={e => { 
                  const val = e.target.value;
                  setApiStocks(val); 
                  localStorage.setItem('whispr_api_stocks', val);
                }}
              />
            </div>

            {/* Serper.dev Optional Override */}
            <div style={{ ...s.field, marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, maxWidth: 440 }}>
                <label style={{ ...s.label, margin: 0 }}>Serper.dev Google Search Key (Optional Override)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {apiSearch && (
                    <button onClick={() => {
                      setApiSearch('');
                      localStorage.removeItem('whispr_api_search');
                    }} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px', color: '#FF453A' }}>Remove</button>
                  )}
                  <button onClick={() => window.electronAPI?.openExternal('https://serper.dev/')} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px' }}>Get Key</button>
                </div>
              </div>
              <input 
                style={s.input} 
                type="password" 
                placeholder="Leave blank to use built-in DuckDuckGo + Wikipedia" 
                value={apiSearch}
                onChange={e => { 
                  const val = e.target.value;
                  setApiSearch(val); 
                  localStorage.setItem('whispr_api_search', val);
                }}
              />
            </div>

            <hr style={s.divider} />
            <h3 style={s.sectionTitle}>Native Windows OS Integrations</h3>
            <p style={s.sectionDesc}>These integrations communicate directly with Windows 11 APIs locally.</p>
            <div style={s.appRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Windows SMTC Media & Spotify Controller</div>
                <div style={{ fontSize: 11, color: '#888' }}>Reads live track title, artist, timeline, and controls playback across Spotify and browsers.</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#4ADE80', background: '#4ADE8018', padding: '3px 8px', borderRadius: 6 }}>ACTIVE</span>
            </div>
            <div style={s.appRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>DesktopCapturer Multi-Monitor Vision</div>
                <div style={{ fontSize: 11, color: '#888' }}>Captures high-DPI screen frames for local LLaVA / Vision models when requested.</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: visionEnabled ? '#4ADE80' : '#888', background: visionEnabled ? '#4ADE8018' : '#222', padding: '3px 8px', borderRadius: 6 }}>
                {visionEnabled ? 'ACTIVE' : 'OFF'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toggle Component ───
function Toggle({ label, value, onChange, desc, inline }: { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string; inline?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: inline ? 'center' : 'flex-start', justifyContent: 'space-between', padding: inline ? 0 : '8px 0', gap: 12 }}>
      {label && (
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#FFFFEB', fontWeight: 500 }}>{label}</div>
          {desc && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{desc}</div>}
        </div>
      )}
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          background: value ? '#4ADE80' : '#2A2A2A',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#FFFFEB',
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  );
}

// ─── Styles ───
const s: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    background: '#1A1A1A',
    color: '#FFFFEB',
  },
  sidebar: {
    width: 220,
    borderRight: '1px solid #2A2A2A',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'none',
    border: 'none',
    color: '#FFFFEB',
    fontSize: 13,
    cursor: 'pointer',
    padding: '8px 10px',
    borderRadius: 8,
    opacity: 0.7,
    marginBottom: 8,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 16px 10px',
  },
  tabList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 12px',
    borderRadius: 8,
    border: 'none',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s',
    textAlign: 'left' as const,
  },
  content: {
    flex: 1,
    padding: '24px 32px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: '0 0 4px',
  },
  sectionDesc: {
    fontSize: 12,
    opacity: 0.55,
    margin: '0 0 16px',
    lineHeight: 1.5,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    opacity: 0.8,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    maxWidth: 440,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #2A2A2A',
    background: '#222',
    color: '#FFFFEB',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  },
  select: {
    width: '100%',
    maxWidth: 440,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #2A2A2A',
    background: '#222',
    color: '#FFFFEB',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
  },
  hint: {
    display: 'block',
    fontSize: 11,
    opacity: 0.45,
    marginTop: 6,
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #2A2A2A',
    margin: '20px 0',
  },
  keybindBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    maxWidth: 440,
  },
  keybindText: {
    padding: '8px 16px',
    borderRadius: 8,
    background: '#222',
    border: '1px solid #2A2A2A',
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#FFFFEB',
    fontWeight: 600,
    minWidth: 100,
    textAlign: 'center' as const,
  },
  keybindBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #2A2A2A',
    background: 'transparent',
    color: '#FFFFEB',
    fontSize: 12,
    cursor: 'pointer',
  },
  chip: {
    padding: '4px 12px',
    borderRadius: 8,
    background: '#31312F',
    fontSize: 12,
    color: '#FFFFEB',
  },
  dangerBtn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: '1px solid #FF3B30',
    background: 'transparent',
    color: '#FF3B30',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 8,
  },
  appRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid #222',
  },
};

// ─── Mock Data for Widgets Showcase ───
const MOCK_WEATHER = {
  location: 'Chicago, Illinois',
  temperature: '68°F',
  condition: 'Partly Cloudy',
  high: '72°F',
  low: '56°F',
  humidity: '52%',
  wind: '11 mph',
  hourly: [
    { time: 'Now', temp: '68°' },
    { time: '+1h', temp: '70°' },
    { time: '+2h', temp: '71°' },
    { time: '+3h', temp: '69°' },
    { time: '+4h', temp: '66°' },
  ]
};
const MOCK_SPORTS = {
  team: 'Los Angeles Lakers',
  league: 'NBA',
  games: [
    {
      id: '1', name: 'Mavericks at Lakers', status: 'Final', statusDetail: 'Final', isLive: false, isCompleted: true,
      home: { name: 'Los Angeles Lakers', abbreviation: 'LAL', score: '114', color: '#552583', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/lal.png', record: '48-34' },
      away: { name: 'Dallas Mavericks', abbreviation: 'DAL', score: '109', color: '#00538C', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/dal.png', record: '50-32' },
      venue: 'Crypto.com Arena', broadcast: 'ESPN', league: 'NBA'
    }
  ]
};
const MOCK_STOCKS = {
  stock: {
    symbol: 'NVDA', name: 'NVIDIA Corporation', price: 138.60, currency: 'USD', change: 3.42, changeAbs: 4.58, isUp: true,
    exchange: 'NASDAQ', marketState: 'REGULAR', sparkline: [131, 132.5, 134, 133.2, 135.8, 137.1, 138.6],
    high: 139.40, low: 133.10, volume: 64200000, fiftyTwoWeekHigh: 149.76, fiftyTwoWeekLow: 75.60,
    logoUrl: 'https://financialmodelingprep.com/image-stock/NVDA.png',
    sector: 'Technology', industry: 'Semiconductors', marketCap: '$3.39T'
  }
};
const MOCK_NEWS = {
  topic: 'Technology',
  articles: [
    { title: 'Next-Gen Local AI Models Run Faster Than Ever on Consumer GPUs', link: 'https://news.google.com', source: 'The Verge', date: '1h ago', snippet: 'New quantization breakthroughs allow 8B and 14B models to stream instantaneously on 8GB VRAM cards.', faviconUrl: 'https://www.google.com/s2/favicons?domain=theverge.com&sz=128' },
    { title: 'Open-Source Desktop Assistants Lead the 2026 Developer Wave', link: 'https://news.google.com', source: 'Ars Technica', date: '3h ago', snippet: 'Local-first privacy and native OS widgets are replacing browser-only chat tabs.', faviconUrl: 'https://www.google.com/s2/favicons?domain=arstechnica.com&sz=128' }
  ]
};
const MOCK_MUSIC = { isPreview: true, isPlaying: true, title: 'Designer', artist: 'Balu Brigada', album: 'Spotify', albumArt: '' };
const MOCK_CURRENCY = { from: 'USD', to: 'EUR', amount: 100, converted: 92.40, rate: 0.9240 };
const MOCK_SYSTEM = {
  isPreview: true,
  cpuPercent: 18, cpuCores: 16, cpuModel: 'Windows x64 Processor',
  memPercent: 48, usedMemGB: 7.7, totalMemGB: 16.0, diskFreeGB: 215.4, uptimeHours: 6.5, ollamaOnline: true
};
const MOCK_HEALTH = {
  isPreview: true,
  engine: 'online', models: { tools: true, chat: true },
  cpu: 18, mem: 48, memUsedGB: 7.7, memTotalGB: 16.0, diskFreeGB: 215.4
};
const MOCK_TRANSLATION = {
  sourceText: 'Good morning, how are you?',
  targetLanguage: 'Spanish and Japanese',
  translations: [
    { language: 'Spanish', translatedText: 'Buenos días, ¿cómo estás?' },
    { language: 'Japanese', translatedText: 'おはようございます、お元気ですか？', pronunciation: 'Ohayōgozaimasu, ogenkidesuka?' }
  ]
};

export default Settings;
