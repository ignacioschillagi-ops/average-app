// Fechas y duraciones (formato local, en el idioma elegido).
import { tr, getLang } from '../i18n';
import { WEEKDAY_NAMES, MONTH_NAMES } from '../i18n-content';

// Duraciones de más de 5 h casi seguro son casillas marcadas en días distintos: no se muestran.
export const MAX_WORKOUT_MS = 5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const pad2 = (n) => String(n).padStart(2, '0');

export const localDateKey = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const dateFromKey = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// Clave del lunes de la semana de esa fecha (las semanas arrancan el lunes).
export const weekKeyOf = (tsOrKey) => {
  const d = typeof tsOrKey === 'string' ? dateFromKey(tsOrKey) : new Date(tsOrKey);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return localDateKey(monday.getTime());
};

export const addDaysKey = (key, n) => {
  const d = dateFromKey(key);
  return localDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime());
};

export const formatClock = (ts) => {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export const workoutDurationMs = (entry) => {
  const ms = (entry.completedAt || 0) - (entry.startedAt || 0);
  return ms >= 60 * 1000 && ms <= MAX_WORKOUT_MS ? ms : null;
};

export const formatDuration = (ms) => {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h} h ${pad2(m)} min` : `${m} min`;
};

export const monthName = (m) => MONTH_NAMES[getLang()][m];

export const formatLongDate = (dateKey) => {
  const d = dateFromKey(dateKey);
  const weekday = WEEKDAY_NAMES[getLang()][(d.getDay() + 6) % 7];
  return tr('dateLong', { weekday, d: d.getDate(), month: monthName(d.getMonth()) });
};

// "12 oct" / "Oct 12" / "12 ott", para ejes y listas cortas.
export const formatShortDate = (dateKey) => {
  const d = dateFromKey(dateKey);
  const month = monthName(d.getMonth()).slice(0, 3);
  return getLang() === 'en' ? `${month} ${d.getDate()}` : `${d.getDate()} ${month}`;
};

export const daysBetweenKeys = (fromKey, toKey) => Math.round((dateFromKey(toKey) - dateFromKey(fromKey)) / DAY_MS);

export const daysAgoLabel = (dateKey) => {
  const diff = daysBetweenKeys(dateKey, localDateKey(Date.now()));
  if (diff <= 0) return tr('today');
  if (diff === 1) return tr('yesterday');
  return tr('daysAgo', { n: diff });
};
