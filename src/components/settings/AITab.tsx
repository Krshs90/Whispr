import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Sparkles, Zap } from 'lucide-react';
import { s, Toggle } from './SettingsStyles';

export function Dropdown({ value, options, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((o: any) => o.value === value)?.label || value || 'Select model...';

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...s.input,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: '#222',
          border: '1px solid #333',
          textAlign: 'left'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} color="#888" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#1A1A1A',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 6,
              zIndex: 50,
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              maxHeight: 250,
              overflowY: 'auto'
            }}
          >
            {options.map((o: any) => (
              <div
                key={o.value}
                onClick={() => {
                  onChange(o.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: value === o.value ? '#2A2A2A' : 'transparent',
                  color: value === o.value ? '#FFFFEB' : '#888',
                  fontSize: 13,
                  fontWeight: value === o.value ? 600 : 400
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#2A2A2A'}
                onMouseLeave={e => e.currentTarget.style.background = value === o.value ? '#2A2A2A' : 'transparent'}
              >
                <span>{o.label}</span>
                {value === o.value && <Check size={14} color="#4ADE80" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LOCAL_MODEL_CATALOG = [
  { id: 'qwen3:8b', name: 'Qwen 3 (8B)', category: 'Recommended · 8GB VRAM', vram: '~5.2 GB', badgeColor: '#4ADE80', desc: 'Latest flagship 8B model — top-tier reasoning, coding, and fast responses' },
  { id: 'qwen3:4b', name: 'Qwen 3 (4B)', category: 'Ultra Fast', vram: '~2.6 GB', badgeColor: '#4ADE80', desc: 'Compact next-gen Qwen 3 model — instant token streaming with strong logic' },
  { id: 'gemma3:4b', name: 'Google Gemma 3 (4B)', category: 'Multimodal · Fast', vram: '~3.1 GB', badgeColor: '#60A5FA', desc: 'Google’s latest lightweight multimodal edge model (text + vision)' },
  { id: 'gemma3:12b', name: 'Google Gemma 3 (12B)', category: 'Multimodal · Pro', vram: '~8.1 GB', badgeColor: '#A855F7', desc: 'High-accuracy Google multimodal model for deep reasoning & visual analysis' },
  { id: 'qwen2.5-coder:7b', name: 'Qwen 2.5 Coder (7B)', category: 'Coding Specialist', vram: '~4.7 GB', badgeColor: '#3B82F6', desc: 'Best-in-class 7B coding & debugging agent that fits comfortably in 8GB VRAM' },
  { id: 'deepseek-r1:8b', name: 'DeepSeek R1 Distill (8B)', category: 'Reasoning & Math', vram: '~4.9 GB', badgeColor: '#F59E0B', desc: 'Chain-of-thought reasoning specialist for complex math, logic & proofs' },
  { id: 'llama3.2:latest', name: 'Llama 3.2 (3B)', category: 'Core Router', vram: '~2.0 GB', badgeColor: '#4ADE80', desc: 'Ultra-lightweight conversational & widget routing model' },
  { id: 'llama3:8b', name: 'Llama 3 (8B)', category: 'Balanced General', vram: '~4.7 GB', badgeColor: '#4ADE80', desc: 'Fast, dependable 8B model for everyday knowledge, science, and writing' },
  { id: 'codellama:latest', name: 'CodeLlama (7B)', category: 'Coding', vram: '~3.8 GB', badgeColor: '#3B82F6', desc: 'Fast local code generation and debugging assistant' },
  { id: 'phi4-mini', name: 'Microsoft Phi-4 Mini (3.8B)', category: 'Compact STEM', vram: '~2.5 GB', badgeColor: '#06B6D4', desc: 'High-density small language model tuned for logic and math' },
  { id: 'mistral:latest', name: 'Mistral (7B)', category: 'General Chat', vram: '~4.1 GB', badgeColor: '#60A5FA', desc: 'Crisp, low-latency instruction following and summarization' },
  { id: 'minicpm-v', name: 'MiniCPM-V 2.6 (8B)', category: 'Vision & OCR', vram: '~5.5 GB', badgeColor: '#EC4899', desc: 'High-resolution screen reading, OCR, and Whispr Vision analysis' },
  { id: 'llava:latest', name: 'LLaVA (7B)', category: 'Vision', vram: '~4.5 GB', badgeColor: '#EC4899', desc: 'Reliable visual assistant for Whispr Vision multi-monitor screen capture' },
  { id: 'llama3.2-vision', name: 'Llama 3.2 Vision (11B)', category: 'Vision Heavy', vram: '~7.9 GB', badgeColor: '#EC4899', desc: 'Meta’s multimodal vision model for UI and document understanding' },
  { id: 'phi4', name: 'Microsoft Phi-4 (14B)', category: 'Heavy Reasoning', vram: '~9.1 GB', badgeColor: '#A855F7', desc: '14B dense STEM and analytical model (12GB+ VRAM recommended)' },
  { id: 'qwen2.5:14b', name: 'Qwen 2.5 (14B)', category: 'Heavy Code/Math', vram: '~9.0 GB', badgeColor: '#A855F7', desc: '14B parameter coding & math powerhouse (12GB+ VRAM recommended)' },
];

export function AITab({
  installedModels, downloadingModel, downloadProgress, setDownloadingModel, setDownloadProgress, setInstalledModels,
  prefFast, setPrefFast,
  prefHeavy, setPrefHeavy,
  prefMath, setPrefMath,
  prefCode, setPrefCode,
  prefHistory, setPrefHistory,
  prefBusiness, setPrefBusiness,
  ollamaModel, setOllamaModel,
  useSpecialized, setUseSpecialized,
  DevBanner
}: any) {
  return (
    <div>
      <h3 style={s.sectionTitle}>How Whispr Uses AI</h3>
      <p style={s.sectionDesc}>
        Whispr runs 100% locally using <strong style={{ color: '#FFFFEB' }}>Ollama</strong>. Queries are routed automatically to VRAM-friendly models with a 10-second watchdog fallback so your assistant never hangs.
      </p>

      {/* Hardware Managed Routing */}
      <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Hardware-Mapped Model Routing</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                const bestFast = installedModels.find((m: string) => m.startsWith('llama3.2')) || installedModels[0] || 'llama3.2:latest';
                const bestHeavy = installedModels.find((m: string) => m.startsWith('llama3:8b') || m.startsWith('qwen3:8b') || m.startsWith('mistral')) || bestFast;
                const bestCode = installedModels.find((m: string) => m.startsWith('codellama') || m.startsWith('qwen2.5-coder')) || bestHeavy;
                setPrefFast(bestFast); localStorage.setItem('whispr_pref_fast', bestFast);
                setPrefHeavy(bestHeavy); localStorage.setItem('whispr_pref_heavy', bestHeavy);
                setPrefCode(bestCode); localStorage.setItem('whispr_pref_code', bestCode);
                setPrefMath(bestHeavy); localStorage.setItem('whispr_pref_math', bestHeavy);
                setOllamaModel(bestFast); localStorage.setItem('whispr_ollama_model', bestFast);
              }}
              style={{
                background: 'rgba(74, 222, 128, 0.14)', border: '1px solid rgba(74, 222, 128, 0.35)',
                color: '#4ADE80', padding: '5px 10px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              <Zap size={12} /> Optimize for 8GB VRAM (No Lag)
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('whispr_hw_scanned');
                window.location.reload();
              }}
              style={{ background: '#222', border: '1px solid #333', color: '#FFFFEB', padding: '5px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer' }}>
              Re-run Inspection
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          <div style={{ background: '#1A1A1A', borderRadius: 8, padding: 12, border: '1px solid #2A2A2A' }}>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Fast Model</div>
            <Dropdown 
              value={prefFast}
              options={[
                { value: prefFast, label: prefFast },
                ...installedModels.filter((m: string) => m !== prefFast).map((m: string) => ({ value: m, label: m }))
              ]}
              onChange={(val: string) => {
                setPrefFast(val);
                localStorage.setItem('whispr_pref_fast', val);
              }}
            />
            <div style={{ color: '#666', fontSize: 11, marginTop: 8 }}>Used for casual chat, quick explanations, and live widgets.</div>
            <div style={{ color: '#4ADE80', fontSize: 10, marginTop: 8 }}>Recommended (8GB GPU): llama3.2:latest</div>
          </div>
          <div style={{ background: '#1A1A1A', borderRadius: 8, padding: 12, border: '1px solid #2A2A2A' }}>
            <div style={{ color: '#888', fontSize: 11, textTransform: 'uppercase', marginBottom: 8, fontWeight: 600 }}>Heavy Model</div>
            <Dropdown 
              value={prefHeavy}
              options={[
                { value: prefHeavy, label: prefHeavy },
                ...installedModels.filter((m: string) => m !== prefHeavy).map((m: string) => ({ value: m, label: m }))
              ]}
              onChange={(val: string) => {
                setPrefHeavy(val);
                localStorage.setItem('whispr_pref_heavy', val);
              }}
            />
            <div style={{ color: '#666', fontSize: 11, marginTop: 8 }}>Used for deep multi-step analysis and complex tasks.</div>
            <div style={{ color: '#A855F7', fontSize: 10, marginTop: 8 }}>Recommended (8GB GPU): llama3:8b or qwen3:8b</div>
          </div>
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Fallback / Default Model</label>
        <Dropdown
          value={ollamaModel}
          onChange={(v: string) => { setOllamaModel(v); localStorage.setItem('whispr_ollama_model', v); }}
          options={installedModels.map((m: string) => ({ value: m, label: m }))}
        />
        <span style={s.hint}>Whispr falls back to this model if a preferred model is busy or unavailable.</span>
      </div>

      <hr style={{ borderColor: '#333', margin: '28px 0' }} />

      <h3 style={s.sectionTitle}>Specialized Domain Routing</h3>
      <p style={s.sectionDesc}>When enabled, Whispr uses tailored system prompts for Math, Science, History, Translation, Business, Engineering, and Gaming queries.</p>
      <Toggle 
        label="Enable specialized domain routing" 
        value={useSpecialized} 
        onChange={(v) => { setUseSpecialized(v); localStorage.setItem('whispr_use_specialized', v ? 'true' : 'false'); }}
      />
      
      {useSpecialized && (
        <div style={{ marginTop: 16, background: '#1A1A1A', border: '1px solid #2A2A2A', padding: 16, borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: '#FFFFEB', fontWeight: 600 }}>Advanced: Manual Domain Overrides</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ fontSize: 10, color: '#888', alignSelf: 'center', marginRight: 4 }}>Presets:</span>
              {[
                { id: '8gb', label: '8GB VRAM Safe', p: { f: 'llama3.2:latest', h: 'llama3:8b', m: 'llama3:8b', c: 'codellama:latest', hi: 'llama3.2:latest', b: 'mistral:latest' } },
                { id: '16gb', label: '16GB+ VRAM Pro', p: { f: 'qwen3:8b', h: 'qwen2.5:14b', m: 'qwen2.5:14b', c: 'qwen2.5-coder:7b', hi: 'llama3:8b', b: 'qwen3:8b' } }
              ].map(preset => (
                <button 
                  key={preset.id}
                  onClick={() => {
                    setPrefFast(preset.p.f); localStorage.setItem('whispr_pref_fast', preset.p.f);
                    setPrefHeavy(preset.p.h); localStorage.setItem('whispr_pref_heavy', preset.p.h);
                    setPrefMath(preset.p.m); localStorage.setItem('whispr_pref_math', preset.p.m);
                    setPrefCode(preset.p.c); localStorage.setItem('whispr_pref_code', preset.p.c);
                    setPrefHistory(preset.p.hi); localStorage.setItem('whispr_pref_history', preset.p.hi);
                    setPrefBusiness(preset.p.b); localStorage.setItem('whispr_pref_business', preset.p.b);
                  }}
                  style={{ background: '#222', border: '1px solid #333', color: '#FFFFEB', padding: '4px 8px', fontSize: 10, borderRadius: 6, cursor: 'pointer' }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
            {[
              ['Math', prefMath, setPrefMath, 'whispr_pref_math', 'deepseek-r1:8b or llama3:8b', '#A855F7'],
              ['Code', prefCode, setPrefCode, 'whispr_pref_code', 'codellama:latest or qwen2.5-coder:7b', '#3B82F6'],
              ['History', prefHistory, setPrefHistory, 'whispr_pref_history', 'llama3:8b or mistral:latest', '#FB923C'],
              ['Business', prefBusiness, setPrefBusiness, 'whispr_pref_business', 'mistral:latest or qwen3:8b', '#4ADE80']
            ].map(([label, val, setter, storeKey, rec, color], i) => (
              <div key={i}>
                 <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>{label as string} Override</label>
                 <Dropdown 
                    value={val as string}
                    options={[
                      { value: '', label: 'Auto (Follows Fast/Heavy)' },
                      ...installedModels.map((m: string) => ({ value: m, label: m }))
                    ]}
                    onChange={(newVal: string) => {
                      (setter as any)(newVal);
                      localStorage.setItem(storeKey as string, newVal);
                    }}
                  />
                 <div style={{ fontSize: 9, color: color as string, marginTop: 4 }}>Recommended: {rec as string}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr style={{ borderColor: '#333', margin: '28px 0' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={16} color="#4ADE80" />
        <h3 style={{ ...s.sectionTitle, margin: 0 }}>Local Model Library (2026 Updated)</h3>
      </div>
      <p style={{ ...s.sectionDesc, marginTop: 4 }}>
        Download the latest local models directly into Ollama. Models under <strong>6 GB VRAM</strong> run at maximum speed on 8GB GPUs without system RAM spillover.
      </p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 14 }}>
        {LOCAL_MODEL_CATALOG.map(agent => {
          const baseId = agent.id.split(':')[0].toLowerCase();
          const isInstalled = installedModels.some((installed: string) => {
            const instLower = installed.toLowerCase();
            return instLower === agent.id.toLowerCase() || instLower.startsWith(agent.id.toLowerCase()) || (agent.id.endsWith(':latest') && instLower.startsWith(baseId + ':'));
          });
          const isDownloading = downloadingModel === agent.id;
          
          return (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#111113', borderRadius: 10, border: '1px solid #242428', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ color: '#FFFFEB', fontSize: 13, fontWeight: 700 }}>{agent.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: agent.badgeColor,
                    background: `${agent.badgeColor}18`, border: `1px solid ${agent.badgeColor}35`,
                    padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase'
                  }}>
                    {agent.category}
                  </span>
                  <span style={{ fontSize: 10, color: '#6A6A72', fontFamily: 'monospace' }}>VRAM: {agent.vram}</span>
                </div>
                <div style={{ color: '#8A8A92', fontSize: 11, marginTop: 3 }}>{agent.desc}</div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {isInstalled ? (
                  <div style={{ color: '#4ADE80', fontSize: 11, fontWeight: 700, background: 'rgba(74, 222, 128, 0.12)', padding: '5px 10px', borderRadius: 6 }}>
                    ✓ Installed
                  </div>
                ) : isDownloading ? (
                  <div style={{ color: '#A855F7', fontSize: 11, fontWeight: 600 }}>Downloading... {downloadProgress.toFixed(0)}%</div>
                ) : (
                  <button 
                    onClick={() => {
                      if (downloadingModel) return;
                      setDownloadingModel(agent.id);
                      setDownloadProgress(0);
                      const unbindProg = window.electronAPI?.onPullProgress((data: any) => {
                        if (data.status === 'success') {
                          setDownloadingModel(null);
                          window.electronAPI?.getInstalledModels().then(setInstalledModels);
                          cleanup();
                        } else if (data.total && data.completed) {
                          setDownloadProgress((data.completed / data.total) * 100);
                        }
                      });
                      const unbindErr = window.electronAPI?.onPullError(() => {
                        setDownloadingModel(null);
                        cleanup();
                      });
                      const cleanup = () => { if (unbindProg) unbindProg(); if (unbindErr) unbindErr(); };
                      window.electronAPI?.pullModel(agent.id);
                    }}
                    style={{ background: '#222228', border: '1px solid #35353E', color: '#FFFFEB', padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Install
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <hr style={{ borderColor: '#333', margin: '32px 0' }} />
      <h3 style={s.sectionTitle}>Cloud Model (Coming Soon)</h3>
      <DevBanner />
    </div>
  );
}
