import type { ChatSession } from './types';

const STORE_KEY = 'whispr_sessions';

/**
 * Sanitize a single message to ensure it won't crash React during render.
 */
function sanitizeMessage(m: any): any | null {
  if (!m || typeof m !== 'object') return null;
  return {
    id: m.id || crypto.randomUUID?.() || String(Date.now()),
    role: typeof m.role === 'string' ? m.role : 'user',
    content: typeof m.content === 'string' ? m.content : '',
    timestamp: m.timestamp || new Date().toISOString(),
    // Preserve optional pill data if valid
    ...(m.pill ? { pill: String(m.pill) } : {}),
    ...(m.pillData ? { pillData: m.pillData } : {}),
    ...(m.sources && Array.isArray(m.sources) ? { sources: m.sources } : {}),
  };
}

export const loadSessions = (): ChatSession[] => {
  const data = localStorage.getItem(STORE_KEY);
  if (!data) return [];
  try {
    const raw = JSON.parse(data);
    if (!Array.isArray(raw)) {
      console.error('[SessionStore] Sessions data is not an array, resetting.');
      localStorage.removeItem(STORE_KEY);
      return [];
    }
    // Validate each session and deep-sanitize messages
    return raw
      .filter((s: any) => s && typeof s === 'object' && s.id)
      .map((s: any) => ({
        ...s,
        id: String(s.id),
        title: typeof s.title === 'string' ? s.title : 'Untitled Chat',
        messages: Array.isArray(s.messages)
          ? s.messages.map(sanitizeMessage).filter(Boolean)
          : [],
        updatedAt: s.updatedAt || new Date().toISOString(),
      }));
  } catch (e) {
    console.error('[SessionStore] Corrupted session data, resetting:', e);
    localStorage.removeItem(STORE_KEY);
    return [];
  }
};

/**
 * Force-clear all sessions (emergency recovery).
 */
export const clearSessions = () => {
  localStorage.removeItem(STORE_KEY);
  localStorage.removeItem('whispr_active_chat');
  window.dispatchEvent(new Event('whispr_local_storage'));
};

export const saveSessions = (sessions: ChatSession[]) => {
  localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
  // Dispatch a custom event so the current window updates instantly too
  window.dispatchEvent(new Event('whispr_local_storage'));
};

/**
 * Hook to keep react state highly synchronized between windows and local updates
 */
import { useState, useEffect } from 'react';

export function useSharedSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>(loadSessions());

  useEffect(() => {
    const sync = () => setSessions(loadSessions());
    window.addEventListener('storage', sync);
    window.addEventListener('whispr_local_storage', sync);
    
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('whispr_local_storage', sync);
    };
  }, []);

  const updateSessions = (updater: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => {
    let next: ChatSession[];
    // To avoid race conditions, pull fresh from LocalStorage before applying function updates
    const current = loadSessions();
    if (typeof updater === 'function') {
      next = updater(current);
    } else {
      next = updater;
    }
    saveSessions(next);
  };

  return { sessions, updateSessions };
}

// Calculate tokens visually
export const estimateContextMemory = (session?: ChatSession): number => {
  if (!session) return 0;
  const contentStr = session.messages.map(m => m.content).join('');
  // Roughly 4 chars = 1 token
  return Math.floor(contentStr.length / 4);
};
