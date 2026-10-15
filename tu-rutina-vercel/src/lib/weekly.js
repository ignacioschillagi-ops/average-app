// Objetivo semanal y semanas seguidas (en vez de racha diaria: al gimnasio no se va todos
// los días). Una semana:
//   - 'met'    → llegaste al objetivo.
//   - 'saved'  → te faltó un día (objetivo - 1): igual cuenta para las semanas seguidas.
//   - 'missed' → te faltaron dos o más.
// Se cuentan días entrenados (fechas distintas del historial), no registros.

import { localDateKey, weekKeyOf, addDaysKey } from './dates';

export const DEFAULT_WEEKLY_GOAL = 3;

export const weeklyGoalOf = (data) => {
  if (data && data.weeklyGoal >= 1 && data.weeklyGoal <= 7) return data.weeklyGoal;
  const active = data && (data.variants || []).find((v) => v.id === data.activeVariant);
  const days = active ? (active.days || []).length : 0;
  return days >= 1 ? Math.min(7, days) : DEFAULT_WEEKLY_GOAL;
};

const statusFor = (count, goal) => {
  if (count >= goal) return 'met';
  if (goal >= 2 && count === goal - 1) return 'saved';
  return 'missed';
};

export const weeklyStats = (history, goal, now = Date.now(), weeksBack = 8) => {
  const thisWeek = weekKeyOf(now);
  const datesByWeek = {};
  (history || []).forEach((h) => {
    if (!h || !h.date) return;
    const wk = weekKeyOf(h.date);
    if (!datesByWeek[wk]) datesByWeek[wk] = new Set();
    datesByWeek[wk].add(h.date);
  });
  const countFor = (wk) => (datesByWeek[wk] ? datesByWeek[wk].size : 0);

  const thisWeekCount = countFor(thisWeek);
  const firstWeek = Object.keys(datesByWeek).sort()[0] || thisWeek;
  const weeks = [];
  for (let i = weeksBack - 1; i >= 0; i -= 1) {
    const wk = addDaysKey(thisWeek, -7 * i);
    const count = countFor(wk);
    let status;
    if (i === 0) status = count >= goal ? 'met' : 'current';
    else if (wk < firstWeek) status = 'none';
    else status = statusFor(count, goal);
    weeks.push({ week: wk, count, status });
  }

  // Semanas seguidas: desde la semana pasada hacia atrás (y esta si ya se cumplió).
  let streak = thisWeekCount >= goal ? 1 : 0;
  const oldest = Object.keys(datesByWeek).sort()[0];
  for (let i = 1; oldest && i < 520; i += 1) {
    const wk = addDaysKey(thisWeek, -7 * i);
    if (wk < oldest) break;
    if (statusFor(countFor(wk), goal) === 'missed') break;
    streak += 1;
  }

  const today = localDateKey(now);
  const thisWeekDates = [];
  for (let d = 0; d < 7; d += 1) {
    const key = addDaysKey(thisWeek, d);
    thisWeekDates.push({ date: key, trained: !!(datesByWeek[thisWeek] && datesByWeek[thisWeek].has(key)), future: key > today, today: key === today });
  }

  const lastDate = (history || []).reduce((acc, h) => (h && h.date > acc ? h.date : acc), '') || null;

  return {
    goal,
    thisWeekCount,
    remaining: Math.max(0, goal - thisWeekCount),
    weeks,
    streak,
    thisWeekDates,
    lastDate,
  };
};
