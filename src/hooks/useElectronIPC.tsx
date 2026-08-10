import { useEffect } from 'react';
import { useIslandState } from '../context/IslandContext';
import { findPillByQuery } from '../components/pills';

export function useElectronIPC() {
  const {
    phase, setPhase,
    pillStack, setPillStack,
    setActiveView,
    setIsFollowUpLoading,
    setSlowWarning,
    activeChatIdRef,
    pillStackRef,
    updateSessions,
    dismiss,
    sessions
  } = useIslandState();

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
      (window as any).electronAPI?.openMainApp();
    }
  }, []);

  // Sync external widget generation from MainApp
  useEffect(() => {
    const activeSession = sessions.find((s: any) => s.id === activeChatIdRef.current);
    if (!activeSession) return;
    const lastMsg = activeSession.messages[activeSession.messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.pill) {
      const pillIdx = findPillByQuery(lastMsg.pill);
      if (pillIdx >= 0) {
        setPillStack(prev => {
          if (prev.some(p => p.pillIdx === pillIdx)) return prev;
          return [...prev, { id: Date.now().toString(), pillIdx, pillData: lastMsg.pillData }];
        });
      }
    }
  }, [sessions]);

  // IPC listeners
  useEffect(() => {
    const api = (window as any).electronAPI;
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
    });
    
    const cleanupBlur = api.onWindowBlur(() => { });

    const cleanupSlowWarning = api.onChatSlowWarning((speedInfo) => {
      setSlowWarning(speedInfo as any);
    });

    const cleanupToken = api.onChatToken((token) => {
      setIsFollowUpLoading(false);
      setPhase(prev => {
        if (prev === 'processing') return 'response';
        return prev; 
      });

      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';
      if (!currentChatId) return;

      updateSessions((prev: any) =>
        prev.map((s: any) => {
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
      const keyword = toolData.toolName.replace('get_', '').replace('search_', '').replace('play_', '');
      const searchKey = keyword === 'check_system_health' ? 'health' : keyword;
      const pillIdx = findPillByQuery(searchKey);

      const currentChatId = activeChatIdRef.current || localStorage.getItem('whispr_active_chat') || '';

      if (pillIdx >= 0) {
        const existingPill = pillStackRef.current.find(p => p.pillIdx === pillIdx);
        const targetId = existingPill ? existingPill.id : Date.now().toString() + Math.random().toString(36).substr(2, 5);

        if (!existingPill) {
          setPillStack(prev => [...prev, { id: targetId, pillIdx, pillData: toolData.args }]);
        } else {
          setPillStack(prev => prev.map(p => p.id === targetId ? { ...p, pillData: toolData.args } : p));
        }

        setActiveView(targetId);
        setPhase('dynamic');

        if (currentChatId) {
          updateSessions((prev: any) =>
            prev.map((s: any) => {
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
      cleanupShow(); cleanupHide(); cleanupBlur();
      cleanupToken(); cleanupTool(); cleanupSlowWarning();
      if (cleanupToolResult) cleanupToolResult();
      cleanupEnd();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [dismiss, pillStack.length, setPhase, setPillStack, setActiveView, setIsFollowUpLoading, setSlowWarning, activeChatIdRef, pillStackRef, updateSessions]);

}
