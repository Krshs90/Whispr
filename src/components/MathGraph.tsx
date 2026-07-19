import React, { useEffect, useRef, useState } from 'react';
import * as math from 'mathjs';
import { Home } from 'lucide-react';

// Dynamic import since function-plot uses D3 and needs browser DOM
let functionPlot: any = null;

interface MathGraphProps {
  functions: string[];
  xDomain?: [number, number];
  yDomain?: [number, number];
  title?: string;
}

// Desmos-inspired color palette for multiple functions
const PLOT_COLORS = [
  '#4ADE80', // green
  '#60A5FA', // blue
  '#F87171', // red
  '#FBBF24', // amber
  '#A78BFA', // purple
  '#FB923C', // orange
  '#34D399', // teal
  '#F472B6', // pink
];

export default function MathGraph({ functions, xDomain = [-10, 10], yDomain = [-10, 10], title }: MathGraphProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [_hoveredPoint, _setHoveredPoint] = useState<{ x: number; y: number; fn: string } | null>(null);

  useEffect(() => {
    // Dynamically import function-plot (it's a CJS/UMD module with D3 bundled)
    import('function-plot').then((mod) => {
      // Handle aggressive ESM/CJS interop nesting (Vite + Webpack sometimes wraps default in default)
      if (typeof mod === 'function') {
        functionPlot = mod;
      } else if (mod.default && typeof mod.default === 'function') {
        functionPlot = mod.default;
      } else if ((mod as any).default?.default && typeof (mod as any).default.default === 'function') {
        functionPlot = (mod as any).default.default;
      } else if ((mod as any).module && typeof (mod as any).module.exports === 'function') {
        functionPlot = (mod as any).module.exports;
      } else {
        functionPlot = mod; // fallback 
      }
      setLoaded(true);
    }).catch((err) => {
      console.error(err);
      setError('Failed to load graphing engine');
    });
  }, []);

  useEffect(() => {
    if (!loaded || !rootRef.current || !functionPlot) return;

    // Clear previous
    rootRef.current.innerHTML = '';

    try {
      const data = functions.map((fn, i) => {
        // Strip out $ marks if the LLM hallucinated a LaTeX wrapper around the graphing equation
        let cleanFn = fn.replace(/\$/g, '').trim();
        
        // Intelligently strip explicit assignments (e.g., "y =", "y_1 =", "f''(x) =", "g(t) =", "(d)/(dx)(x^3 sin(x)) =") 
        // to prevent the graphing engine from treating them as implicit equations and crashing on "unidentified operator"
        const explicitMatch = cleanFn.match(/^(?:[a-zA-Z_][a-zA-Z0-9_]*(?:'+)?(?:\([^)]+\))?|(?:\(?[dD]\)?\/\(?[dD]x\)?)\s*(?:\([^)]+\))?)\s*=\s*(.+)$/);
        if (explicitMatch) {
          cleanFn = explicitMatch[1];
        }

        // Scrub accidental LaTeX tokens that the LLM might hallucinate
        cleanFn = cleanFn
          .replace(/\\sin/g, 'sin')
          .replace(/\\cos/g, 'cos')
          .replace(/\\tan/g, 'tan')
          .replace(/\\csc/g, 'csc')
          .replace(/\\sec/g, 'sec')
          .replace(/\\cot/g, 'cot')
          .replace(/\\ln/g, 'ln')
          .replace(/\\log/g, 'log')
          .replace(/\\exp/g, 'exp')
          .replace(/\\pi/g, 'pi')
          .replace(/\\e\b/g, 'e')
          .replace(/\\cdot/g, '*')
          .replace(/\\times/g, '*')
          .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
          .replace(/\\sqrt/g, 'sqrt')
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
          .replace(/\\left\(/g, '(')
          .replace(/\\right\)/g, ')')
          .replace(/\\left\[/g, '[')
          .replace(/\\right\]/g, ']')
          .replace(/\\/g, '') // remove any remaining slashes
          .replace(/[{}]/g, '') // remove remaining curly braces
          
        // Handle differential equation notation that crashes mathjs:
        // dy/dx = f(x) → just plot f(x)
        // d/dx(f(x)) = g(x) → just plot g(x)
        // y' = f(x) → just plot f(x)
        // y'' = f(x) → just plot f(x)
        cleanFn = cleanFn
          .replace(/^d[a-z]?\s*\/\s*d[a-z]\s*=\s*/i, '')       // dy/dx = ...
          .replace(/^d\s*\/\s*d[a-z]\s*\(.*?\)\s*=\s*/i, '')    // d/dx(...) = ...
          .replace(/^[a-z]'+\s*=\s*/i, '')                       // y' = ..., y'' = ...
          .replace(/^[a-z]'+\s*\([^)]*\)\s*=\s*/i, '');          // f'(x) = ...

        let isImplicit = cleanFn.includes('=');
        
        try {
          if (isImplicit) {
            // function-plot requires implicit equations to equal 0, e.g., f(x,y) = x^2+y^2-4
            const parts = cleanFn.split('=');
            if (parts.length === 2) {
              cleanFn = `${parts[0].trim()} - (${parts[1].trim()})`;
            }
          }
          // Let Math.js safely parse the string and explicitly format implicit multiplication (e.g. 3x^2 -> 3 * x ^ 2)
          cleanFn = math.parse(cleanFn).toString({ implicit: 'show' });
        } catch (err) {
          console.warn('MathJS parsing failed, falling back to raw string:', cleanFn);
        }

        return {
          fn: cleanFn,
          color: PLOT_COLORS[i % PLOT_COLORS.length],
          fnType: isImplicit ? 'implicit' : 'linear',
          sampler: isImplicit ? 'interval' : 'builtIn',
          graphType: 'polyline' as const,
          nSamples: isImplicit ? 4000 : 2000, 
        };
      });

      const containerWidth = rootRef.current.clientWidth || 460;
      const containerHeight = 350;

      functionPlot({
        target: rootRef.current,
        width: containerWidth,
        height: containerHeight,
        xAxis: {
          domain: xDomain,
          label: 'x',
        },
        yAxis: {
          domain: yDomain || undefined,
          label: 'y',
        },
        grid: true,
        data,
      });

      // ── Apply Desmos-style light theme via DOM post-processing ──
      const svg = rootRef.current.querySelector('svg');
      if (svg) {
        // Background
        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('width', '100%');
        bg.setAttribute('height', '100%');
        bg.setAttribute('fill', '#FFFFFF');
        svg.insertBefore(bg, svg.firstChild);

        // Axis lines
        svg.querySelectorAll('.axis path, .axis line').forEach((el: any) => {
          el.setAttribute('stroke', '#000000');
          el.setAttribute('stroke-width', '1.5');
        });

        // Grid lines
        svg.querySelectorAll('.grid line').forEach((el: any) => {
          el.setAttribute('stroke', '#E8E8E8');
          el.setAttribute('stroke-width', '1');
        });

        // Axis text and values (tick marks)
        svg.querySelectorAll('.axis text').forEach((el: any) => {
          el.setAttribute('fill', '#333333');
          el.style.fill = '#333333';
          el.style.fontSize = '12px';
          el.style.fontWeight = '500';
          el.style.fontFamily = "'Inter', sans-serif";
          el.style.opacity = '1';
          el.removeAttribute('opacity');
        });

        // Tick marks
        svg.querySelectorAll('.tick line').forEach((el: any) => {
          el.setAttribute('stroke', '#000000');
        });

        // Main plot lines — thicken them Desmos-style
        svg.querySelectorAll('.line').forEach((el: any) => {
          el.setAttribute('stroke-width', '2.5');
          el.setAttribute('stroke-linecap', 'round');
          el.setAttribute('stroke-linejoin', 'round');
        });

        // Remove default white background rects that function-plot adds
        svg.querySelectorAll('rect.zoom-and-drag').forEach((el: any) => {
          el.setAttribute('fill', 'transparent');
        });

        // Tooltip styling
        svg.querySelectorAll('.fn-tip').forEach((el: any) => {
          el.style.color = '#333333';
        });
      }
    } catch (e: any) {
      setError(`Could not plot: ${e.message}`);
    }
  }, [loaded, functions, xDomain, yDomain, resetKey]);

  if (error) {
    return (
      <div style={styles.errorBox}>
        <span style={{ color: '#FF3B30' }}>⚠ {error}</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerTitle}>{title || 'Graph'}</span>
        </div>
        <div style={styles.legend}>
          {functions.map((fn, i) => (
            <span key={i} style={styles.legendItem}>
              <span style={{ ...styles.legendDot, background: PLOT_COLORS[i % PLOT_COLORS.length] }} />
              <span style={styles.legendText}>{fn.trim()}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Graph container */}
      <div style={styles.graphWrapper}>
        {!loaded && (
          <div style={styles.loading}>
            <div style={styles.loadingDot} />
            Loading graph engine...
          </div>
        )}
        <div ref={rootRef} style={{ width: '100%', minHeight: 300 }} />
        
        {/* Floating Controls */}
        {loaded && (
          <div style={styles.floatingControls}>
            <button 
              onClick={() => setResetKey(k => k + 1)}
              style={styles.homeButton}
              title="Reset View (0,0)"
            >
              <Home size={16} color="#666" />
            </button>
          </div>
        )}
      </div>

      {/* Footer with interaction hints */}
      <div style={styles.footer}>
        <span>Scroll to zoom</span>
        <span>Drag to pan</span>
        <span>Hover for values</span>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: 12,
    overflow: 'hidden',
    margin: '12px 0',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid #F0F0F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#333333',
    letterSpacing: '0.02em',
  },
  legend: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendText: {
    fontSize: 11,
    color: '#555555',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  graphWrapper: {
    position: 'relative',
    minHeight: 300,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#666',
    fontSize: 12,
    zIndex: 5,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#4ADE80',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    gap: 16,
    padding: '6px 14px',
    borderTop: '1px solid #F0F0F0',
    fontSize: 10,
    color: '#666666',
  },
  errorBox: {
    padding: '12px 16px',
    background: '#FFF0F0',
    border: '1px solid #FFCCCC',
    borderRadius: 10,
    fontSize: 12,
    margin: '8px 0',
  },
  floatingControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  homeButton: {
    background: '#FFFFFF',
    border: '1px solid #E0E0E0',
    borderRadius: '6px',
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
};
