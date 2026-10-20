import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Circle, CheckCircle2, Plus, Trash2, CheckCheck } from 'lucide-react';
import { PillLayout } from './PillLayout';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function TasksPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('whispr_tasks');
      if (saved !== null) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [{ id: '1', text: 'Ask Whispr about the weather', completed: false }];
  });
  const [newTaskText, setNewTaskText] = useState('');
  const lastAddedRef = useRef<string | null>(null);
  const lastCompletedRef = useRef<string | null>(null);

  // Persist tasks to localStorage (even when tasks array becomes empty!)
  useEffect(() => {
    try {
      localStorage.setItem('whispr_tasks', JSON.stringify(tasks));
    } catch { /* ignore */ }
  }, [tasks]);

  // Handle AI-triggered task additions ("Add a task to buy groceries")
  useEffect(() => {
    const taskToAdd = (data?.addedTask || (data?.action === 'add' ? data?.task : '') || '').trim();
    if (taskToAdd && lastAddedRef.current !== taskToAdd) {
      lastAddedRef.current = taskToAdd;
      setTasks(prev => {
        if (prev.some(t => t.text.toLowerCase() === taskToAdd.toLowerCase() && !t.completed)) {
          return prev;
        }
        const next = [...prev, { id: Date.now().toString(), text: taskToAdd, completed: false }];
        try { localStorage.setItem('whispr_tasks', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, [data?.addedTask, data?.action, data?.task]);

  // Handle AI-triggered task completions ("Complete task buy groceries")
  useEffect(() => {
    const taskToComplete = (data?.completedTask || (data?.taskAction === 'complete' || data?.action === 'complete' ? (data?.task || data?.taskText) : '') || '').trim();
    if (taskToComplete && lastCompletedRef.current !== taskToComplete) {
      lastCompletedRef.current = taskToComplete;
      setTasks(prev => {
        const next = prev.map(t => {
          if (!t.completed && (t.text.toLowerCase().includes(taskToComplete.toLowerCase()) || taskToComplete.toLowerCase().includes(t.text.toLowerCase()))) {
            return { ...t, completed: true };
          }
          return t;
        });
        try { localStorage.setItem('whispr_tasks', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  }, [data?.completedTask, data?.taskAction, data?.action, data?.task, data?.taskText]);

  const toggleTask = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const clearCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => !t.completed));
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), text: newTaskText.trim(), completed: false }]);
    setNewTaskText('');
  };

  const remaining = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length === 0 ? 0 : ((tasks.length - remaining) / tasks.length) * 100;

  if (!expanded) {
    return (
      <div onClick={() => { setExpanded(true); if (onExpand) onExpand(290); }} style={{ cursor: 'pointer', width: '100%' }}>
        <PillLayout height={56}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
            <CheckSquare size={16} color="#FF9500" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFEB' }}>{remaining} task{remaining === 1 ? '' : 's'} remaining</div>
              <div style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tasks.find(t => !t.completed)?.text || (tasks.length === 0 ? 'No tasks — add one!' : 'All caught up!')}
              </div>
            </div>
            <div style={{ width: 44, height: 4, borderRadius: 2, background: '#2A2A2A', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', background: '#FF9500', borderRadius: 2 }} />
            </div>
          </div>
        </PillLayout>
      </div>
    );
  }

  return (
    <div
      onWheel={e => e.stopPropagation()}
      style={{ 
        width: '100%', minHeight: 260, maxHeight: defaultExpanded ? 420 : 340, overflowY: 'auto',
        background: '#18181A', padding: '24px 20px 18px', boxSizing: 'border-box', color: '#FFFFEB', position: 'relative'
      }}
    >
      {!defaultExpanded && (
        <div onClick={() => { setExpanded(false); if (onExpand) onExpand(56); }} style={{ position: 'absolute', top: 10, left: 16, cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>‹</span> collapse
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, marginTop: defaultExpanded ? 0 : 10 }}>
        <CheckSquare size={18} color="#FF9500" />
        <span style={{ fontSize: 16, fontWeight: 700 }}>My Tasks</span>
        <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>({remaining} pending)</span>

        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            style={{
              marginLeft: 'auto', background: 'rgba(255, 59, 48, 0.14)', color: '#FF6B6B',
              border: '1px solid rgba(255, 59, 48, 0.28)', borderRadius: 6,
              padding: '3px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4
            }}
            title="Remove all completed tasks"
          >
            <CheckCheck size={11} />
            Clear Completed ({completedCount})
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        <AnimatePresence>
          {tasks.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: t.completed ? '#1E1E21' : '#252529',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer'
              }}
              onClick={() => toggleTask(t.id)}
            >
              {t.completed ? <CheckCircle2 size={16} color="#FF9500" style={{ flexShrink: 0 }} /> : <Circle size={16} color="#666" style={{ flexShrink: 0 }} />}
              <span style={{
                flex: 1, fontSize: 13,
                textDecoration: t.completed ? 'line-through' : 'none',
                color: t.completed ? '#6A6A72' : '#FFFFEB',
                wordBreak: 'break-word'
              }}>
                {t.text}
              </span>
              <button
                onClick={(e) => deleteTask(t.id, e)}
                title="Delete task"
                style={{
                  background: 'transparent', border: 'none', color: '#6A6A72',
                  cursor: 'pointer', padding: 4, borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'color 0.15s, background 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FF453A'; e.currentTarget.style.background = 'rgba(255,69,58,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#6A6A72'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div style={{ fontSize: 12, color: '#6A6A70', textAlign: 'center', padding: '18px 0' }}>
            No tasks right now — add one below!
          </div>
        )}
      </div>

      <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
        <input 
          value={newTaskText} onChange={e => setNewTaskText(e.target.value)} 
          placeholder="Add a new task..."
          style={{ flex: 1, background: '#121214', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', color: '#FFF', fontSize: 13, outline: 'none' }}
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          style={{
            background: '#FF9500', border: 'none', borderRadius: 8, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: newTaskText.trim() ? 'pointer' : 'default',
            opacity: newTaskText.trim() ? 1 : 0.45
          }}
        >
          <Plus size={16} color="#111" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}
export const tasksPillMeta = { name: 'Tasks', height: 56, keywords: ['tasks', 'todo', 'checklist', 'reminder'] };
