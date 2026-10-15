// Gráfico de progreso de un ejercicio: la mejor serie de cada sesión (peso, o repeticiones si
// es a peso corporal). Una sola serie de datos: línea de 2 px, lavado suave debajo, punto final
// marcado y el valor escrito solo al final. Tocando o pasando el dedo se ve cada sesión.
import React, { useRef, useState } from 'react';
import { formatKg, formatSet } from '../lib/lifts';
import { formatShortDate } from '../lib/dates';

const VB_W = 320;
const VB_H = 170;
const PAD = { top: 22, right: 14, bottom: 26, left: 36 };
const LINE = '#C24747';
const GRID = '#2A2B2F';
const SURFACE = '#1C1D20';

const niceTicks = (min, max) => {
  if (min === max) return [min];
  const span = max - min;
  const raw = span / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) || raw;
  const start = Math.floor(min / step) * step;
  const ticks = [];
  for (let v = start; v <= max + step * 0.01; v += step) ticks.push(Number(v.toFixed(4)));
  return ticks;
};

export default function ProgressChart({ series, unit = 'kg', ariaLabel }) {
  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  if (!series || series.length === 0) return null;

  const values = series.map((p) => p.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) { min = Math.max(0, min - (unit === 'kg' ? 5 : 2)); max += unit === 'kg' ? 5 : 2; }
  const ticks = niceTicks(min, max);
  const yMin = Math.min(min, ticks[0]);
  const yMax = Math.max(max, ticks[ticks.length - 1]);
  const plotW = VB_W - PAD.left - PAD.right;
  const plotH = VB_H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (series.length === 1 ? plotW / 2 : (i / (series.length - 1)) * plotW);
  const y = (v) => PAD.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  const points = series.map((p, i) => [x(i), y(p.value)]);
  const linePath = points.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${points[0][0].toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`;
  const last = series[series.length - 1];
  const lastPt = points[points.length - 1];
  const fmt = (v) => (unit === 'kg' ? `${formatKg(v)} kg` : `${formatKg(v)}`);

  const pickIndex = (clientX) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const vx = ((clientX - rect.left) / rect.width) * VB_W;
    let best = 0;
    points.forEach(([px], i) => { if (Math.abs(px - vx) < Math.abs(points[best][0] - vx)) best = i; });
    return best;
  };
  const onMove = (e) => setHover(pickIndex(e.clientX));
  const hovered = hover != null ? series[hover] : null;
  const hp = hover != null ? points[hover] : null;
  const tipLeftPct = hp ? Math.min(78, Math.max(4, (hp[0] / VB_W) * 100 - 18)) : 0;

  return (
    <div className="pchart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label={ariaLabel}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={VB_W - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end" className="pchart-tick">{formatKg(t)}</text>
          </g>
        ))}
        <path d={areaPath} fill={LINE} opacity="0.1" />
        {series.length > 1 && <path d={linePath} fill="none" stroke={LINE} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {hp && <line x1={hp[0]} x2={hp[0]} y1={PAD.top} y2={PAD.top + plotH} stroke="#6F6E69" strokeWidth="1" />}
        {hp && <circle cx={hp[0]} cy={hp[1]} r="5" fill={LINE} stroke={SURFACE} strokeWidth="2" />}
        <circle cx={lastPt[0]} cy={lastPt[1]} r="4.5" fill={LINE} stroke={SURFACE} strokeWidth="2" />
        <text
          x={lastPt[0]}
          y={lastPt[1] < PAD.top + 14 ? lastPt[1] + 18 : lastPt[1] - 10}
          textAnchor={series.length > 1 ? 'end' : 'middle'}
          className="pchart-endlabel"
        >
          {fmt(last.value)}
        </text>
        <text x={PAD.left} y={VB_H - 6} className="pchart-tick">{formatShortDate(series[0].date)}</text>
        {series.length > 1 && (
          <text x={VB_W - PAD.right} y={VB_H - 6} textAnchor="end" className="pchart-tick">{formatShortDate(last.date)}</text>
        )}
      </svg>
      {hovered && (
        <div className="pchart-tip" style={{ left: `${tipLeftPct}%` }}>
          <span className="pchart-tip-date">{formatShortDate(hovered.date)}</span>
          <span className="pchart-tip-value">{formatSet({ kg: hovered.bodyweight ? '' : hovered.kg, reps: hovered.reps })}</span>
        </div>
      )}
    </div>
  );
}
