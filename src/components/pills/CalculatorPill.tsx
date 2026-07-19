import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

export function CalculatorPill({ defaultExpanded: _defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const [display, setDisplay] = useState('');
  const [result, setResult] = useState('0');
  const [scientific, setScientific] = useState(false);

  const handlePress = (val: string) => {
    if (val === 'AC') {
      setDisplay('');
      setResult('0');
      return;
    }
    if (val === 'DEL') {
      setDisplay(prev => prev.slice(0, -1));
      return;
    }
    if (val === '=') {
      try {
        let evalStr = display
          // Replace constants FIRST with unique tokens  
          .replace(/π/g, '(Math.PI)')
          .replace(/\^/g, '**')
          // Replace √ symbol: √(expr) or √num
          .replace(/√\(/g, 'Math.sqrt(')
          .replace(/√(\d+)/g, 'Math.sqrt($1)')
          // Replace text function names — use word boundaries to avoid partial matches
          .replace(/\bsqrt\(/g, 'Math.sqrt(')
          .replace(/\bsin\(/g, 'Math.sin(')
          .replace(/\bcos\(/g, 'Math.cos(')
          .replace(/\btan\(/g, 'Math.tan(')
          .replace(/\bln\(/g, 'Math.log(')
          .replace(/\blog\(/g, 'Math.log10(')
          // Replace standalone 'e' only when it's not part of a word
          .replace(/\be\b(?![\w.])/g, '(Math.E)');

        const newResult = new Function('return ' + evalStr)();
        if (Number.isFinite(newResult)) {
           // Round to 8 decimal places max
           setResult(Math.round(newResult * 100000000) / 100000000 + '');
        } else {
           setResult('Error');
        }
      } catch (e) {
        setResult('Error');
      }
      return;
    }

    setDisplay(prev => prev + val);
  };

  const basicBtns = [
    ['AC', 'DEL', '(', ')'],
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];

  const sciBtns = [
    ['sin', 'cos', 'tan', '√'],
    ['log', 'ln', '^', 'π']
  ];

  const Btn = ({ label, isOp }: { label: string; isOp?: boolean }) => (
    <button
      onClick={() => handlePress(label)}
      style={{
        flex: 1, height: 44, borderRadius: 10,
        background: isOp ? '#4ADE8022' : '#2A2A2A',
        color: isOp ? '#4ADE80' : '#FFFFEB',
        border: 'none', fontSize: 16, fontWeight: 600,
        cursor: 'pointer', outline: 'none'
      }}
      onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
      onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      width: '100%',
      background: '#1A1A1A',
      padding: '14px 20px 20px',
      display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      borderRadius: 'inherit',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#4ADE8022', display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>
            <Calculator size={16} color="#4ADE80" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#A0A0A5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            TI-84
          </span>
        </div>
        <button
          onClick={() => setScientific(!scientific)}
          style={{
            background: scientific ? '#4ADE8022' : 'transparent',
            border: '1px solid #333', borderRadius: 8,
            color: scientific ? '#4ADE80' : '#888',
            fontSize: 11, padding: '4px 8px', cursor: 'pointer', fontWeight: 600
          }}
        >
          {scientific ? 'BASIC' : 'SCI'}
        </button>
      </div>

      {/* Screen */}
      <div style={{
        background: '#0D0D0D', borderRadius: 12, padding: '16px',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        border: '1px solid #2A2A2A', marginBottom: 16, minHeight: 80, justifyContent: 'flex-end'
      }}>
        <div style={{ fontSize: 14, color: '#6A6A70', minHeight: 20, letterSpacing: '0.05em', fontFamily: 'monospace' }}>
          {display || '0'}
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#FFFFEB', fontVariantNumeric: 'tabular-nums' }}>
          {result}
        </div>
      </div>

      {/* Keypad */}
      <motion.div animate={{ height: 'auto' }} style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        {scientific && sciBtns.map((row, i) => (
          <div key={`sci-${i}`} style={{ display: 'flex', gap: 8 }}>
            {row.map(btn => <Btn key={btn} label={btn} isOp />)}
          </div>
        ))}
        {basicBtns.map((row, i) => (
          <div key={`basic-${i}`} style={{ display: 'flex', gap: 8 }}>
            {row.map(btn => <Btn key={btn} label={btn} isOp={['/', '*', '-', '+', '=', 'AC', 'DEL'].includes(btn)} />)}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export const calculatorPillMeta = { name: 'Calculator', height: 480, keywords: ['calc', 'calculator', 'math tool'] };
