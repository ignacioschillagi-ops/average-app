import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const { code, data, apiKey } = req.body || {};
  if (!code || typeof code !== 'string') {
    res.status(400).json({ error: 'Falta el código' });
    return;
  }

  try {
    const exists = await redis.exists(`sync:${code}`);
    if (!exists) {
      res.status(404).json({ error: 'Código no encontrado' });
      return;
    }

    const payload = { data: data || null, apiKey: apiKey || '', updatedAt: Date.now() };
    await redis.set(`sync:${code}`, payload);

    res.status(200).json({ ok: true, updatedAt: payload.updatedAt });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al guardar.' });
  }
}
