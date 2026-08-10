import React, { useMemo } from 'react';
import * as math from 'mathjs';

interface MathGraphProps {
  functions: string[];
}

export default function MathGraph({ functions }: MathGraphProps) {
  const width = 400;
  const height = 300;
  const padding = 20;

  // Viewport for the graph
  const minX = -10;
  const maxX = 10;
  
  // Plot logic
  const { paths, minY, maxY, axes } = useMemo(() => {
    let yMin = Infinity;
    let yMax = -Infinity;
    const pointsData: { fn: string, points: [number, number][] }[] = [];

    functions.forEach(rawFn => {
      let fn = rawFn.trim();
      if (fn.toLowerCase().startsWith('y =')) fn = fn.substring(3).trim();
      else if (fn.toLowerCase().startsWith('y=')) fn = fn.substring(2).trim();
      else if (fn.toLowerCase().startsWith('f(x) =')) fn = fn.substring(6).trim();
      else if (fn.toLowerCase().startsWith('f(x)=')) fn = fn.substring(5).trim();

      try {
        const compiled = math.compile(fn);
        const points: [number, number][] = [];
        
        // Sample points
        const step = (maxX - minX) / 100;
        for (let x = minX; x <= maxX; x += step) {
          const y = compiled.evaluate({ x });
          if (typeof y === 'number' && isFinite(y)) {
            points.push([x, y]);
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
          }
        }
        pointsData.push({ fn, points });
      } catch (e) {
        console.error('Failed to compile function:', fn, e);
      }
    });

    // Add some padding to Y bounds
    if (yMin === Infinity) yMin = -10;
    if (yMax === -Infinity) yMax = 10;
    
    // Ensure symmetric or at least origin is visible
    if (yMin > 0) yMin = 0;
    if (yMax < 0) yMax = 0;
    
    // Add 10% margin
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

      // Color palette for multiple functions
      const colors = ['#4ADE80', '#60A5FA', '#F472B6', '#FBBF24'];
      return { fn: data.fn, path: d, color: colors[i % colors.length] };
    });

    const xAxis = { y: scaleY(0) };
    const yAxis = { x: scaleX(0) };

    return { paths, minY: yMin, maxY: yMax, axes: { xAxis, yAxis } };
  }, [functions]);

  if (paths.length === 0) {
    return <div style={{ color: '#E85A4A', fontSize: 12 }}>Could not render graph. Ensure the function is valid (e.g. <code>sin(x)</code>).</div>;
  }

  return (
    <div style={{ background: '#111', borderRadius: 12, padding: 12, border: '1px solid #2A2A2A', margin: '12px 0' }}>
      <svg width="100%" height="auto" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Grid and Axes */}
        <line x1={padding} y1={axes.xAxis.y} x2={width - padding} y2={axes.xAxis.y} stroke="#333" strokeWidth="1.5" />
        <line x1={axes.yAxis.x} y1={padding} x2={axes.yAxis.x} y2={height - padding} stroke="#333" strokeWidth="1.5" />
        
        {/* Plot Paths */}
        {paths.map((p, i) => (
          <path key={i} d={p.path} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>
      
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12, justifyContent: 'center' }}>
        {paths.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#AAA' }}>
            <div style={{ width: 12, height: 3, background: p.color, borderRadius: 2 }} />
            <code>f(x) = {p.fn}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
