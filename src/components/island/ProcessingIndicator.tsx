import React from 'react';
import { motion } from 'framer-motion';
import { AudioLines, X, LayoutGrid } from 'lucide-react';
import { useIslandState } from '../../context/IslandContext';

export function ProcessingIndicator() {
  const { elapsed, setPhase, setActiveView, dismiss, activeChatId } = useIslandState();

  const handleCancel = () => {
    window.electronAPI?.stopChat();
    setPhase('dynamic');
    setActiveView('-1');
    localStorage.removeItem('whispr_is_processing');
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
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#FFFFEB' }}>
        <AudioLines size={24} style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 15, fontWeight: 500 }}>
          Thinking... <span style={{ opacity: 0.5, fontSize: 13 }}>({elapsed}s / ~{Math.max(6, elapsed + 1)}s)</span>
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={handleCancel} style={btnStyle}>
          <X size={14} /> Cancel
        </button>
        {elapsed >= 3 && (
          <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={handleOpenMainApp} style={{ ...btnStyle, background: '#31312F' }}>
            <LayoutGrid size={14} /> Open in Window
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '6px 16px', 
  borderRadius: 20, 
  border: '1px solid #3A3A3A', 
  background: 'transparent', 
  color: '#FFFFEB', 
  fontSize: 13, 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  gap: 6
};
