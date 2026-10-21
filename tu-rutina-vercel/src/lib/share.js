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
const SHORT_PATH = /^\/r\/([A-Za-z0-9]{7})\/?$/;

// Formato compacto: { v, n: nombre, l: idioma, f: quién la comparte,
//                     d: [[díaIdx, etiqueta, [[ejercicio, series], ...]], ...] }
export const routinePayload = (variant, lang, from) => {
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
  if (from) payload.f = String(from).slice(0, 30);
  return payload;
};

export const encodeRoutine = (variant, lang, from) => toBase64Url(JSON.stringify(routinePayload(variant, lang, from)));

const normalizePayload = (p) => {
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
  return { name: String(p.n || '').slice(0, 60), lang: p.l, from: p.f ? String(p.f).slice(0, 30) : '', days };
};

export const decodeRoutine = (encoded) => {
  try {
    return normalizePayload(JSON.parse(fromBase64Url(encoded)));
  } catch (e) {
    return null;
  }
};

// Link largo (todo dentro del link): respaldo si no se puede crear el corto.
export const routineShareUrl = (variant, lang, from) => `${window.location.origin}/#${ROUTINE_HASH_KEY}=${encodeRoutine(variant, lang, from)}`;

// Link corto (average-app.vercel.app/r/K7P2QMX): la rutina queda guardada en el servidor.
export const createRoutineLink = async (variant, lang, from) => {
  try {
    const res = await fetch('/api/routine-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routine: routinePayload(variant, lang, from) }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const { id } = await res.json();
    if (!id) throw new Error('sin id');
    return `${window.location.origin}/r/${id}`;
  } catch (e) {
    return routineShareUrl(variant, lang, from);
  }
};

// ¿El link con el que se abrió la app trae una rutina? Devuelve la rutina (link largo),
// { id } (link corto, hay que pedirla) o null.
export const readSharedRoutineFromUrl = () => {
  try {
    const short = (window.location.pathname || '').match(SHORT_PATH);
    if (short) return { id: short[1] };
    const hash = window.location.hash || '';
    const m = hash.match(new RegExp(`${ROUTINE_HASH_KEY}=([A-Za-z0-9_-]+)`));
    return m ? decodeRoutine(m[1]) : null;
  } catch (e) {
    return null;
  }
};

export const fetchSharedRoutine = async (id) => {
  const res = await fetch(`/api/routine-link?id=${encodeURIComponent(id)}`);
  if (res.status === 404) return { error: 'gone' };
  if (!res.ok) return { error: 'error' };
  const json = await res.json();
  const routine = normalizePayload(json.routine);
  return routine ? { routine } : { error: 'error' };
};

export const clearSharedRoutineFromUrl = () => {
  try {
    window.history.replaceState(null, '', '/');
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
