import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, HardDrive, Download, CheckCircle, AlertTriangle, ArrowRight, Eye, Keyboard } from 'lucide-react';

interface HWData {
  ramGB: number;
  cores: number;
  diskFreeGB: number;
}

interface SelectedModels {
  fast: string;
  heavy: string;
}

interface OnboardingProps {
  onComplete: (preferredModels: SelectedModels) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  // Step 0: Welcome Splash
  // Step 1: Scanning Prompt
  // Step 2: System Profile & Selection
  // Step 3: Downloading
  // Step 4: Optional Auth Keys
  const [step, setStep] = useState(0);
  const [hw, setHw] = useState<HWData | null>(null);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  
  // Max storage user allows Whispr to consume
  const [storageCap, setStorageCap] = useState(10); 
  
  // Download states
  const [_downloading, setDownloading] = useState(false);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const [completedDownloads, setCompletedDownloads] = useState<Set<string>>(new Set());
  const [modelsToDownload, setModelsToDownload] = useState<string[]>([]);
  
  const [recommended, setRecommended] = useState<SelectedModels>({ fast: 'llama3.2', heavy: 'llama3.2' });
  const [visionEnabled, setVisionEnabled] = useState(false);

  // Handle hardware & model scan
  const startScan = async () => {
    setStep(1); // Show scanning screen
    
    try {
      const [hwData, installed] = await Promise.all([
        window.electronAPI!.scanHardware(),
        window.electronAPI!.getInstalledModels()
      ]);
      setHw(hwData);
      setInstalledModels(installed || []);
      
      // Artificial delay to let the animation play out for a more professional feel
      setTimeout(() => setStep(2), 2500);
    } catch (e) {
      console.error("Scan failed", e);
      // Fallback
      setHw({ ramGB: 8, cores: 4, diskFreeGB: 50 });
      setInstalledModels([]);
      setTimeout(() => setStep(2), 1000);
    }
  };

  // Re-calculate recommended models based on storage cap
  useEffect(() => {
    if (!hw) return;
    let fast = 'qwen2.5:1.5b';
    let heavy = 'llama3.2'; // Standard default for low-end

    if (hw.ramGB >= 16 && storageCap >= 25) {
      fast = 'llama3.2';
      heavy = 'qwen2.5:32b';
    } else if (hw.ramGB >= 8 && storageCap >= 10) {
      fast = 'llama3.2';
      heavy = 'qwen2.5:14b';
    }

    setRecommended({ fast, heavy });
  }, [hw, storageCap]);

  const handleStartDownloads = () => {
    // Filter out models that are already installed
    let queue = Array.from(new Set([recommended.fast, recommended.heavy]));
    const toDownload = queue.filter(m => !installedModels.some(installed => installed.toLowerCase().startsWith(m.toLowerCase())));
    
    if (toDownload.length === 0) {
      // Nothing to download, skip to complete
      setStep(4);
      return;
    }

    setModelsToDownload(toDownload);
    setDownloading(true);
    setStep(3);

    // Sequence downloads
    let currentIdx = 0;

    const pullNext = () => {
      if (currentIdx >= toDownload.length) {
        setTimeout(() => {
          setStep(4);
        }, 1500);
        return;
      }
      
      const target = toDownload[currentIdx];
      let unlistenProgress: any;
      let unlistenError: any;

      unlistenProgress = window.electronAPI?.onPullProgress((data: any) => {
        if (data.status === 'success') {
          setCompletedDownloads(prev => new Set(prev).add(target));
          cleanup();
          currentIdx++;
          pullNext();
        } else if (data.total && data.completed) {
          const pct = Math.min((data.completed / data.total) * 100, 99.9);
          setProgresses(prev => ({ ...prev, [target]: pct }));
        }
      });

      unlistenError = window.electronAPI?.onPullError((err: any) => {
        console.error("Download failed for", target, err);
        cleanup();
        currentIdx++;
        pullNext();
      });

      const cleanup = () => {
        if (unlistenProgress) unlistenProgress();
        if (unlistenError) unlistenError();
      };

      window.electronAPI?.pullModel(target);
    };

    pullNext();
  };

  const getTier = () => {
    if (!hw) return 'Unknown';
    if (hw.ramGB >= 16 && storageCap >= 25) return 'High-End';
    if (hw.ramGB >= 8 && storageCap >= 10) return 'Mid-Tier';
    return 'Low-End';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: step === 0 ? '#FFFFEB' : '#0D0D0D', 
      zIndex: 9999, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      transition: 'background 0.6s ease'
    }}>
      <AnimatePresence mode="wait">
        
        {/* Step 0: Welcome Screen */}
        {step === 0 && (
          <motion.div
            key="splash"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{ textAlign: 'center', maxWidth: 500 }}
          >
            <div style={{ 
              background: '#0D0D0D', color: '#FFFFEB', 
              padding: '8px 16px', borderRadius: 20, 
              display: 'inline-block', fontSize: 13, 
              fontWeight: 600, letterSpacing: 1, marginBottom: 30
            }}>
              BETA 0.0.1
            </div>
            
            <h1 style={{ color: '#0D0D0D', fontSize: 56, fontWeight: 700, margin: 0, letterSpacing: '-0.03em' }}>
              Welcome to Whispr.
            </h1>
            <p style={{ color: '#555', fontSize: 18, marginTop: 16, lineHeight: 1.5 }}>
              The ultra-fast, locally deployed intelligence layer for your daily workflow.
            </p>
            
            <button
              onClick={startScan}
              style={{
                marginTop: 40, background: '#0D0D0D', color: '#FFFFEB',
                border: 'none', padding: '16px 32px', borderRadius: 12,
                fontSize: 16, fontWeight: 600, cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s, background 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}
            >
              Get Started <ArrowRight size={18} />
            </button>
          </motion.div>
        )}

        {/* Step 1 & 2 & 3: Dark UI Setup Box */}
        {step > 0 && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              width: 640, background: '#1A1A1A', borderRadius: 20,
              padding: 40, border: '1px solid #2A2A2A',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
            }}
          >
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{ textAlign: 'center', padding: '40px 0' }}
                >
                  <motion.div 
                    style={{ display: 'inline-block', marginBottom: 24 }}
                  >
                    <Cpu size={56} color="#FFFFEB" opacity={0.8} />
                  </motion.div>
                  <h2 style={{ margin: 0, color: '#FFFFEB', fontSize: 24, fontWeight: 600 }}>Scanning Hardware...</h2>
                  <p style={{ color: '#888', marginTop: 12, fontSize: 15 }}>
                    Evaluating CPU, Memory, Disk constraints, and detecting installed AI models.
                  </p>
                </motion.div>
              )}

              {step === 2 && hw && (
                <motion.div
                  key="config"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#FFFFEB', fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Cpu size={24} color="#FFFFEB" /> System Profile
                    </h2>
                    <div style={{ background: '#222', padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4ADE80', border: '1px solid #333' }}>
                      {getTier()} Compatible
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
                    <div style={statBoxStyle}>
                      <div style={statTitleStyle}>Available RAM</div>
                      <div style={statValStyle}>{hw.ramGB.toFixed(1)} GB</div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={statTitleStyle}>CPU Threads</div>
                      <div style={statValStyle}>{hw.cores}</div>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={statTitleStyle}>Free Disk</div>
                      <div style={statValStyle}>{hw.diskFreeGB.toFixed(1)} GB</div>
                    </div>
                  </div>

                  {installedModels.length === 0 && (
                    <div style={{ marginTop: 24, background: 'rgba(251, 146, 60, 0.1)', border: '1px solid rgba(251, 146, 60, 0.3)', borderRadius: 12, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                      <AlertTriangle size={24} color="#FB923C" />
                      <div>
                        <div style={{ color: '#FB923C', fontWeight: 600, fontSize: 14 }}>No Models Detected</div>
                        <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Whispr requires at least one model to be installed locally to function.</div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 28, background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}>
                      <label style={{ color: '#FFFFEB', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HardDrive size={18} color="#888" /> Storage Allocation
                      </label>
                      <span style={{ color: '#FFFFEB', fontWeight: 600, fontSize: 18 }}>{storageCap} <span style={{ color: '#888', fontSize: 14 }}>GB</span></span>
                    </div>
                    <input 
                      type="range" 
                      min={2} 
                      max={Math.min(100, Math.floor(hw.diskFreeGB * 0.8))} 
                      value={storageCap}
                      onChange={(e) => setStorageCap(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#FFFFEB', cursor: 'grab' }}
                    />
                    
                    <div style={{ display: 'flex', gap: 20, marginTop: 24, paddingTop: 16, borderTop: '1px solid #222' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Fast Model</div>
                        <div style={{ color: '#FFFFEB', fontWeight: 600 }}>{recommended.fast}</div>
                        {installedModels.some(m => m.toLowerCase().startsWith(recommended.fast.toLowerCase())) ? (
                           <div style={{ color: '#4ADE80', fontSize: 11, marginTop: 4 }}>✓ Installed</div>
                        ) : (
                           <div style={{ color: '#FB923C', fontSize: 11, marginTop: 4 }}>Requires Download</div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Heavy Model</div>
                        <div style={{ color: '#FFFFEB', fontWeight: 600 }}>{recommended.heavy}</div>
                        {installedModels.some(m => m.toLowerCase().startsWith(recommended.heavy.toLowerCase())) ? (
                           <div style={{ color: '#4ADE80', fontSize: 11, marginTop: 4 }}>✓ Installed</div>
                        ) : (
                           <div style={{ color: '#FB923C', fontSize: 11, marginTop: 4 }}>Requires Download</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#666', fontSize: 13 }}>
                      {installedModels.length > 0 ? `Detected ${installedModels.length} existing models.` : ''}
                    </div>
                    <button
                      onClick={handleStartDownloads}
                      style={{
                        background: '#FFFFEB', color: '#0D0D0D', border: 'none',
                        padding: '12px 24px', borderRadius: 8, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >   
                      { (installedModels.some(m => m.toLowerCase().startsWith(recommended.fast.toLowerCase())) && installedModels.some(m => m.toLowerCase().startsWith(recommended.heavy.toLowerCase()))) 
                        ? 'Finish Setup' 
                        : 'Download & Continue' } 
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="download"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 style={{ margin: 0, color: '#FFFFEB', fontSize: 24, fontWeight: 600 }}>Downloading Intelligence...</h2>
                  <p style={{ color: '#888', marginTop: 10 }}>Whispr is pulling the required models natively. This may take a few minutes depending on your connection.</p>
                  
                  <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {modelsToDownload.map(model => {
                      const isDone = completedDownloads.has(model);
                      const progress = progresses[model] || 0;
                      
                      return (
                        <div key={model} style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ color: '#FFFFEB', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                              {isDone ? <CheckCircle size={16} color="#4ADE80" /> : <Download size={16} color="#888" />}
                              {model}
                            </span>
                            <span style={{ color: '#888', fontSize: 13, fontWeight: 500 }}>
                              {isDone ? 'Completed' : `${progress.toFixed(1)}%`}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}>
                            <motion.div 
                              style={{ height: '100%', background: isDone ? '#4ADE80' : '#FFFFEB' }}
                              animate={{ width: isDone ? '100%' : `${progress}%` }}
                              transition={{ ease: "linear" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="finalsetup"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 style={{ margin: 0, color: '#FFFFEB', fontSize: 24, fontWeight: 600 }}>Final Setup</h2>
                  <p style={{ color: '#888', marginTop: 10 }}>Whispr runs completely offline. Before we begin, let's configure your shortcut and screen permissions.</p>
                  
                  <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      
                      <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <Keyboard size={18} color="#FFFFEB" />
                          <span style={{ color: '#FFFFEB', fontSize: 14, fontWeight: 600 }}>Global Shortcut</span>
                        </div>
                        <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                          Press <strong style={{ color: '#4ADE80' }}>Ctrl + I</strong> from anywhere on your computer to instantly summon Whispr. You can customize this later in Settings.
                        </p>
                      </div>

                      <div style={{ background: '#111', borderRadius: 12, padding: 20, border: '1px solid #222' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <Eye size={18} color="#FFFFEB" />
                              <span style={{ color: '#FFFFEB', fontSize: 14, fontWeight: 600 }}>Whispr Vision (Beta)</span>
                            </div>
                            <p style={{ color: '#888', fontSize: 13, margin: 0, paddingRight: 20 }}>
                              Allow Whispr to capture screenshots of your active monitors when requested, giving it spatial and visual awareness of your workflow.
                            </p>
                          </div>
                          <div style={{ marginTop: 4 }}>
                            {/* Simple custom toggle since we don't have the Toggle component imported from Settings */}
                            <div 
                              onClick={() => {
                                const nextVal = !visionEnabled;
                                setVisionEnabled(nextVal);
                                localStorage.setItem('whispr_vision_enabled', nextVal.toString());
                              }}
                              style={{
                                width: 44, height: 24, background: visionEnabled ? '#4ADE80' : '#333',
                                borderRadius: 12, position: 'relative', cursor: 'pointer', transition: '0.2s'
                              }}
                            >
                              <div style={{
                                width: 18, height: 18, background: '#FFF', borderRadius: 9,
                                position: 'absolute', top: 3, left: visionEnabled ? 23 : 3, transition: '0.2s'
                              }} />
                            </div>
                          </div>
                        </div>
                      </div>

                  </div>

                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                    <button
                      onClick={() => onComplete(recommended)}
                      style={{
                        background: '#FFFFEB', color: '#0D0D0D', border: 'none',
                        padding: '12px 24px', borderRadius: 8, fontWeight: 600,
                        cursor: 'pointer', transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >   
                      Enter Whispr <ArrowRight size={16} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const statBoxStyle = {
  background: '#111', border: '1px solid #222',
  padding: 16, borderRadius: 12, textAlign: 'center' as const
};
const statTitleStyle = { color: '#888', fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: 0.5, fontWeight: 600 };
const statValStyle = { color: '#FFFFEB', fontSize: 20, fontWeight: 600, marginTop: 8 };
