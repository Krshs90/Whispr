import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
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
        Whispr runs 100% locally using <strong style={{ color: '#FFFFEB' }}>Ollama</strong>. You need to install Ollama and pull at least one model. 
        Whispr intelligently routes your queries to the best available model:
      </p>

      {/* Hardware Managed Routing */}
      <div style={{ background: '#0D0D0D', border: '1px solid #2A2A2A', borderRadius: 12, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FFFFEB' }}>Hardware-Mapped Model Routing</div>
          <button 
            onClick={() => {
              localStorage.removeItem('whispr_hw_scanned');
              window.location.reload();
            }}
            style={{ background: '#222', border: '1px solid #333', color: '#FFFFEB', padding: '4px 10px', fontSize: 11, borderRadius: 6, cursor: 'pointer' }}>
            Re-run Inspection
          </button>
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
            <div style={{ color: '#666', fontSize: 11, marginTop: 8 }}>Used for casual chat, widgets, and live data lookup.</div>
            <div style={{ color: '#4ADE80', fontSize: 10, marginTop: 8 }}>System Recommended: llama3.2</div>
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
            <div style={{ color: '#666', fontSize: 11, marginTop: 8 }}>Used for coding, complex math, and deep analysis.</div>
            <div style={{ color: '#A855F7', fontSize: 10, marginTop: 8 }}>System Recommended: qwen2.5:14b</div>
          </div>
        </div>
      </div>

      <div style={s.field}>
        <label style={s.label}>Fallback / Default Model</label>
        <Dropdown
          value={ollamaModel}
          onChange={(v: string) => { setOllamaModel(v); localStorage.setItem('whispr_ollama_model', v); }}
          options={[
            ...installedModels.map((m: string) => {
              const knownLabels: Record<string, string> = {
                'gemma4:e4b': 'Gemma 4 E4B — Recommended (Edge)',
                'llama3.2': 'Llama 3.2 (1-3B) — Lightweight',
                'hermes3': 'Hermes 3 (8B) — Agentic / Tool Use',
                'phi4-mini': 'Phi-4 Mini (3.8B) — Lightweight',
                'mistral-nemo': 'Mistral Nemo (12B) — Balanced',
                'gemma4:12b': 'Gemma 4 (12B) — Multimodal',
                'qwen2.5:14b': 'Qwen 2.5 (14B) — Heavy Code/Math',
                'qwen3': 'Qwen 3 — Best Quality',
                'deepseek-r1': 'DeepSeek R1 — Reasoning',
                'deepseek-coder': 'DeepSeek Coder — Programming',
                'llama4': 'Llama 4 Scout — Multimodal MoE',
              };
              // Match known labels loosely based on prefix
              const key = Object.keys(knownLabels).find(k => m.toLowerCase().startsWith(k));
              return { value: m, label: key ? knownLabels[key] : m };
            })
          ]}
        />
        <span style={s.hint}>Whispr falls back to this model if it fails to resolve preferred logic.</span>
      </div>

      <hr style={{ borderColor: '#333', margin: '32px 0' }} />

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
              <span style={{ fontSize: 10, color: '#888', alignSelf: 'center', marginRight: 4 }}>Auto-Presets:</span>
              {[
                { id: 'low', label: 'Low End', p: { f: 'gemma4:e2b', h: 'llama3.2', m: 'llama3.2', c: 'gemma4:e4b', hi: 'llama3.2', b: 'llama3.2' } },
                { id: 'mid', label: 'Mid Range', p: { f: 'gemma4:e4b', h: 'gemma4:12b', m: 'gemma4:12b', c: 'deepseek-coder', hi: 'hermes3', b: 'mistral-nemo' } },
                { id: 'high', label: 'High End', p: { f: 'hermes3', h: 'gemma4:31b', m: 'qwen3:32b', c: 'deepseek-coder', hi: 'llama4', b: 'qwen3' } }
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
              ['Math', prefMath, setPrefMath, 'whispr_pref_math', 'qwen3 or gemma4:12b', '#A855F7'],
              ['Code', prefCode, setPrefCode, 'whispr_pref_code', 'deepseek-coder', '#3B82F6'],
              ['History', prefHistory, setPrefHistory, 'whispr_pref_history', 'hermes3 or llama4', '#FB923C'],
              ['Business', prefBusiness, setPrefBusiness, 'whispr_pref_business', 'qwen3 or mistral-nemo', '#4ADE80']
            ].map(([label, val, setter, storeKey, rec, color], i) => (
              <div key={i}>
                 <label style={{ fontSize: 11, color: '#888', marginBottom: 4, display: 'block' }}>{label as string} Override</label>
                 <Dropdown 
                    value={val as string}
                    options={[
                      { value: '', label: 'Auto (Follows Heavy/Fast)' },
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

      <hr style={{ borderColor: '#333', margin: '32px 0' }} />
      
      <h3 style={s.sectionTitle}>Local Model Installation</h3>
      <p style={s.sectionDesc}>Manage and download top-tier AI models and specialized coding agents. Clicking install will pull it into Ollama automatically.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, marginTop: 16 }}>
        {[
          { id: 'gemma4:e4b', name: 'Gemma 4 E4B', desc: 'Google\'s edge model — fast, efficient' },
          { id: 'llama3.2', name: 'Llama 3.2', desc: 'Ultra-lightweight fast chat' },
          { id: 'hermes3', name: 'Hermes 3', desc: 'Agentic / Tool Use specialization' },
          { id: 'qwen2.5:14b', name: 'Qwen 2.5 (14B)', desc: 'Heavy Code & Math' },
          { id: 'gemma4:12b', name: 'Gemma 4 (12B)', desc: 'Multimodal' },
          { id: 'phi4-mini', name: 'Phi-4 Mini', desc: 'Lightweight logic' },
          { id: 'mistral-nemo', name: 'Mistral Nemo (12B)', desc: 'Balanced reasoning' },
          { id: 'deepseek-coder', name: 'DeepSeek Coder', desc: 'Programming mastery' },
          { id: 'deepseek-r1', name: 'DeepSeek R1', desc: 'Deep Reasoning' },
          { id: 'llama4', name: 'Llama 4 Scout', desc: 'Multimodal MoE' },
          { id: 'llama3.2-vision', name: 'Llama 3.2 Vision (11B)', desc: 'Fast image analysis & reasoning' },
          { id: 'llava', name: 'LLaVA (7B)', desc: 'Classic vision & OCR model' },
        ].map(agent => {
          const isInstalled = installedModels.some((installed: string) => installed.toLowerCase().startsWith(agent.id.toLowerCase()));
          const isDownloading = downloadingModel === agent.id;
          
          return (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#111', borderRadius: 8, border: '1px solid #222' }}>
              <div>
                <div style={{ color: '#FFFFEB', fontSize: 13, fontWeight: 600 }}>{agent.name}</div>
                <div style={{ color: '#888', fontSize: 11 }}>{agent.desc}</div>
              </div>
              <div>
                {isInstalled ? (
                  <div style={{ color: '#4ADE80', fontSize: 11, fontWeight: 600 }}>Installed</div>
                ) : isDownloading ? (
                  <div style={{ color: '#A855F7', fontSize: 11, fontWeight: 600 }}>Downloading... {downloadProgress.toFixed(0)}%</div>
                ) : (
                  <button 
                    onClick={() => {
                      if (downloadingModel) return;
                      setDownloadingModel(agent.id);
                      setDownloadProgress(0);
                      const unbindProg = (window as any).electronAPI?.onPullProgress((data: any) => {
                        if (data.status === 'success') {
                          setDownloadingModel(null);
                          (window as any).electronAPI?.getInstalledModels().then(setInstalledModels);
                          cleanup();
                        } else if (data.total && data.completed) {
                          setDownloadProgress((data.completed / data.total) * 100);
                        }
                      });
                      const unbindErr = (window as any).electronAPI?.onPullError(() => {
                        setDownloadingModel(null);
                        cleanup();
                      });
                      const cleanup = () => { if (unbindProg) unbindProg(); if (unbindErr) unbindErr(); };
                      (window as any).electronAPI?.pullModel(agent.id);
                    }}
                    style={{ background: '#222', border: '1px solid #333', color: '#FFFFEB', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
                    Install
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <hr style={{ borderColor: '#333', margin: '32px 0' }} />
      <h3 style={s.sectionTitle}>Cloud Model (Coming Soon)</h3>
      <DevBanner />
    </div>
  );
}
