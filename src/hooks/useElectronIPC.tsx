import { useEffect, useRef } from 'react';
import { useIslandState } from '../context/IslandContext';
import { findPillByQuery } from '../components/pills';

export function normalizeToolToPillKey(toolName: string): string {
  if (!toolName) return '';
  if (toolName === 'set_timer') return 'timer';
  if (toolName === 'open_calculator') return 'calculator';
  if (toolName === 'check_system_health') return 'health';
  if (toolName === 'get_system_stats') return 'system';
  if (toolName === 'play_music') return 'music';
  // whispr_control is a direct OS action (mute, volume, launch app) — do NOT open System & RAM Monitor
  if (toolName === 'whispr_control') return '';
  return toolName.replace(/^(get_|search_|play_|open_|set_)/, '');
}

export function useElectronIPC() {
  const {
    setPhase,
    setPillStack,
    setActiveView,
    setIsFollowUpLoading,
    setSlowWarning,
    activeChatIdRef,
    pillStackRef,
    updateSessions,
    dismiss,
  } = useIslandState();

  const lastToolPillIdRef = useRef<Record<number, string>>({});

  // Push API keys to the backend for background tasks (like Health Monitor)
  useEffect(() => {
    if (window.electronAPI?.updateApiKeys) {
      window.electronAPI.updateApiKeys({
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

  // IPC listeners
  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;
    
    const cleanupShow = api.onShowIsland(() => {
      const disableAll = localStorage.getItem('whispr_disable_all_anim') === 'true';
      const skipOrbAnim = localStorage.getItem('whispr_skip_dynamic_anim') === 'true';
      setPhase(current => {
        if (current === 'response' || current === 'processing') {
          return current;
        }
        if (current === 'dynamic') {
          return 'dynamic';
        }
        if (disableAll || skipOrbAnim) {
          setActiveView('-1');
          return 'dynamic';
        }
        return 'orb';
      });
    });
    
    const cleanupHide = api.onHideIsland(() => {
      dismiss();
    });

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key.toLowerCase() === 'i' || e.key === 'Alt' || e.key === ' ') {
        window.electronAPI?.shortcutReleased?.();
      }
    };
    window.addEventListener('keyup', handleKeyUp);
    
    const cleanupBlur = api.onWindowBlur(() => { });

    const cleanupSlowWarning = api.onChatSlowWarning((speedInfo) => {
      setSlowWarning(speedInfo);
    });

    const cleanupToken = api.onChatToken((token) => {
      setIsFollowUpLoading(false);
      setPhase(prev => {
        if (prev === 'processing') return 'response';
        return prev; 
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
      const searchKey = normalizeToolToPillKey(toolData.toolName);
      if (!searchKey) {
        // Direct OS action (e.g. whispr_control) — show response text instead of opening a widget
        setActiveView('-1');
        setPhase('response');
        return;
      }

      const pillIdx = findPillByQuery(searchKey);
      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';

      if (pillIdx >= 0) {
        // Allow multiple sports widgets to be open simultaneously
        const allowMultipleInstances = searchKey === 'sports';
        const existingPill = allowMultipleInstances
          ? undefined
          : pillStackRef.current.find(p => p.pillIdx === pillIdx);

        const targetId = existingPill
          ? existingPill.id
          : Date.now().toString() + Math.random().toString(36).slice(2, 7);

        lastToolPillIdRef.current[pillIdx] = targetId;

        if (!existingPill) {
          setPillStack(prev => [...prev, { id: targetId, pillIdx, pillData: toolData.args }]);
        } else {
          setPillStack(prev => prev.map(p => p.id === targetId ? { ...p, pillData: toolData.args } : p));
        }

        setActiveView(targetId);
        setPhase('dynamic');

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

    const cleanupToolResult = api.onChatToolResult?.((resultData) => {
      const searchKey = normalizeToolToPillKey(resultData.toolName);
      if (!searchKey) return;

      const pillIdx = findPillByQuery(searchKey);
      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';

      if (pillIdx >= 0) {
        let parsedResult = {};
        try { parsedResult = JSON.parse(resultData.resultStr); } catch { /* ignore invalid json */ }

        const targetId = lastToolPillIdRef.current[pillIdx];

        setPillStack(prev => prev.map(p => {
          if (targetId ? p.id === targetId : p.pillIdx === pillIdx) {
            return { ...p, pillData: { ...p.pillData, ...parsedResult } };
          }
          return p;
        }));

        if (currentChatId) {
          updateSessions((prev: any) =>
            prev.map((s: any) => {
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
      window.removeEventListener('keyup', handleKeyUp);
      cleanupShow(); cleanupHide(); cleanupBlur();
      cleanupToken(); cleanupTool(); cleanupSlowWarning();
      if (cleanupToolResult) cleanupToolResult();
      cleanupEnd();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [dismiss, setPhase, setPillStack, setActiveView, setIsFollowUpLoading, setSlowWarning, activeChatIdRef, pillStackRef, updateSessions]);

}
