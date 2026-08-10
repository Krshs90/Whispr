import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as math from 'mathjs';

// ── CalculatorPill ──────────────────────────────────────────────
// Security: All evaluation uses mathjs.evaluate() — NOT new Function().
// mathjs runs in a sandboxed scope with no access to browser globals.
// Keyboard: Full keydown support when the pill is mounted.

interface HistoryEntry {
  expr: string;
  result: string;
}

export function CalculatorPill({ defaultExpanded: _defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('');
  const [scientific, setScientific] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(_defaultExpanded);
  const [error, setError] = useState(false);
  const [justEvaluated, setJustEvaluated] = useState(false);

  // ── Evaluation (SECURE: mathjs only, no eval/new Function) ──
  const evaluate = useCallback(() => {
    const expr = display.trim();
    if (!expr) return;

    try {
      // Normalise display notation to mathjs notation
      const normalised = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/√\(/g, 'sqrt(')
        .replace(/√(\d+)/g, 'sqrt($1)')
        .replace(/π/g, 'pi');  // mathjs uses 'pi'

      const raw = math.evaluate(normalised);
      const num = typeof raw === 'number' ? raw : Number(raw);

      if (!isFinite(num)) {
        setResult('Error');
        setError(true);
        return;
      }

      // Smart formatting: avoid unnecessary decimals, cap at 10 sig figs
      const formatted = parseFloat(num.toPrecision(10)).toString();
      setResult(formatted);
      setError(false);
      setHistory(prev => [{ expr, result: formatted }, ...prev].slice(0, 10));
      setJustEvaluated(true);
    } catch {
      setResult('Error');
      setError(true);
    }
  }, [display]);

  // ── Button handler ──
  const handlePress = useCallback((val: string) => {
    setError(false);

    if (val === 'AC') {
      setDisplay('');
      setResult('');
      setJustEvaluated(false);
      return;
    }
    if (val === 'DEL') {
      setDisplay(prev => prev.slice(0, -1));
      setJustEvaluated(false);
      return;
    }
    if (val === '=') {
      evaluate();
      return;
    }

    // If just evaluated and user types operator, continue from result
    // If they type a digit/function, start fresh expression
    if (justEvaluated) {
      const isOperator = ['+', '-', '*', '/', '^', '×', '÷', '−'].includes(val);
      if (isOperator) {
        setDisplay(result + val);
      } else {
        setDisplay(val);
      }
      setJustEvaluated(false);
      setResult('');
      return;
    }

    setDisplay(prev => prev + val);
  }, [evaluate, justEvaluated, result]);

  // ── Keyboard support ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const { key } = e;

      if (/^[0-9]$/.test(key)) { handlePress(key); return; }
      if (key === '+') { handlePress('+'); return; }
      if (key === '-') { handlePress('−'); return; }
      if (key === '*') { handlePress('×'); return; }
      if (key === '/') { e.preventDefault(); handlePress('÷'); return; }
      if (key === '(' || key === ')' || key === '.') { handlePress(key); return; }
      if (key === '^') { handlePress('^'); return; }
      if (key === 'Enter' || key === '=') { e.preventDefault(); handlePress('='); return; }
      if (key === 'Backspace') { handlePress('DEL'); return; }
      if (key === 'Escape') { handlePress('AC'); return; }
      if (key === 'p' || key === 'P') { handlePress('π'); return; }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePress]);

  // ── Design tokens ──
  const accent = '#E8863A';    // warm amber — distinct from the app-wide green
  const accentEq = '#E8863A';
  const surface0 = '#0E0E10'; // display bg
  const surface1 = '#1C1C1E'; // pill bg
  const surface2 = '#252527'; // number button
  const surface3 = '#2D2D2F'; // operator button
  const textPrimary = '#F5F5EB';
  const textMuted = '#6A6A70';

  // ── Button grid ──
  const basicRows = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '−'],
    ['0', '.', 'DEL', '+'],
  ];

  const sciRows = [
    ['sin(', 'cos(', 'tan(', '√('],
    ['log(', 'ln(', '^', 'π'],
  ];

  const OPERATOR_CHARS = ['÷', '×', '−', '+'];

  const displayLabel = (lbl: string) => {
    if (lbl === 'DEL') return '⌫';
    return lbl;
  };

  return (
    <div
      style={{
        width: '100%',
        maxHeight: expanded ? 530 : 100,
        background: surface1,
        borderRadius: 'inherit',
        boxSizing: 'border-box',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'max-height 0.3s ease',
      }}
    >
      {/* Expand/Collapse Toggle Overlay */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          position: 'absolute',
          top: 10,
          left: 14,
          cursor: 'pointer',
          zIndex: 10,
          opacity: 0.5,
          color: textPrimary,
          fontSize: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 4
        }}
      >
        <span style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>›</span>
        <span>{expanded ? 'collapse' : 'expand'}</span>
      </div>

      {/* ── Display ── */}
      <div
        style={{
          background: surface0,
          padding: expanded ? '16px 20px 14px' : '30px 20px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          minHeight: 100,
          justifyContent: 'flex-end',
          gap: 2,
          position: 'relative',
        }}
      >
        {/* SCI toggle */}
        <button
          onClick={() => setScientific(s => !s)}
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            background: scientific ? `${accent}22` : 'transparent',
            border: `1px solid ${scientific ? accent : '#2E2E30'}`,
            borderRadius: 6,
            color: scientific ? accent : textMuted,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '3px 8px',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          SCI
        </button>

        {/* Expression line */}
        <div
          style={{
            fontSize: 13,
            color: textMuted,
            fontVariantNumeric: 'tabular-nums',
            minHeight: 18,
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            direction: 'rtl',
          }}
        >
          {display || '\u00A0'}
        </div>

        {/* Result line */}
        <AnimatePresence mode="wait">
          <motion.div
            key={result + error}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              fontSize: 40,
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: error ? '#E85A4A' : result ? textPrimary : textMuted,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {error ? 'Error' : result || '0'}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Keypad (Only show if expanded) ── */}
      {expanded && (
        <div style={{ padding: '12px 14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Scientific rows */}
        <AnimatePresence>
          {scientific && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.16 }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 2 }}
            >
              {sciRows.map((row, ri) => (
                <div key={`sci-${ri}`} style={{ display: 'flex', gap: 8 }}>
                  {row.map(btn => (
                    <CalcBtn
                      key={btn}
                      label={displayLabel(btn)}
                      value={btn}
                      onPress={handlePress}
                      bg={`${accent}16`}
                      fg={accent}
                      fontSize={13}
                    />
                  ))}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AC + parens row */}
        <div style={{ display: 'flex', gap: 8 }}>
          <CalcBtn label="AC" value="AC" onPress={handlePress} bg="#3A1414" fg="#E85A4A" flex={2} />
          <CalcBtn label="(" value="(" onPress={handlePress} bg={surface3} fg={textMuted} />
          <CalcBtn label=")" value=")" onPress={handlePress} bg={surface3} fg={textMuted} />
        </div>

        {/* Number + operator rows */}
        {basicRows.map((row, ri) => (
          <div key={`row-${ri}`} style={{ display: 'flex', gap: 8 }}>
            {row.map(btn => {
              const isOp = OPERATOR_CHARS.includes(btn);
              const isDel = btn === 'DEL';
              return (
                <CalcBtn
                  key={btn}
                  label={displayLabel(btn)}
                  value={btn === '−' ? '-' : btn}
                  onPress={handlePress}
                  bg={isOp ? surface3 : isDel ? surface3 : surface2}
                  fg={isOp ? accent : isDel ? textMuted : textPrimary}
                  fontSize={isOp ? 20 : 17}
                  fontWeight={isOp ? 400 : 400}
                />
              );
            })}
          </div>
        ))}

        {/* Equals — full width, prominent */}
        <CalcBtn
          label="="
          value="="
          onPress={handlePress}
          bg={accentEq}
          fg="#111"
          fontWeight={500}
          fontSize={22}
          height={50}
        />
      </div>
      )}

      {/* ── History strip (Only show if expanded) ── */}
      {expanded && history.length > 0 && (
        <div
          style={{
            borderTop: '1px solid #1E1E20',
            padding: '6px 14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            maxHeight: 68,
            overflowY: 'auto',
          }}
        >
          {history.slice(0, 3).map((h, i) => (
            <button
              key={i}
              onClick={() => {
                setDisplay(h.result);
                setResult('');
                setJustEvaluated(false);
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: textMuted,
                cursor: 'pointer',
                padding: '2px 0',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                width: '100%',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = textPrimary)}
              onMouseLeave={e => (e.currentTarget.style.color = textMuted)}
            >
              <span style={{ opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '55%' }}>
                {h.expr}
              </span>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>= {h.result}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Button primitive ─────────────────────────────────────────────
interface CalcBtnProps {
  label: string;
  value: string;
  onPress: (v: string) => void;
  bg: string;
  fg: string;
  fontSize?: number;
  fontWeight?: number;
  height?: number;
  flex?: number;
}

function CalcBtn({ label, value, onPress, bg, fg, fontSize = 17, fontWeight = 400, height = 44, flex = 1 }: CalcBtnProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      onClick={() => onPress(value)}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      animate={{ scale: pressed ? 0.9 : 1, opacity: pressed ? 0.8 : 1 }}
      transition={{ duration: 0.07 }}
      style={{
        flex,
        height,
        borderRadius: 10,
        background: bg,
        color: fg,
        border: 'none',
        fontSize,
        fontWeight,
        cursor: 'pointer',
        outline: 'none',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </motion.button>
  );
}

export const calculatorPillMeta = {
  name: 'Calculator',
  height: 530,
  keywords: ['calc', 'calculator', 'math tool'],
};
