// Registro por serie, "la vez pasada", récords y progreso por ejercicio.
//
// En la rutina, cada ejercicio puede tener el registro de la sesión actual:
//   e.log = { id, date: 'AAAA-MM-DD', startedAt, updatedAt, sets: [{ kg, reps, done, at }] }
// (kg y reps se guardan como texto tal cual se escribieron; se pasan a número al usarlos).
//
// Y el historial de cargas de cada ejercicio vive aparte, en data.lifts, con una clave que es
// la misma en los 3 idiomas (exerciseKey):
//   data.lifts[clave] = [{ id, date, ts, name, sets: [{ kg, reps }] }]   (solo series hechas)
// Así "la vez pasada" y los gráficos no dependen de la rutina ni del idioma.

import { exerciseKey } from '../i18n-content';
import { getLang } from '../i18n';
import { localDateKey } from './dates';

// Pasados 12 h desde la última serie anotada, lo que se anote es una sesión nueva.
export const SESSION_STALE_MS = 12 * 60 * 60 * 1000;

const LOCALES = { es: 'es-AR', en: 'en-US', it: 'it-IT' };
const locale = () => LOCALES[getLang()] || 'es-AR';

export const parseNumber = (v) => {
  if (v === '' || v == null) return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const firstNumber = (s) => {
  const m = String(s == null ? '' : s).match(/\d+(?:[.,]\d+)?/);
  return m ? parseNumber(m[0]) : null;
};

export const formatKg = (n) => (n == null ? '' : Number(n).toLocaleString(locale(), { maximumFractionDigits: 2 }));

// "60 kg × 8", "× 12" (peso corporal) o "60 kg".
export const formatSet = (set) => {
  const kg = parseNumber(set && set.kg);
  const reps = parseNumber(set && set.reps);
  if (kg && reps) return `${formatKg(kg)} kg × ${formatKg(reps)}`;
  if (reps) return `× ${formatKg(reps)}`;
  if (kg) return `${formatKg(kg)} kg`;
  return '—';
};

// Series planeadas a partir del texto del objetivo: "4x8", "4x6-8", "15-12-10-8-6",
// "3 series", "3x12 c/pierna", "3x30s"... Si no se entiende, 3 series.
export const planSets = (target) => {
  const t = String(target || '').toLowerCase().replace(/×/g, 'x');
  const pyramid = t.match(/^\s*(\d+(?:\s*-\s*\d+){2,})\b/);
  if (pyramid) return pyramid[1].split('-').map((x) => ({ reps: x.trim() })).slice(0, 10);
  const m = t.match(/(\d+)\s*x\s*(\d+)(?:\s*-\s*(\d+))?/);
  if (m) {
    const count = Math.max(1, Math.min(10, parseInt(m[1], 10)));
    const reps = m[3] ? `${m[2]}-${m[3]}` : m[2];
    return Array.from({ length: count }, () => ({ reps }));
  }
  const s = t.match(/(\d+)\s*(series|sets|serie)\b/);
  if (s) return Array.from({ length: Math.max(1, Math.min(10, parseInt(s[1], 10))) }, () => ({ reps: '' }));
  return Array.from({ length: 3 }, () => ({ reps: '' }));
};

// El registro de esta sesión, o null si el que hay es de una sesión anterior.
export const currentLog = (exercise, now = Date.now()) => {
  const log = exercise && exercise.log;
  if (!log || !Array.isArray(log.sets)) return null;
  return now - (log.updatedAt || 0) <= SESSION_STALE_MS ? log : null;
};

export const doneSetsOf = (exercise, now = Date.now()) => {
  const log = currentLog(exercise, now);
  return log ? log.sets.filter((s) => s.done) : [];
};

export const liftEntriesFor = (lifts, name) => ((lifts || {})[exerciseKey(name)] || []);

// La sesión anterior a la actual (la más reciente con series hechas que no sea esta).
export const lastSession = (lifts, name, excludeId) => {
  const entries = liftEntriesFor(lifts, name).filter((e) => e.id !== excludeId && e.sets && e.sets.length);
  if (!entries.length) return null;
  return entries.reduce((a, b) => (b.ts > a.ts ? b : a));
};

const setKg = (s) => parseNumber(s.kg) || 0;
const setReps = (s) => parseNumber(s.reps) || 0;
export const estimate1RM = (kg, reps) => (kg > 0 && reps > 0 && reps <= 12 ? kg * (1 + reps / 30) : null);

// Mejores marcas en un conjunto de sesiones.
export const bestsOf = (entries) => {
  let maxKg = null;
  let maxReps = null;
  let best1RM = null;
  (entries || []).forEach((e) => (e.sets || []).forEach((s) => {
    const kg = setKg(s);
    const reps = setReps(s);
    if (kg > 0 && (!maxKg || kg > maxKg.kg || (kg === maxKg.kg && reps > maxKg.reps))) maxKg = { kg, reps, date: e.date };
    if (kg === 0 && reps > 0 && (!maxReps || reps > maxReps.reps)) maxReps = { reps, date: e.date };
    const orm = estimate1RM(kg, reps);
    if (orm && (!best1RM || orm > best1RM.value)) best1RM = { value: orm, kg, reps, date: e.date };
  }));
  return { maxKg, maxReps, best1RM };
};

// ¿Esta serie es un récord comparada con todo lo anterior? Solo si ya había historia.
export const recordFor = (lifts, name, set, currentLogId, earlierSetsToday = []) => {
  const previous = liftEntriesFor(lifts, name).filter((e) => e.id !== currentLogId);
  if (!previous.length) return null;
  const pool = [...previous, { sets: earlierSetsToday }];
  const { maxKg, maxReps } = bestsOf(pool);
  const kg = setKg(set);
  const reps = setReps(set);
  if (kg > 0) {
    if (!maxKg || kg > maxKg.kg) return { type: 'kg', kg, reps };
    if (kg === maxKg.kg && reps > maxKg.reps) return { type: 'reps', kg, reps };
    return null;
  }
  if (reps > 0 && maxReps && reps > maxReps.reps) return { type: 'bodyweight', reps };
  return null;
};

// Una línea por sesión para el gráfico: la mejor serie (por peso; si es a peso corporal,
// por repeticiones).
export const progressSeries = (entries) => (entries || [])
  .filter((e) => e.sets && e.sets.length)
  .slice()
  .sort((a, b) => a.ts - b.ts)
  .map((e) => {
    const top = e.sets.reduce((best, s) => {
      if (!best) return s;
      if (setKg(s) !== setKg(best)) return setKg(s) > setKg(best) ? s : best;
      return setReps(s) > setReps(best) ? s : best;
    }, null);
    const kg = setKg(top);
    return { id: e.id, date: e.date, ts: e.ts, kg, reps: setReps(top), value: kg > 0 ? kg : setReps(top), bodyweight: kg === 0, sets: e.sets };
  });

// Actualiza data.lifts cuando cambian los registros de los ejercicios de un día.
export const trackLifts = (lifts, before, after) => {
  const prevById = {};
  ((before && before.list) || []).forEach((e) => { prevById[e.id] = e; });
  let next = lifts || {};
  (after.list || []).forEach((e) => {
    const prev = prevById[e.id];
    if (prev && prev.log === e.log && prev.name === e.name) return;
    // Si cambió el nombre (cambio de ejercicio), la sesión vieja queda con su nombre anterior.
    const log = e.log;
    if (!log || !log.id) return;
    const key = exerciseKey(e.name);
    const doneSets = log.sets.filter((s) => s.done).map((s) => ({ kg: s.kg, reps: s.reps }));
    const list = (next[key] || []).filter((x) => x.id !== log.id);
    if (doneSets.length) {
      list.push({ id: log.id, date: log.date || localDateKey(log.startedAt || Date.now()), ts: log.updatedAt || Date.now(), name: e.name, sets: doneSets });
      list.sort((a, b) => a.ts - b.ts);
    }
    if (list.length === (next[key] || []).length && !doneSets.length) return;
    next = { ...next, [key]: list };
    if (!list.length) {
      const { [key]: _removed, ...rest } = next;
      next = rest;
    }
  });
  return next;
};
