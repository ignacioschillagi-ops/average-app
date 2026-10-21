import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// Compañeros mutuos. Cada persona se identifica con su código de sincronización (secreto) y
// el servidor busca su código de compañero (público). Los vínculos van en los dos sentidos:
//   buddy-links:<código de compañero> = conjunto de códigos con los que comparte.
// Solo quien está vinculado puede ver el resumen del otro.
//
// POST { code, action: 'link',   friend } → se vinculan los dos; devuelve el resumen del amigo
// POST { code, action: 'unlink', friend } → se desvinculan los dos (ninguno ve al otro)
// POST { code, action: 'list' }           → compañeros vinculados con su resumen

const cleanFriend = (raw) => String(raw || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
const linksKey = (buddyCode) => `buddy-links:${buddyCode}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  const { code, action, friend } = req.body || {};
  if (!code || typeof code !== 'string' || code.length > 40) {
    res.status(400).json({ error: 'Falta el código' });
    return;
  }

  try {
    const me = await redis.get(`sync-buddy:${code}`);
    if (!me) {
      res.status(409).json({ error: 'not-sharing' });
      return;
    }

    if (action === 'list') {
      const members = (await redis.smembers(linksKey(me))) || [];
      if (!members.length) {
        res.status(200).json({ buddies: [] });
        return;
      }
      const payloads = await redis.mget(...members.map((m) => `buddy:${m}`));
      const buddies = [];
      const gone = [];
      members.forEach((m, i) => {
        const p = payloads[i];
        if (p && p.summary) buddies.push({ code: m, summary: p.summary, updatedAt: p.updatedAt || null });
        else gone.push(m);
      });
      // Los que dejaron de compartir del todo se limpian solos.
      if (gone.length) {
        await redis.srem(linksKey(me), ...gone);
        await Promise.all(gone.map((g) => redis.srem(linksKey(g), me)));
      }
      res.status(200).json({ buddies });
      return;
    }

    const other = cleanFriend(friend);
    if (other.length !== 6) {
      res.status(400).json({ error: 'invalid' });
      return;
    }

    if (action === 'unlink') {
      await redis.srem(linksKey(me), other);
      await redis.srem(linksKey(other), me);
      res.status(200).json({ ok: true });
      return;
    }

    if (action === 'link') {
      if (other === me) {
        res.status(400).json({ error: 'self' });
        return;
      }
      const payload = await redis.get(`buddy:${other}`);
      if (!payload) {
        res.status(404).json({ error: 'notfound' });
        return;
      }
      await redis.sadd(linksKey(me), other);
      await redis.sadd(linksKey(other), me);
      res.status(200).json({ code: other, summary: payload.summary, updatedAt: payload.updatedAt || null });
      return;
    }

    res.status(400).json({ error: 'Acción desconocida' });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor.' });
  }
}
