# Tu rutina

Proyecto Vite + React listo para deployar en Vercel.

## Qué se le cambió respecto al artifact de Claude

- **Almacenamiento**: el artifact usa `window.storage` (propio de Claude.ai). Acá lo reemplacé
  por un shim que usa `localStorage` del navegador (ver el objeto `storage` al inicio de
  `src/App.jsx`). Esto significa que la rutina se guarda **por navegador/dispositivo**, no
  se sincroniza entre celular y computadora. Si más adelante querés que la misma rutina
  se vea en todos tus dispositivos, hay que sumar un backend (Vercel KV, Supabase, etc.) —
  avisame si querés que te arme esa parte.
- **Favicon y título**: ahora se definen en `index.html` (`public/favicon.svg`), no con el
  efecto dinámico que usaba el artifact.

## Probar en local

```bash
npm install
npm run dev
```

## Deploy en Vercel

1. Subí esta carpeta a un repo de GitHub (o usá `vercel` CLI directo desde acá).
2. En [vercel.com](https://vercel.com), "Add New Project" → importá el repo.
3. Vercel detecta Vite automáticamente (build command `vite build`, output `dist`). No hace
   falta configurar nada más.
4. Deploy.

O directo desde la terminal, sin GitHub:

```bash
npm install -g vercel
vercel
```

## Estructura

```
├── index.html          # HTML base, favicon y título
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg      # tu logo (averas_joes-03)
└── src/
    ├── main.jsx          # punto de entrada de React
    └── App.jsx           # toda la app (lo que antes era el artifact)
```
