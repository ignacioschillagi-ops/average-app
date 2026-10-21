// Compartir: rutina como link (se abre ya cargada) y compartir archivos/textos con el
// menú nativo del celular, con alternativas cuando no está disponible.

import { WEEKDAY_KEYS, normalizeWeekday } from '../i18n-content';

const toBase64Url = (str) => btoa(unescape(encodeURIComponent(str)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const fromBase64Url = (b64) => {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
};

export const ROUTINE_HASH_KEY = 'rutina';

// Formato compacto: { v, n: nombre, l: idioma, d: [[díaIdx, etiqueta, [[ejercicio, series], ...]], ...] }
export const encodeRoutine = (variant, lang) => {
  const payload = {
    v: 1,
    n: variant.name,
    l: lang,
    d: (variant.days || []).map((d) => [
      Math.max(0, WEEKDAY_KEYS.indexOf(d.weekday)),
      d.tagLabel || '',
      // Un cambio "solo por hoy" no es parte de la rutina: se comparte el ejercicio original.
      // Lo agregado "solo hoy" tampoco.
      (d.list || []).filter((e) => !e.tempDate).map((e) => [(e.swappedFrom && e.swappedFrom.name) || e.name, e.sets || '']),
    ]),
  };
  return toBase64Url(JSON.stringify(payload));
};

export const decodeRoutine = (encoded) => {
  try {
    const p = JSON.parse(fromBase64Url(encoded));
    if (!p || p.v !== 1 || !Array.isArray(p.d)) return null;
    const seen = new Set();
    const days = p.d
      .map((d) => ({
        weekday: WEEKDAY_KEYS[d[0]] || normalizeWeekday(d[0]),
        tagLabel: String(d[1] || '').slice(0, 40),
        exercises: (Array.isArray(d[2]) ? d[2] : []).slice(0, 30).map((e) => ({
          name: String(e[0] || '').slice(0, 80),
          sets: String(e[1] || '').slice(0, 30),
        })).filter((e) => e.name),
      }))
      .filter((d) => d.weekday && !seen.has(d.weekday) && seen.add(d.weekday));
    if (!days.length) return null;
    return { name: String(p.n || '').slice(0, 60), lang: p.l, days };
  } catch (e) {
    return null;
  }
};

export const routineShareUrl = (variant, lang) => `${window.location.origin}/#${ROUTINE_HASH_KEY}=${encodeRoutine(variant, lang)}`;

// Lee una rutina compartida del link actual (#rutina=...), si hay.
export const readSharedRoutineFromUrl = () => {
  try {
    const hash = window.location.hash || '';
    const m = hash.match(new RegExp(`${ROUTINE_HASH_KEY}=([A-Za-z0-9_-]+)`));
    return m ? decodeRoutine(m[1]) : null;
  } catch (e) {
    return null;
  }
};

export const clearSharedRoutineFromUrl = () => {
  try {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
  } catch (e) { /* noop */ }
};

// Comparte texto + link con el menú del celular; si no hay, abre WhatsApp.
export const shareTextAndLink = async ({ title, text, url }) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, '_blank', 'noopener');
  return 'whatsapp';
};

// Comparte una imagen (para historias de Instagram); si no se puede, la descarga.
export const shareImage = async (blob, filename, title) => {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
};
