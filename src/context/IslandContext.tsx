import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import { useSharedSessions } from '../lib/sessionStore';

export type IslandPhase = 'idle' | 'orb' | 'processing' | 'response' | 'dynamic' | 'closing';

export interface StackItem {
  id: string;
  pillIdx: number;
  pillData?: any;
}

interface IslandContextType {
  phase: IslandPhase;
  setPhase: React.Dispatch<React.SetStateAction<IslandPhase>>;
  pillStack: StackItem[];
  setPillStack: React.Dispatch<React.SetStateAction<StackItem[]>>;
  activeView: string;
  setActiveView: React.Dispatch<React.SetStateAction<string>>;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  copiedId: string | null;
  setCopiedId: React.Dispatch<React.SetStateAction<string | null>>;
  elapsed: number;
  setElapsed: React.Dispatch<React.SetStateAction<number>>;
  isExpanded: boolean;
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isFollowUpLoading: boolean;
  setIsFollowUpLoading: React.Dispatch<React.SetStateAction<boolean>>;
  slowWarning: { activeModel: string, fastModel: string, tps: string } | null;
  setSlowWarning: React.Dispatch<React.SetStateAction<{ activeModel: string, fastModel: string, tps: string } | null>>;
  activeChatId: string;
  setActiveChatId: React.Dispatch<React.SetStateAction<string>>;
  
  // Refs
  inputRef: MutableRefObject<HTMLInputElement | null>;
  messagesEndRef: MutableRefObject<HTMLDivElement | null>;
  pillStackRef: MutableRefObject<StackItem[]>;
  activeChatIdRef: MutableRefObject<string>;

  // Actions
  dismiss: () => void;
  sessions: any[];
  updateSessions: any;
}

const IslandContext = createContext<IslandContextType | undefined>(undefined);

export function IslandProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<IslandPhase>('idle');
  const [pillStack, setPillStack] = useState<StackItem[]>([]);
  const [activeView, setActiveView] = useState<string>('-1');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [slowWarning, setSlowWarning] = useState<{ activeModel: string, fastModel: string, tps: string } | null>(null);

  const { sessions, updateSessions } = useSharedSessions();
  const [activeChatId, setActiveChatId] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pillStackRef = useRef(pillStack);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    pillStackRef.current = pillStack;
  }, [pillStack]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const dismiss = useCallback(() => {
    if (phase === 'idle' || phase === 'closing') return;
    setPhase('closing');
  }, [phase]);

  // Closing sequence
  useEffect(() => {
    if (phase === 'closing') {
      const timer = setTimeout(() => {
        setPhase('idle');
        setTimeout(() => (window as any).electronAPI?.hideOverlay(), 350);
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

  // ESC to dismiss overlay completely
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'idle' && phase !== 'closing') dismiss();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, dismiss]);

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

  return (
    <IslandContext.Provider value={{
      phase, setPhase,
      pillStack, setPillStack,
      activeView, setActiveView,
      query, setQuery,
      copiedId, setCopiedId,
      elapsed, setElapsed,
      isExpanded, setIsExpanded,
      isFollowUpLoading, setIsFollowUpLoading,
      slowWarning, setSlowWarning,
      activeChatId, setActiveChatId,
      inputRef, messagesEndRef, pillStackRef, activeChatIdRef,
      dismiss,
      sessions, updateSessions
    }}>
      {children}
    </IslandContext.Provider>
  );
}

export function useIslandState() {
  const context = useContext(IslandContext);
  if (context === undefined) {
    throw new Error('useIslandState must be used within an IslandProvider');
  }
  return context;
}
