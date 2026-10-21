import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Links cortos para compartir rutinas: average-app.vercel.app/r/K7P2QMX
// POST { routine } → guarda la rutina (formato compacto de src/lib/share.js) y devuelve { id }
// GET  ?id=K7P2QMX → { routine }
// Duran un año desde que se crean.

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const ID_LENGTH = 7;
const TTL_SECONDS = 365 * 24 * 60 * 60;
const MAX_BYTES = 12000;

const randomId = () => Array.from({ length: ID_LENGTH }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
const isValidRoutine = (r) => r && typeof r === 'object' && r.v === 1 && Array.isArray(r.d) && r.d.length > 0 && r.d.length <= 7;

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const id = String(req.query.id || '').replace(/[^A-Za-z0-9]/g, '');
      if (id.length !== ID_LENGTH) {
        res.status(400).json({ error: 'Link inválido' });
        return;
      }
      const routine = await redis.get(`routine:${id}`);
      if (!routine) {
        res.status(404).json({ error: 'Esta rutina ya no está disponible' });
        return;
      }
      res.status(200).json({ routine });
      return;
    }

    if (req.method === 'POST') {
      const { routine } = req.body || {};
      if (!isValidRoutine(routine) || JSON.stringify(routine).length > MAX_BYTES) {
        res.status(400).json({ error: 'Rutina inválida' });
        return;
      }
      for (let i = 0; i < 10; i += 1) {
        const id = randomId();
        // eslint-disable-next-line no-await-in-loop
        const ok = await redis.set(`routine:${id}`, routine, { nx: true, ex: TTL_SECONDS });
        if (ok) {
          res.status(200).json({ id });
          return;
        }
      }
      res.status(500).json({ error: 'No se pudo crear el link' });
      return;
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor.' });
  }
}
