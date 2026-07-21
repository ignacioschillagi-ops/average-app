import { kv } from '@vercel/kv';

// Mismos nombres que en el frontend (src/App.jsx -> SYNC_CODE_NAMES). Si agregás o sacás
// nombres, mantené las dos listas iguales para que la explicación al usuario tenga sentido.
const NAMES = [
  'Tigre', 'Leon', 'Gorila', 'Dragon', 'Titan', 'Zeus', 'Arnold', 'Rambo',
  'Ronnie', 'Cbum', 'Hercules', 'Sanson', 'Goliat', 'Thor', 'Hulk', 'Aquiles',
  'Logan', 'Joey', 'Odin', 'Ragnar', 'Gimli', 'Jack', 'Bruce', 'Norris',
];

function randomCode() {
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const num = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `${name}${num}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    let code = null;
    // Reintenta hasta encontrar un código que todavía no exista en la base.
    for (let i = 0; i < 25; i += 1) {
      const candidate = randomCode();
      // eslint-disable-next-line no-await-in-loop
      const exists = await kv.exists(`sync:${candidate}`);
      if (!exists) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      res.status(500).json({ error: 'No se pudo generar un código único. Probá de nuevo.' });
      return;
    }

    const payload = { data: null, apiKey: '', updatedAt: Date.now() };
    await kv.set(`sync:${code}`, payload);

    res.status(200).json({ code });
  } catch (err) {
    res.status(500).json({ error: 'Error del servidor al generar el código.' });
  }
}
