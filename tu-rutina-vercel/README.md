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
- **Entrenador con IA (Joe's)**: llama directo desde el navegador a la API de Groq
  (`https://api.groq.com/openai/v1/chat/completions`) usando la API key que cada persona pega
  en la pestaña "Joe's". La key se guarda en `localStorage`, nunca pasa por ningún servidor
  propio. Si Groq llega a cambiar o discontinuar el modelo `llama-3.3-70b-versatile`, se
  actualiza en la constante `GROQ_MODEL` al principio de `src/App.jsx`.
- **Funciona sin internet (menos el chat)**: agregué `vite-plugin-pwa`, que genera un
  service worker (`vite.config.js`). Una vez que se abrió la app con conexión al menos una
  vez (o se instaló en el celu), el resto de las veces carga y funciona sin internet: ver y
  editar rutinas, tildar ejercicios, el cronómetro, todo local. Lo único que sigue
  necesitando conexión sí o sí es el chat con Joe's, porque habla en vivo con Groq — eso no
  se puede cachear. No hace falta ningún APK ni empaquetado nativo para esto, es estándar
  de cualquier PWA instalada.
- **Consultas de ejercicios (wger.de)**: cuando el usuario tiene dudas sobre un ejercicio,
  Joe's puede pedirle a la app que busque en la base pública de wger.de (en español, sin
  API key) y le muestra una tarjeta con imagen, músculos, equipo y una descripción corta.
  Esto llama a `wger.de/api/v2/exercise/search/` y `wger.de/api/v2/exerciseinfo/{id}/`
  directo desde el navegador — **no pude probar esto contra la API real** desde mi entorno
  (no tengo salida de red hacia wger.de acá), así que lo armé con manejo de errores en cada
  paso y un link de respaldo a wger.de si algo no encaja. Probalo en serio una vez
  deployado; si la respuesta de wger no calza con lo que asumí (nombres de campos,
  traducciones), avisame y lo ajusto. Si el navegador bloquea las llamadas por CORS, la
  solución sería agregar una function serverless chiquita en Vercel que haga de intermediario.

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
├── vite.config.js      # incluye vite-plugin-pwa (service worker / offline)
├── public/
│   ├── favicon.svg
│   ├── icon-180.png     # apple-touch-icon
│   ├── icon-192.png     # ícono para Android / manifest
│   └── icon-512.png     # ícono para Android / manifest
└── src/
    ├── main.jsx          # punto de entrada de React
    └── App.jsx           # toda la app (lo que antes era el artifact)
```
