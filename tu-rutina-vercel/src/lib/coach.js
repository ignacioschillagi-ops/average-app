// Joe's te escribe si pasan varios días sin anotar ningún entrenamiento: pregunta si está
// todo bien y te tira una mano para volver (qué te toca hoy o lo próximo de tu rutina).
// Es un mensaje armado en la app (no usa la IA), así que llega aunque no haya API key ni
// internet. Uno por cada racha sin entrenar: cuando volvés a entrenar, se rearma.

import { tr } from '../i18n';
import { WEEKDAY_KEYS, weekdayLabel } from '../i18n-content';
import { localDateKey, daysBetweenKeys } from './dates';

export const COACH_NUDGE_DAYS = 5;

const lastWorkoutDate = (history) => (history || []).reduce((acc, h) => (h && h.date > acc ? h.date : acc), '') || null;

// Desde cuándo se cuenta: el último entrenamiento o, si nunca entrenó, el día que armó la rutina.
export const nudgeReference = (data) => {
  const last = lastWorkoutDate(data && data.history);
  if (last) return { ref: `last:${last}`, from: last, trainedBefore: true };
  if (data && data.startedOn) return { ref: `start:${data.startedOn}`, from: data.startedOn, trainedBefore: false };
  return null;
};

// "Hoy te toca PUSH" o "Lo próximo en tu rutina: Jueves, PIERNA".
const nextDayHint = (data, now, lang) => {
  const variant = (data.variants || []).find((v) => v.id === data.activeVariant) || (data.variants || [])[0];
  const days = (variant && variant.days) || [];
  if (!days.length) return '';
  const todayIdx = (new Date(now).getDay() + 6) % 7;
  for (let offset = 0; offset < 7; offset += 1) {
    const key = WEEKDAY_KEYS[(todayIdx + offset) % 7];
    const day = days.find((d) => d.weekday === key);
    if (!day) continue;
    const focus = day.tagLabel || '';
    if (offset === 0) return tr('nudgeNextToday', { focus: focus || weekdayLabel(key, lang) });
    return tr('nudgeNextUpcoming', { weekday: weekdayLabel(key, lang), focus: focus || '' }).replace(/,\s*\.$/, '.');
  }
  return '';
};

/**
 * Si corresponde un mensaje, devuelve { ref, days, text }; si no, null.
 */
export const coachNudgeFor = (data, now = Date.now(), lang = 'es') => {
  if (!data || !(data.variants || []).some((v) => (v.days || []).length)) return null;
  const reference = nudgeReference(data);
  if (!reference) return null;
  const days = daysBetweenKeys(reference.from, localDateKey(now));
  if (days < COACH_NUDGE_DAYS) return null;
  const name = ((data.profile && data.profile.name) || '').trim().split(/\s+/)[0] || '';
  const vars = { n: days, nm: name ? `, ${name}` : '', next: nextDayHint(data, now, lang) };
  let key;
  if (!reference.trainedBefore) key = 'nudgeFirst';
  else {
    // Varía el mensaje según la fecha, para que no sea siempre el mismo.
    const seed = reference.from.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    key = ['nudge1', 'nudge2', 'nudge3'][seed % 3];
  }
  const text = tr(key, vars).replace(/\s{2,}/g, ' ').trim();
  return { ref: reference.ref, days, text };
};
