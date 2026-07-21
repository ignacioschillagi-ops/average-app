import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Falta el código' });
    return;
  }

  try {
    const payload = await redis.get(`sync:${code}`);
    if (!payload) {
      res.status(404).json({ error: 'Código no encontrado' });
      return;
    }
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al buscar el código.' });
  }
}
