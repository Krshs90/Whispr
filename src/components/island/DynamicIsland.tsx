import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import { PILL_REGISTRY } from '../pills';
import { useIslandState } from '../../context/IslandContext';
import { IslandInput } from './IslandInput';
import { OrbIndicator } from './OrbIndicator';
import { ProcessingIndicator } from './ProcessingIndicator';
import { ResponseView } from './ResponseView';

const PILL_WIDTH = 480;
const PILL_WIDTH_EXPANDED = 660;
const INPUT_HEIGHT = 56;

export function DynamicIsland() {
  const {
    phase,
    pillStack,
    activeView,
    setActiveView,
    setPillStack,
    isExpanded,
  } = useIslandState();

  const [dynamicHeights, setDynamicHeights] = useState<Record<string, number>>({});

  const handleDragEnd = (viewId: string, _e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { offset, velocity } = info;
    const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y);

    if (isHorizontal) {
      if (Math.abs(offset.x) > 50 || Math.abs(velocity.x) > 300) {
        if (viewId !== '-1') {
          setPillStack(prev => {
            const nextStack = prev.filter(item => item.id !== viewId);
            if (activeView === viewId) {
              setActiveView('-1');
            }
            return nextStack;
          });
        }
      }
    } else {
      if (Math.abs(offset.y) > 30 || Math.abs(velocity.y) > 300) {
        const allViews = ['-1', ...pillStack.map(p => p.id)];
        if (allViews.length <= 1) return;

        const currentIdx = allViews.indexOf(activeView);
        if (offset.y < 0) {
          const nextIdx = (currentIdx + 1) % allViews.length;
          setActiveView(allViews[nextIdx]);
        } else {
          const nextIdx = (currentIdx - 1 + allViews.length) % allViews.length;
          setActiveView(allViews[nextIdx]);
        }
      }
    }
  };

  const getRotatedViews = () => {
    const allViews = ['-1', ...pillStack.map(p => p.id)];
    if (allViews.length <= 1) return allViews;

    const activeIdx = allViews.indexOf(activeView);
    if (activeIdx === -1) return allViews;

    const rotated = [];
    const N = allViews.length;
    for (let i = 1; i <= N; i++) {
      rotated.push(allViews[(activeIdx + i) % N]);
    }
    return rotated;
  };

  const getPillHeight = (id: string) => {
    if (id === '-1') {
      if (phase === 'orb' || phase === 'closing') return 56;
      if (phase === 'processing') return 120;
      if (phase === 'response') return isExpanded ? 500 : 280;
      return INPUT_HEIGHT;
    }

    if (dynamicHeights[id]) {
      return dynamicHeights[id];
    }

    const stackItem = pillStack.find(p => p.id === id);
    if (stackItem) {
      return PILL_REGISTRY[stackItem.pillIdx].height;
    }
    return INPUT_HEIGHT;
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', justifyContent: 'center',
      background: 'transparent', position: 'relative',
    }}>
      <AnimatePresence mode="popLayout">
        {phase !== 'idle' && getRotatedViews().map((viewId, index, arr) => {
          const stackItem = !viewId || viewId === '-1' ? null : pillStack.find(p => p.id === viewId);
          const isCalcPill = stackItem ? PILL_REGISTRY[stackItem.pillIdx]?.name === 'Calculator' : false;
          const basePillW = isExpanded ? PILL_WIDTH_EXPANDED : PILL_WIDTH;
          const w = (phase === 'orb' || phase === 'closing') ? 56 : (isCalcPill ? Math.max(380, basePillW) : basePillW);
          const h = getPillHeight(viewId);
          const isCore = viewId === '-1';
          const distance = arr.length - 1 - index;

          if (!isCore && phase !== 'dynamic') return null;

          return (
            <motion.div
              key={viewId}
              onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
              onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
              drag={(!isCore && phase !== 'processing' && phase !== 'orb') ? "x" : false}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.06}
              onDragEnd={(e, info) => handleDragEnd(viewId, e, info)}
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{
                opacity: distance === 0 ? 1 : Math.max(0, 0.6 - distance * 0.2),
                y: distance === 0 ? 0 : (distance * -18) - 10,
                scale: distance === 0 ? 1 : Math.max(0.85, 0.96 - distance * 0.04),
                width: w,
                height: h
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
              style={{
                background: '#1A1A1A',
                borderRadius: 28,
                border: '1px solid #2A2A2A',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                willChange: 'transform, opacity, width, height',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: (!isCore && phase !== 'processing' && phase !== 'orb') ? 'grab' : 'default',
                pointerEvents: 'auto',
                position: 'absolute',
                bottom: 24,
                transformOrigin: 'bottom center',
                zIndex: 20 - distance,
              }}
            >
              {isCore ? (
                <div style={{ width: '100%', height: '100%' }}>
                  <AnimatePresence mode="wait">
                    {phase === 'orb' || phase === 'closing' ? <OrbIndicator key="orb" /> : null}
                    {phase === 'processing' ? <ProcessingIndicator key="processing" /> : null}
                    {phase === 'response' ? <ResponseView key="response" /> : null}
                    {phase === 'dynamic' ? <IslandInput key="input" /> : null}
                  </AnimatePresence>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', position: 'relative', pointerEvents: distance === 0 ? 'auto' : 'none' }}>
                  {(() => {
                    if (!stackItem) return null;
                    const Component = PILL_REGISTRY[stackItem.pillIdx].component;
                    return <Component
                      data={stackItem.pillData}
                      onExpand={(h: number) => setDynamicHeights(prev => ({ ...prev, [viewId]: h }))}
                    />;
                  })()}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        ::placeholder { color: rgba(255, 255, 235, 0.35); }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #31312F; border-radius: 10px; }
      `}</style>
    </div>
  );
}
