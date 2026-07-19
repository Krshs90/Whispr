import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Circle, CheckCircle2, Plus } from 'lucide-react';
import { PillLayout } from './PillLayout';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export function TasksPill({ data, defaultExpanded = false, onExpand }: { data?: any; defaultExpanded?: boolean; onExpand?: (h: number) => void }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Load tasks
  useEffect(() => {
    try {
      const saved = localStorage.getItem('whispr_tasks');
      if (saved) setTasks(JSON.parse(saved));
      else setTasks([{ id: '1', text: 'Ask Whispr about the weather', completed: false }]);
    } catch {}
  }, []);

  // Save tasks
  useEffect(() => {
    if (tasks.length > 0) localStorage.setItem('whispr_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    setTasks(prev => [...prev, { id: Date.now().toString(), text: newTaskText.trim(), completed: false }]);
    setNewTaskText('');
  };

  const remaining = tasks.filter(t => !t.completed).length;
  const progress = tasks.length === 0 ? 0 : ((tasks.length - remaining) / tasks.length) * 100;

  if (!expanded) {
    return (
      <div onClick={() => { setExpanded(true); if (onExpand) onExpand(260); }} style={{ cursor: 'pointer', width: '100%' }}>
        <PillLayout height={56}>
          <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
            <CheckSquare size={16} color="#FF9500" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#FFFFEB' }}>{remaining} tasks remaining</div>
              <div style={{ fontSize: 10, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tasks.find(t => !t.completed)?.text || 'All caught up!'}
              </div>
            </div>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: '#2A2A2A', overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', background: '#FF9500', borderRadius: 2 }} />
            </div>
          </div>
        </PillLayout>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', minHeight: 260, maxHeight: defaultExpanded ? 'none' : 400, overflowY: 'auto',
      background: '#18181A', padding: '24px 20px', boxSizing: 'border-box', color: '#FFFFEB', position: 'relative'
    }}>
      {!defaultExpanded && (
        <div onClick={() => { setExpanded(false); if (onExpand) onExpand(56); }} style={{ position: 'absolute', top: 12, left: 16, cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
          <span style={{ transform: 'rotate(90deg)', display: 'inline-block' }}>‹</span> collapse
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, marginTop: defaultExpanded ? 0 : 12 }}>
        <CheckSquare size={20} color="#FF9500" />
        <span style={{ fontSize: 16, fontWeight: 700 }}>My Tasks</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>{remaining} pending</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <AnimatePresence>
          {tasks.map(t => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#252527', padding: '10px 12px', borderRadius: 10, cursor: 'pointer' }}
              onClick={() => toggleTask(t.id)}
            >
              {t.completed ? <CheckCircle2 size={16} color="#FF9500" /> : <Circle size={16} color="#555" />}
              <span style={{ fontSize: 13, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? '#666' : '#EEE' }}>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: '16px 0' }}>No tasks yet.</div>}
      </div>

      <form onSubmit={addTask} style={{ display: 'flex', gap: 8 }}>
        <input 
          value={newTaskText} onChange={e => setNewTaskText(e.target.value)} 
          placeholder="Add a new task..."
          style={{ flex: 1, background: '#111', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', color: '#FFF', fontSize: 13, outline: 'none' }}
        />
        <button type="submit" disabled={!newTaskText.trim()} style={{ background: '#FF9500', border: 'none', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: newTaskText.trim() ? 1 : 0.5 }}>
          <Plus size={16} color="#FFF" />
        </button>
      </form>
    </div>
  );
}
export const tasksPillMeta = { name: 'Tasks', height: 56, keywords: ['tasks', 'todo', 'checklist'] };
