import { useState, useEffect } from 'react';
import { ArrowLeft, Cpu, Keyboard, Mic, Shield, Palette, Bell, Globe, Construction, Eye } from 'lucide-react';

// Import actual pill components for the widget showcase
import { WeatherPill } from './components/pills/WeatherPill';
import { SportsPill } from './components/pills/SportsPill';
import { StocksPill } from './components/pills/StocksPill';
import { NewsPill } from './components/pills/NewsPill';
import { MusicPill } from './components/pills/MusicPill';
import { CalculatorPill } from './components/pills/CalculatorPill';
import { CurrencyPill } from './components/pills/CurrencyPill';
import { SystemPill } from './components/pills/SystemPill';
import { TranslationPill } from './components/pills/TranslationPill';
import { CalendarPill } from './components/pills/CalendarPill';
import { TasksPill } from './components/pills/TasksPill';

import { GeneralSettings } from './components/settings/GeneralSettings';
import { AITab } from './components/settings/AITab';

interface SettingsProps {
  onClose: () => void;
  isOpen?: boolean;
  initialTab?: string;
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

function Settings({ onClose, isOpen = true, initialTab }: SettingsProps) {
  const [tab, setTab] = useState<string>(initialTab || 'general');
  const [userName, setUserName] = useState(() => localStorage.getItem('whispr_user_name') || '');
  const [userContext, setUserContext] = useState(() => localStorage.getItem('whispr_user_context') || '');
  const [favoritePlaylist, setFavoritePlaylist] = useState(() => localStorage.getItem('whispr_spotify_playlist') || '');
  const [ollamaModel, setOllamaModel] = useState(() => localStorage.getItem('whispr_ollama_model') || 'gemma4:e4b');
  
  // Custom Dynamic Models Configurations
  const [prefFast, setPrefFast] = useState(() => localStorage.getItem('whispr_pref_fast') || 'llama3.2');
  const [prefHeavy, setPrefHeavy] = useState(() => localStorage.getItem('whispr_pref_heavy') || 'qwen2.5:14b');
  
  // Advanced Specialty Models
  const [prefMath, setPrefMath] = useState(() => localStorage.getItem('whispr_pref_math') || '');
  const [prefCode, setPrefCode] = useState(() => localStorage.getItem('whispr_pref_code') || '');
  const [prefHistory, setPrefHistory] = useState(() => localStorage.getItem('whispr_pref_history') || '');
  const [prefBusiness, setPrefBusiness] = useState(() => localStorage.getItem('whispr_pref_business') || '');

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
  const [dynamicAnimations, setDynamicAnimations] = useState(() => {
    return localStorage.getItem('whispr_skip_dynamic_anim') !== 'true';
  });
  
  // API Keys
  const [apiWeather, setApiWeather] = useState(() => localStorage.getItem('whispr_api_weather') || '');

  // Whispr Vision & Control
  const [monitors, setMonitors] = useState<any[]>([]);
  const [visionEnabled, setVisionEnabled] = useState(() => localStorage.getItem('whispr_vision_enabled') !== 'false');
  const [allowedMonitors, setAllowedMonitors] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('whispr_allowed_monitors') || '[]'); } catch { return []; }
  });
  const [allowControl, setAllowControl] = useState(() => localStorage.getItem('whispr_allow_control') === 'true');

  useEffect(() => {
    if (tab === 'security' && (window as any).electronAPI?.getMonitors) {
      (window as any).electronAPI.getMonitors().then(setMonitors);
    }
  }, [tab]);

  const handleAnimChange = (val: boolean) => {
    setDynamicAnimations(val);
    localStorage.setItem('whispr_skip_dynamic_anim', val ? 'false' : 'true');
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
          if ((window as any).electronAPI?.updateShortcut) {
            (window as any).electronAPI.updateShortcut(newBind);
          }
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
    { id: 'services', label: 'Services', icon: <Globe size={16} /> },
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
        <div style={{ fontSize: 11, opacity: 0.3, padding: '0 12px' }}>Whispr Beta 0.0.1</div>
      </div>

      {/* Content */}
      <div style={s.content}>
        {/* ═══ GENERAL ═══ */}
        {tab === 'general' && (
          <GeneralSettings
            userName={userName} setUserName={setUserName}
            userContext={userContext} setUserContext={setUserContext}
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
            <p style={s.sectionDesc}>Customize how you invoke Whispr.</p>
            <div style={s.field}>
              <label style={s.label}>Toggle Dynamic Bar</label>
              <div style={s.keybindBox}>
                <span style={{
                  ...s.keybindText,
                  background: isListening ? '#4ADE8022' : '#222',
                  border: isListening ? '1px solid #4ADE80' : '1px solid #2A2A2A',
                  color: isListening ? '#4ADE80' : '#FFFFEB',
                  animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}>{isListening ? 'Press keys...' : keybind}</span>
                <button onClick={() => setIsListening(true)} style={s.keybindBtn}>Change</button>
                <button onClick={() => { setKeybind('Ctrl + I'); setIsListening(false); }} style={{ ...s.keybindBtn, color: '#FF3B30', borderColor: '#FF3B3044' }}>Reset</button>
              </div>
              <span style={s.hint}>{isListening ? '⌨️ Press the new key combination now...' : 'Press Change, then press your desired key combo.'}</span>
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
            <p style={s.sectionDesc}>Control what Whispr can do on your system.</p>
            <Toggle label="Confirm before opening applications" value={confirmApps} onChange={setConfirmApps} desc="Whispr will ask permission before launching any app." />
            <Toggle label="Confirm before visiting sensitive sites" value={confirmSensitive} onChange={setConfirmSensitive} desc="Blocks banking, password managers, and financial sites without approval." />
            <Toggle label="Confirm before system actions" value={confirmSystem} onChange={setConfirmSystem} desc="File operations, registry changes, and installations require approval." />
            
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
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Whispr Vision (Screen Reading)</div>
                <div style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600, background: '#4ADE8015', padding: '2px 8px', borderRadius: 4 }}>BETA</div>
              </div>
              <Toggle 
                label="Enable Whispr Vision" 
                value={visionEnabled} 
                onChange={(val) => {
                  setVisionEnabled(val);
                  localStorage.setItem('whispr_vision_enabled', val.toString());
                }} 
                desc="Allow Whispr to capture screenshots to understand visual context." 
              />
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#1A1100', border: '1px solid #3D2E00', borderRadius: 8 }}>
                <p style={{ fontSize: 11, color: '#FFB800', margin: 0, lineHeight: 1.5 }}>
                  ⚠️ <strong>Experimental:</strong> Multi-screen detection may not work reliably on all setups. Vision responses depend on the quality of the installed vision model. For best results, use <strong>llava</strong> or <strong>llama3.2-vision</strong>.
                </p>
              </div>
              
              {visionEnabled && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #222' }}>
                  <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Select which monitors Whispr is allowed to view:</p>
                  {monitors.length === 0 ? (
                    <div style={{ fontSize: 11, color: '#555', fontStyle: 'italic' }}>Detecting monitors...</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {monitors.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1A1A1A', padding: '8px 12px', borderRadius: 8, border: '1px solid #222' }}>
                          <span style={{ fontSize: 12, color: '#FFFFEB' }}>{m.name}</span>
                          <Toggle 
                            label="" 
                            value={allowedMonitors.includes(m.id)} 
                            onChange={(val) => {
                              let next = [...allowedMonitors];
                              if (val) next.push(m.id);
                              else next = next.filter(id => id !== m.id);
                              setAllowedMonitors(next);
                              localStorage.setItem('whispr_allowed_monitors', JSON.stringify(next));
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
                <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Whispr Control (Automation)</div>
                <div style={{ fontSize: 10, color: '#FB923C', fontWeight: 600, background: '#FB923C15', padding: '2px 8px', borderRadius: 4 }}>EXPERIMENTAL</div>
              </div>
              <Toggle 
                label="Allow Whispr to control your mouse & keyboard" 
                value={allowControl} 
                onChange={(val) => {
                  setAllowControl(val);
                  localStorage.setItem('whispr_allow_control', val.toString());
                }} 
                desc="When enabled, Whispr can execute multi-step macros and physically control your screen (requires confirmation per action)." 
              />
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
            <DevBanner />
            <h3 style={s.sectionTitle}>Theme</h3>
            <p style={s.sectionDesc}>Theme customization is coming soon. Currently running in Dark mode.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 100, height: 72, borderRadius: 12, border: '2px solid #FFFFEB',
                background: '#1A1A1A', color: '#FFFFEB', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
              }}>
                <div style={{ width: 24, height: 14, borderRadius: 7, background: '#FFFFEB', opacity: 0.3 }} />
                Dark
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
            <h3 style={s.sectionTitle}>Animations</h3>
            <Toggle label="Full dynamic bar animation (orb to pill)" value={dynamicAnimations} onChange={handleAnimChange} desc="If disabled, the bar will instantly pop in as a text input instead of expanding from an orb." />
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
            <h3 style={s.sectionTitle}>Widgets & Commands</h3>
            <p style={s.sectionDesc}>
              Whispr features dynamic, responsive widgets that magically appear based on context. 
              Below are live previews of each widget with mock data. Try the commands to trigger them.
            </p>

            {/* Widget showcase with actual pill components */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {[
                { name: 'Weather', cmd: '"Show the weather in Tokyo"', status: 'Live', statusColor: '#4ADE80', component: <WeatherPill data={MOCK_WEATHER} defaultExpanded={true} /> },
                { name: 'Sports', cmd: '"What is the Cowboys score?"', status: 'Live', statusColor: '#4ADE80', component: <SportsPill data={MOCK_SPORTS} defaultExpanded={true} /> },
                { name: 'Stocks', cmd: '"Check AAPL stock"', status: 'Live', statusColor: '#4ADE80', component: <StocksPill data={MOCK_STOCKS} defaultExpanded={true} /> },
                { name: 'News', cmd: '"What is the latest news?"', status: 'Live', statusColor: '#4ADE80', component: <NewsPill data={MOCK_NEWS} defaultExpanded={true} /> },
                { name: 'Music', cmd: '"What is playing?"', status: 'Native', statusColor: '#34D399', component: <MusicPill data={MOCK_MUSIC} defaultExpanded={true} /> },
                { name: 'Calculator', cmd: '"Open the calculator"', status: 'Local', statusColor: '#60A5FA', component: <CalculatorPill defaultExpanded={true} /> },
                { name: 'Currency', cmd: '"Convert 100 USD to EUR"', status: 'Live', statusColor: '#4ADE80', component: <CurrencyPill data={MOCK_CURRENCY} /> },
                { name: 'System Monitor', cmd: '"Open system health"', status: 'Local', statusColor: '#60A5FA', component: <SystemPill data={MOCK_SYSTEM} /> },
                { name: 'Translation', cmd: '"Translate this to French"', status: 'AI', statusColor: '#A78BFA', component: <TranslationPill /> },
                { name: 'Tasks', cmd: '"Show my tasks"', status: 'Local', statusColor: '#60A5FA', component: <TasksPill defaultExpanded={true} /> },
                { name: 'Calendar', cmd: '"Show my schedule"', status: 'Soon', statusColor: '#FB923C', component: <CalendarPill /> },
              ].map(w => (
                <div key={w.name} style={{ background: '#111', border: '1px solid #2A2A2A', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #1A1A1A' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#FFFFEB' }}>{w.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', padding: '2px 6px', borderRadius: 4, background: w.statusColor + '18', color: w.statusColor }}>{w.status}</span>
                    </div>
                  </div>
                  {/* Live pill preview */}
                  <div style={{ background: '#1A1A1A', maxHeight: 440, overflow: 'hidden' }}>
                    {w.component}
                  </div>
                  {/* Command hint */}
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #1A1A1A' }}>
                    <span style={{ fontSize: 11, color: '#555' }}>Try: <span style={{ color: '#4ADE80' }}>{w.cmd}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ SERVICES ═══ */}
        {tab === 'services' && (
          <div>
            <h3 style={s.sectionTitle}>API Integrations</h3>
            <p style={s.sectionDesc}>Whispr uses local components but requires external API keys to fetch live data. Your keys are <strong>never</strong> sent anywhere except directly to these service providers.</p>
            
            {/* OpenWeatherMap */}
            <div style={{ ...s.field, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={s.label}>OpenWeatherMap API Key</label>
                <button onClick={() => (window as any).electronAPI?.openExternal('https://home.openweathermap.org/api_keys')} style={{ ...s.keybindBtn, fontSize: 10, padding: '2px 6px' }}>Get Free Key</button>
              </div>
              <input 
                style={s.input} 
                type="password" 
                placeholder="Required for local forecast" 
                value={apiWeather}
                onChange={e => { 
                  const val = e.target.value;
                  setApiWeather(val); 
                  localStorage.setItem('whispr_api_weather', val);
                  if ((window as any).electronAPI?.updateApiKeys) {
                    (window as any).electronAPI.updateApiKeys({ weather: val });
                  }
                }}
              />
            </div>

            {/* Web Search — built-in, no key */}
            <div style={{ ...s.field, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={s.label}>Web Search (Built-in)</label>
                <span style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600, padding: '2px 8px', background: '#4ADE8018', borderRadius: 4 }}>No Key Needed</span>
              </div>
              <div style={{ ...s.input, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
                Powered by DuckDuckGo + Wikipedia (free, unlimited)
              </div>
            </div>

            {/* Live Stocks */}
            <div style={{ ...s.field, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={s.label}>Live Stocks</label>
                <div style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600, background: '#4ADE8015', padding: '2px 8px', borderRadius: 4 }}>NO KEY NEEDED</div>
              </div>
              <div style={{ ...s.input, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
                Powered by Yahoo Finance (free, real-time prices)
              </div>
            </div>

            {/* Live News */}
            <div style={{ ...s.field, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label style={s.label}>Live Breaking News</label>
                <div style={{ fontSize: 10, color: '#4ADE80', fontWeight: 600, background: '#4ADE8015', padding: '2px 8px', borderRadius: 4 }}>NO KEY NEEDED</div>
              </div>
              <div style={{ ...s.input, color: '#888', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', flexShrink: 0 }} />
                Powered by Google News RSS (free, top headlines)
              </div>
            </div>

            <hr style={s.divider} />
            <h3 style={s.sectionTitle}>Native Integrations</h3>
            <p style={s.sectionDesc}>These services bypass APIs and interact directly with your OS.</p>
            <div style={s.appRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Spotify Local Player</div>
                <div style={{ fontSize: 11, opacity: 0.4 }}>Controls your desktop Spotify app via native Windows powershell instantly.</div>
              </div>
              <Toggle label="" value={true} onChange={() => {}} inline />
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

// ─── Custom Dropdown ───
function Dropdown({ value, options, onChange }: { value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '10px 14px', borderRadius: 10, border: '1px solid #2A2A2A', background: '#222', color: '#FFFFEB', fontSize: 14, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}
      >
        <span>{selected.label}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>▼</span>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#222', border: '1px solid #2A2A2A', borderRadius: 10, overflow: 'hidden', zIndex: 10 }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#31312F'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              style={{ padding: '10px 14px', fontSize: 14, cursor: 'pointer', color: '#FFFFEB' }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
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
    opacity: 0.45,
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
    opacity: 0.7,
    marginBottom: 6,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #2A2A2A',
    background: '#222',
    color: '#FFFFEB',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  select: {
    width: '100%',
    maxWidth: 400,
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #2A2A2A',
    background: '#222',
    color: '#FFFFEB',
    fontSize: 14,
    fontFamily: 'inherit',
    outline: 'none',
  },
  hint: {
    display: 'block',
    fontSize: 11,
    opacity: 0.35,
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
    maxWidth: 400,
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
    borderBottom: '1px solid #1A1A1A',
  },
};

// ─── Mock Data for Widgets Showcase ───
const MOCK_WEATHER = { location: 'Tokyo, JP', temp: 68, feelsLike: 66, condition: 'Clear', humidity: 45, wind: 5, icon: '☀️', forecast: [{ day: 'Mon', high: 70, low: 58, icon: '☀️' }, { day: 'Tue', high: 65, low: 55, icon: '⛅' }, { day: 'Wed', high: 62, low: 52, icon: '🌧️' }, { day: 'Thu', high: 64, low: 54, icon: '⛅' }, { day: 'Fri', high: 68, low: 57, icon: '☀️' }], hourly: [] };
const MOCK_SPORTS = { team: 'Dallas Cowboys', league: 'NFL', games: [{ id: '1', name: 'Cowboys vs Eagles', status: 'Live', statusDetail: 'Q4 2:15', isLive: true, isCompleted: false, home: { name: 'Eagles', abbreviation: 'PHI', score: '24', color: '#004C54', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' }, away: { name: 'Cowboys', abbreviation: 'DAL', score: '27', color: '#041E42', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' }, venue: 'AT&T Stadium', broadcast: 'FOX', league: 'NFL' }], stats: { wins: 10, losses: 3 } };
const MOCK_STOCKS = { stock: { symbol: 'AAPL', name: 'Apple Inc.', price: 189.42, currency: 'USD', change: 1.24, changeAbs: 2.32, isUp: true, exchange: 'NASDAQ', marketState: 'Open', sparkline: [185, 186, 187, 186.5, 188, 187.5, 189, 189.42], high: 190.1, low: 186.8, volume: 52400000, fiftyTwoWeekHigh: 199.62, fiftyTwoWeekLow: 164.08 } };
const MOCK_NEWS = { articles: [{ title: 'AI breakthroughs in 2026', link: '#', source: 'Tech News', date: '2h ago' }, { title: 'Global markets hit record highs', link: '#', source: 'Finance Daily', date: '4h ago' }] };
const MOCK_MUSIC = { isPlaying: true, title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', albumArt: 'https://upload.wikimedia.org/wikipedia/en/e/e6/The_Weeknd_-_Blinding_Lights.png' };
const MOCK_CURRENCY = { from: 'USD', to: 'EUR', amount: 100, result: 92.4, rate: 0.924 };
const MOCK_SYSTEM = { cpu: 24, ram: 45, disk: 60 };

export default Settings;
