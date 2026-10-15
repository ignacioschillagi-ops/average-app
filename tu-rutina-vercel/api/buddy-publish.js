import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Código de compañero: 6 caracteres fáciles de dictar (sin 0/O ni 1/I).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomBuddyCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');

const STATUSES = ['met', 'saved', 'missed', 'current', 'none'];
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const int = (n, min, max) => Math.max(min, Math.min(max, Math.round(Number(n) || 0)));

// Solo se guarda lo mínimo para que un amigo vea si fuiste: nombre, objetivo y días entrenados.
const sanitize = (s) => {
  const summary = s && typeof s === 'object' ? s : {};
  return {
    name: typeof summary.name === 'string' ? summary.name.slice(0, 30) : '',
    goal: int(summary.goal, 1, 7),
    weekCount: int(summary.weekCount, 0, 7),
    streak: int(summary.streak, 0, 520),
    lastDate: isDate(summary.lastDate) ? summary.lastDate : null,
    weekDates: (Array.isArray(summary.weekDates) ? summary.weekDates : []).slice(0, 7).map((d) => ({
      date: isDate(d && d.date) ? d.date : '',
      trained: !!(d && d.trained),
      today: !!(d && d.today),
      future: !!(d && d.future),
    })),
    weeks: (Array.isArray(summary.weeks) ? summary.weeks : []).slice(-8).filter((w) => STATUSES.includes(w)),
  };
};

// POST { code: código de sincronización (secreto), summary }      → publica y devuelve { buddyCode }
// POST { code, stop: true }                                         → deja de compartir
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  const { code, summary, stop } = req.body || {};
  if (!code || typeof code !== 'string' || code.length > 40) {
    res.status(400).json({ error: 'Falta el código' });
    return;
  }

  try {
    const exists = await redis.exists(`sync:${code}`);
    if (!exists) {
      res.status(404).json({ error: 'Código no encontrado' });
      return;
    }
    let buddyCode = await redis.get(`sync-buddy:${code}`);

    if (stop) {
      if (buddyCode) {
        await redis.del(`buddy:${buddyCode}`);
        await redis.del(`sync-buddy:${code}`);
      }
      res.status(200).json({ ok: true });
      return;
    }

    if (!buddyCode) {
      for (let i = 0; i < 25 && !buddyCode; i += 1) {
        const candidate = randomBuddyCode();
        // eslint-disable-next-line no-await-in-loop
        if (!(await redis.exists(`buddy:${candidate}`))) buddyCode = candidate;
      }
      if (!buddyCode) {
        res.status(500).json({ error: 'No se pudo generar un código. Probá de nuevo.' });
        return;
      }
      await redis.set(`sync-buddy:${code}`, buddyCode);
    }

    await redis.set(`buddy:${buddyCode}`, { summary: sanitize(summary), updatedAt: Date.now() });
    res.status(200).json({ buddyCode });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al compartir.' });
  }
}
