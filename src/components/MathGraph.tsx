import { useMemo, useEffect, useRef, useState } from 'react';
import * as math from 'mathjs';

interface MathGraphProps {
  functions: string[];
}

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (el: HTMLElement, options?: Record<string, unknown>) => {
        setExpression: (expr: { id: string; latex: string; color?: string }) => void;
        destroy: () => void;
        resize: () => void;
      };
    };
  }
}

const width = 580;
const height = 360;
const padding = 28;
const minX = -10;
const maxX = 10;

/**
 * Normalizes any raw LLM or user equation (including LaTeX like \sin, \cdot, \frac{a}{b}, $$...$$)
 * into a clean, backslash-free right-hand-side math expression like `sin(x) * x`.
 */
function normalizeToPlainMath(rawFn: string): string {
  let fn = rawFn
    .trim()
    .replace(/^\$+|\$+$/g, '')
    .replace(/^`+|`+$/g, '')
    .replace(/^[-*•]\s*/, '')
    .replace(/^(?:plot|graph|draw(?:\s+a)?(?:\s+graph)?|equation\s+for|function\s+for|curve\s+for)\s*(?:of\s+)?/i, '')
    .replace(/^of\s+/i, '')
    .trim();

  // Strip leading y = or f(x) =
  fn = fn.replace(/^(?:[a-zA-Z]\s*\(\s*x\s*\)|y|f)\s*=\s*/i, '').trim();

  // If there is still an '=' (e.g. equation), take the right-hand side
  if (fn.includes('=')) {
    const parts = fn.split('=');
    fn = parts[parts.length - 1].trim();
  }

  // Strip any lingering 'of ' after '='
  fn = fn.replace(/^of\s+/i, '').trim();

  // Convert LaTeX left/right parens and braces
  fn = fn
    .replace(/\\left\s*\(/g, '(')
    .replace(/\\right\s*\)/g, ')')
    .replace(/\\left\s*\[/g, '(')
    .replace(/\\right\s*\]/g, ')')
    .replace(/\\left\s*\{/g, '(')
    .replace(/\\right\s*\}/g, ')');

  // Convert \frac{a}{b} -> ((a)/(b))
  let prev = '';
  while (prev !== fn && /\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/.test(fn)) {
    prev = fn;
    fn = fn.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '(($1)/($2))');
  }

  // Convert \sqrt{a} -> sqrt(a)
  fn = fn.replace(/\\sqrt\s*\{([^{}]+)\}/g, 'sqrt($1)');

  // Convert LaTeX operators and constants
  fn = fn
    .replace(/\\(?:cdot|times)\b/g, '*')
    .replace(/\\div\b/g, '/')
    .replace(/\\pi\b/gi, 'pi')
    .replace(/[×⋅]/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');

  // Strip backslashes before standard math functions (\sin, \\sin, \operatorname{sin}, etc.)
  fn = fn.replace(/\\+operatorname\s*\{([a-zA-Z]+)\}/g, '$1');
  fn = fn.replace(/\\+(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|asin|acos|atan|sinh|cosh|tanh|ln|log|exp|sqrt|abs)\b/gi, '$1');

  // Convert remaining LaTeX braces in exponents like x^{2} -> x^(2)
  fn = fn.replace(/\^\s*\{([^{}]+)\}/g, '^($1)');

  // Final sanity clean: strip any leading 'of ' or 'the '
  fn = fn.replace(/^(?:of|the)\s+/i, '').trim();

  return fn;
}

/**
 * Converts a normalized math expression into clean Desmos LaTeX without ever doubling backslashes.
 */
function toDesmosLatex(rawFn: string): string {
  const plain = normalizeToPlainMath(rawFn);
  if (!plain) return 'y = x';

  const latexBody = plain
    .replace(/\bsqrt\s*\(([^()]+)\)/gi, '\\sqrt{$1}')
    .replace(/\b(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan|sinh|cosh|tanh|ln|log)\s*\(/gi, '\\$1(')
    .replace(/\bpi\b/gi, '\\pi ')
    .replace(/\^\s*\(([^()]+)\)/g, '^{$1}')
    .replace(/\*/g, '\\cdot ');

  return `y = ${latexBody}`;
}

let desmosScriptPromise: Promise<boolean> | null = null;
function ensureDesmosLoaded(): Promise<boolean> {
  if (typeof window !== 'undefined' && window.Desmos) {
    return Promise.resolve(true);
  }
  if (desmosScriptPromise) return desmosScriptPromise;

  desmosScriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.querySelector('script[data-desmos-api="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Desmos)));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.desmos.com/api/v1.9/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
    script.async = true;
    script.dataset.desmosApi = 'true';
    script.onload = () => resolve(Boolean(window.Desmos));
    script.onerror = () => {
      desmosScriptPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return desmosScriptPromise;
}

export default function MathGraph({ functions }: MathGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const calculatorRef = useRef<any>(null);
  const [useDesmos, setUseDesmos] = useState(true);
  const [desmosReady, setDesmosReady] = useState(false);
  const [desmosFailed, setDesmosFailed] = useState(false);

  const cleanedFunctions = useMemo(
    () => functions.map(normalizeToPlainMath).filter(Boolean),
    [functions]
  );

  // Load and initialize Desmos Graphing Calculator
  useEffect(() => {
    let mounted = true;
    if (!useDesmos) return;

    ensureDesmosLoaded().then((loaded) => {
      if (!mounted) return;
      if (!loaded || !window.Desmos || !containerRef.current) {
        setDesmosFailed(true);
        return;
      }

      try {
        if (calculatorRef.current) {
          calculatorRef.current.destroy();
          calculatorRef.current = null;
        }
        const calc = window.Desmos.GraphingCalculator(containerRef.current, {
          keypad: false,
          expressions: true,
          expressionsCollapsed: true,
          settingsMenu: true,
          zoomButtons: true,
          invertedColors: true,
          border: false,
          autosize: true,
        });
        calculatorRef.current = calc;

        const colors = ['#4ADE80', '#60A5FA', '#F472B6', '#FBBF24'];
        functions.forEach((rawFn, idx) => {
          calc.setExpression({
            id: `fn-${idx}`,
            latex: toDesmosLatex(rawFn),
            color: colors[idx % colors.length],
          });
        });

        setDesmosReady(true);

        const resizeCalc = () => {
          try { calc.resize(); } catch {}
        };
        resizeCalc();
        setTimeout(resizeCalc, 60);
        setTimeout(resizeCalc, 250);

        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
          const ro = new ResizeObserver(() => {
            resizeCalc();
          });
          ro.observe(containerRef.current);
        }
      } catch (err) {
        console.error('[MathGraph] Desmos init failed, using SVG fallback:', err);
        setDesmosFailed(true);
      }
    });

    return () => {
      mounted = false;
      if (calculatorRef.current) {
        try { calculatorRef.current.destroy(); } catch {}
        calculatorRef.current = null;
      }
    };
  }, [functions, useDesmos]);

  // Local SVG fallback plot logic
  const { paths, axes } = useMemo(() => {
    let yMin = Infinity;
    let yMax = -Infinity;
    const pointsData: { fn: string; points: [number, number][] }[] = [];

    cleanedFunctions.forEach(plainFn => {
      // mathjs uses log(x) for natural logarithm
      const mathJsExpr = plainFn
        .replace(/\bln\s*\(/gi, 'log(')
        .replace(/\barcsin\s*\(/gi, 'asin(')
        .replace(/\barccos\s*\(/gi, 'acos(')
        .replace(/\barctan\s*\(/gi, 'atan(');

      try {
        const compiled = math.compile(mathJsExpr);
        const points: [number, number][] = [];
        const step = (maxX - minX) / 200;
        for (let x = minX; x <= maxX; x += step) {
          const y = compiled.evaluate({ x });
          if (typeof y === 'number' && isFinite(y)) {
            points.push([x, y]);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
          }
        }
        if (points.length > 0) {
          pointsData.push({ fn: plainFn, points });
        }
      } catch (e) {
        console.error('Failed to compile function:', mathJsExpr, e);
      }
    });

    if (yMin === Infinity) yMin = -10;
    if (yMax === -Infinity) yMax = 10;
    if (yMin > 0) yMin = 0;
    if (yMax < 0) yMax = 0;

    const yRange = yMax - yMin;
    if (yRange === 0) {
      yMax += 5;
      yMin -= 5;
    } else {
      yMax += yRange * 0.1;
      yMin -= yRange * 0.1;
    }

    const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * (width - padding * 2);
    const scaleY = (y: number) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - padding * 2);

    const paths = pointsData.map((data, i) => {
      if (data.points.length === 0) return { fn: data.fn, path: '', color: '' };
      const d = data.points.map((p, idx) => {
        const sx = scaleX(p[0]);
        const sy = scaleY(p[1]);
        return `${idx === 0 ? 'M' : 'L'} ${sx} ${sy}`;
      }).join(' ');
      const colors = ['#4ADE80', '#60A5FA', '#F472B6', '#FBBF24'];
      return { fn: data.fn, path: d, color: colors[i % colors.length] };
    });

    return { paths, axes: { xAxis: { y: scaleY(0) }, yAxis: { x: scaleX(0) } } };
  }, [cleanedFunctions]);

  const showDesmos = useDesmos && !desmosFailed;

  return (
    <div
      onWheel={e => e.stopPropagation()}
      style={{
        background: '#141417',
        borderRadius: 14,
        padding: 12,
        border: '1px solid #2A2A30',
        margin: '8px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: '100%',
        minWidth: 'min(100%, 540px)',
        maxWidth: 720,
        boxSizing: 'border-box',
      }}
    >
      {/* Top Bar with Function name and view switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#888' }}>
            Function
          </span>
          <code style={{ fontSize: 13, color: '#4ADE80', fontWeight: 600, background: 'rgba(74, 222, 128, 0.08)', padding: '2px 8px', borderRadius: 6 }}>
            {cleanedFunctions.map(f => `y = ${f}`).join(' , ')}
          </code>
        </div>
        <button
          onClick={() => setUseDesmos(prev => !prev)}
          style={{
            background: '#222228', color: '#A0A0A5', border: '1px solid #33333C',
            borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2D2D35'; e.currentTarget.style.color = '#FFF'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#222228'; e.currentTarget.style.color = '#A0A0A5'; }}
        >
          {showDesmos ? 'Switch to Simple SVG' : 'Switch to Desmos'}
        </button>
      </div>

      {/* Desmos Interactive View */}
      {showDesmos ? (
        <div style={{ position: 'relative', width: '100%', minHeight: 400, height: 420, borderRadius: 10, overflow: 'hidden', border: '1px solid #26262C' }}>
          {!desmosReady && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#111114', color: '#8A8A92', fontSize: 13, zIndex: 1
            }}>
              Loading Desmos Calculator...
            </div>
          )}
          <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 400 }} />
        </div>
      ) : (
        /* Local SVG Fallback View */
        paths.length === 0 ? (
          <div style={{ color: '#E85A4A', fontSize: 12, padding: 12 }}>
            Could not render graph. Ensure the function is valid (e.g. <code>sin(x)</code>).
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <svg width="100%" height="auto" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', borderRadius: 8, background: '#0D0D10' }}>
              <line x1={padding} y1={axes.xAxis.y} x2={width - padding} y2={axes.xAxis.y} stroke="#333" strokeWidth="1.5" />
              <line x1={axes.yAxis.x} y1={padding} x2={axes.yAxis.x} y2={height - padding} stroke="#333" strokeWidth="1.5" />
              {paths.map((p, i) => (
                <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </svg>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8, justifyContent: 'center' }}>
              {paths.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#AAA' }}>
                  <div style={{ width: 12, height: 3, background: p.color, borderRadius: 2 }} />
                  <code>y = {p.fn}</code>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

