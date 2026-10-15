import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// GET ?code=K7P2QM → { summary, updatedAt } de un compañero (solo lectura).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  const raw = typeof req.query.code === 'string' ? req.query.code : '';
  const code = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (code.length !== 6) {
    res.status(400).json({ error: 'Código inválido' });
    return;
  }
  try {
    const payload = await redis.get(`buddy:${code}`);
    if (!payload) {
      res.status(404).json({ error: 'Código no encontrado' });
      return;
    }
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor.' });
  }
}
